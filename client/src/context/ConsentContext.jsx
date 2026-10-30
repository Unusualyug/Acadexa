import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

/**
 * Cookie consent.
 *
 * Storage model:
 *  - The decision itself lives in localStorage (`acadexa_consent_v1`) so it is
 *    available before any network call and survives a server outage.
 *  - A copy is sent to `POST /api/consent` as evidence of the choice, with the
 *    visitor's random id — never a fingerprint and never the raw IP.
 *  - "Necessary" is not a choice: the session cookie is required to sign in.
 */
const STORAGE_KEY = 'acadexa_consent_v1';
export const CONSENT_VERSION = '2026-01';

export const CATEGORIES = [
  {
    key: 'necessary',
    name: 'Strictly necessary',
    required: true,
    summary: 'Keeps you signed in and protects forms against cross-site requests.',
    detail:
      'One httpOnly session cookie (sd_token) issued when you sign in, plus a CSRF-safe sameSite setting. Without it you cannot stay logged in, so it cannot be switched off. It contains no advertising identifier.',
    cookies: [{ name: 'sd_token', purpose: 'Authenticated session', duration: 'Up to 90 days while you keep using Acadexa, or until you sign out' }],
  },
  {
    key: 'analytics',
    name: 'Analytics',
    required: false,
    summary: 'First-party page-view counts so we can see which pages are actually useful.',
    detail:
      'No third-party tracker and no advertising ID. If enabled, the app records the page path and a random visitor id in our own database — never your IP, never the query string. If disabled, nothing is recorded at all.',
    cookies: [{ name: 'None — first-party request only', purpose: 'Page-view counting', duration: 'Stored for 180 days, then deleted' }],
  },
  {
    key: 'marketing',
    name: 'Marketing',
    required: false,
    summary: 'Reserved for advertising or remarketing tags.',
    detail:
      'Acadexa currently runs no advertising or marketing cookies. This switch is here so that consent is recorded before such a tool could ever be added — and if one is added later, it will not load unless this is switched on.',
    cookies: [{ name: 'None currently set', purpose: '—', duration: '—' }],
  },
];

const DEFAULT_STATE = {
  necessary: true,
  analytics: false,
  marketing: false,
  action: null,
  decidedAt: null,
  policyVersion: CONSENT_VERSION,
};

const ConsentContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      action: parsed.action || 'custom',
      decidedAt: parsed.decidedAt || null,
      policyVersion: parsed.policyVersion || CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

/** Stable per-browser id used only to key the consent record and analytics counts. */
export function getVisitorId() {
  const KEY = 'acadexa_visitor_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readStored() || DEFAULT_STATE);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });
  const synced = useRef(false);

  // Show the banner only when there is no decision, or the policy version moved on.
  useEffect(() => {
    const stored = readStored();
    if (!stored || stored.policyVersion !== CONSENT_VERSION) setBannerOpen(true);
  }, []);

  const persist = useCallback(async (next, action) => {
    const record = {
      necessary: true,
      analytics: Boolean(next.analytics),
      marketing: Boolean(next.marketing),
      action,
      decidedAt: new Date().toISOString(),
      policyVersion: CONSENT_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch { /* storage blocked: the session-only state below still applies */ }
    setConsent(record);
    setBannerOpen(false);
    setPreferencesOpen(false);

    // Evidence copy on the server. Failure is non-fatal: the local decision stands.
    const visitorId = getVisitorId();
    if (visitorId) {
      try {
        await api.post('/consent', {
          visitorId,
          action,
          categories: { necessary: true, analytics: record.analytics, marketing: record.marketing },
        });
      } catch { /* offline or blocked: keep the local choice */ }
    }
    return record;
  }, []);

  const acceptAll = useCallback(() => persist({ analytics: true, marketing: true }, 'accept_all'), [persist]);
  const rejectOptional = useCallback(() => persist({ analytics: false, marketing: false }, 'reject_optional'), [persist]);
  const savePreferences = useCallback((next) => persist(next, 'custom'), [persist]);

  const openPreferences = useCallback(() => {
    setDraft({ analytics: consent.analytics, marketing: consent.marketing });
    setPreferencesOpen(true);
  }, [consent.analytics, consent.marketing]);

  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const hasDecided = Boolean(consent.decidedAt);
  const allowed = useCallback((key) => (key === 'necessary' ? true : Boolean(consent[key])), [consent]);

  // Consent-gated first-party analytics: one event per route per session.
  useEffect(() => {
    if (!consent.analytics) return;
    const visitorId = getVisitorId();
    if (!visitorId) return;
    const SENT_KEY = 'acadexa_views_sent';
    const readSent = () => {
      try { return new Set(JSON.parse(sessionStorage.getItem(SENT_KEY) || '[]')); } catch { return new Set(); }
    };
    const send = () => {
      const path = window.location.pathname;
      // One event per route per browser session, across reloads and StrictMode remounts.
      const sent = readSent();
      if (sent.has(path)) return;
      sent.add(path);
      try { sessionStorage.setItem(SENT_KEY, JSON.stringify([...sent])); } catch { /* storage blocked */ }
      api.post('/consent/analytics/event', { visitorId, path, referrerHost: document.referrer ? new URL(document.referrer).host : '' }).catch(() => {});
    };
    send();
    const onPop = () => setTimeout(send, 50);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [consent.analytics]);

  const value = useMemo(
    () => ({
      consent,
      allowed,
      hasDecided,
      bannerOpen,
      preferencesOpen,
      draft,
      setDraft,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
      openBanner: () => setBannerOpen(true),
    }),
    [consent, allowed, hasDecided, bannerOpen, preferencesOpen, draft, acceptAll, rejectOptional, savePreferences, openPreferences, closePreferences]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used inside ConsentProvider');
  return ctx;
}

/**
 * Renders children only when the visitor consented to `category`.
 * Any future analytics or marketing script must be mounted through this gate.
 */
export function ConsentGate({ category, children, fallback = null }) {
  const { allowed } = useConsent();
  return allowed(category) ? children : fallback;
}
