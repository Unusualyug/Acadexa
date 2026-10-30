import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_QUERY_KEY,
  LANGUAGES,
  detectLanguage,
  languageMeta,
  normaliseLanguage,
} from "./config";
import en from "./locales/en";
import hi from "./locales/hi";
import gu from "./locales/gu";

/**
 * Acadexa's i18n layer.
 *
 * Why hand-rolled rather than i18next: the app already hand-rolls its theme,
 * consent and auth contexts, and every string here is a plain nested object.
 * This gives us one provider, no extra runtime, and (importantly) a hard
 * English fallback so a missing translation can never blank out the UI.
 *
 * Contract:
 *   t('key.path', { name: 'Yug' })  -> string ({{name}} interpolated)
 *   tl('key.path')                  -> array | object (content lists)
 *   statusLabel('In Progress')      -> translated status, key-independent
 *
 * Persistence: localStorage `acadexa_lang`. URL: `?lang=xx` is reflected with
 * history.replaceState, so the switch neither reloads the page nor resets the
 * current route — a pasted link carries the language to the next visitor.
 */
const DICTIONARIES = { en, hi, gu };

const I18nContext = createContext(null);

/** Walks a dot path through a nested dictionary. */
function lookup(dict, path) {
  if (!dict || !path) return undefined;
  return String(path)
    .split(".")
    .reduce(
      (acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined),
      dict,
    );
}

/** Replaces {{token}} placeholders; unknown tokens are left untouched. */
function interpolate(value, vars) {
  if (typeof value !== "string" || !vars) return value;
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);
  const firstRun = useRef(true);

  const meta = languageMeta(lang);

  /* Reflect the language on <html> for CSS, screen readers and search engines,
     and keep <html lang> in step with what is on screen. */
  useEffect(() => {
    const root = document.documentElement;
    root.lang = meta.htmlLang;
    root.dir = meta.dir;
    root.dataset.lang = lang;
  }, [lang, meta.htmlLang, meta.dir]);

  /* Persist, and mirror into the URL without a navigation. */
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — the choice simply does not persist */
    }
    try {
      const url = new URL(window.location.href);
      if (lang === DEFAULT_LANGUAGE)
        url.searchParams.delete(LANGUAGE_QUERY_KEY);
      else url.searchParams.set(LANGUAGE_QUERY_KEY, lang);
      const next = `${url.pathname}${url.search}${url.hash}`;
      if (
        next !==
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      ) {
        window.history.replaceState(window.history.state, "", next);
      }
    } catch {
      /* no window */
    }
    firstRun.current = false;
  }, [lang]);

  /* Someone edited ?lang= by hand, or arrived from a shared link while the app
     was already open — follow it. */
  useEffect(() => {
    const sync = () => {
      const fromUrl = normaliseLanguage(
        new URLSearchParams(window.location.search).get(LANGUAGE_QUERY_KEY),
      );
      if (fromUrl && fromUrl !== lang) setLangState(fromUrl);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      const value = lookup(DICTIONARIES[lang], key);
      const fallback = lookup(DICTIONARIES[DEFAULT_LANGUAGE], key);
      const picked =
        typeof value === "string"
          ? value
          : typeof fallback === "string"
            ? fallback
            : key;
      return interpolate(picked, vars);
    },
    [lang],
  );

  /** Arrays and objects (FAQ lists, feature cards) — falls back the same way. */
  const tl = useCallback(
    (key) => {
      const value = lookup(DICTIONARIES[lang], key);
      const fallback = lookup(DICTIONARIES[DEFAULT_LANGUAGE], key);
      return value !== undefined ? value : fallback;
    },
    [lang],
  );

  /**
   * Statuses live in MongoDB as English enums ('In Progress'). Translating them
   * by slug means the database, the API and every existing record stay
   * untouched — only the label on screen changes.
   */
  const statusLabel = useCallback(
    (status) => {
      if (!status) return "";
      const slug = String(status)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      const translated = lookup(DICTIONARIES[lang], `status.${slug}`);
      if (typeof translated === "string") return translated;
      const english = lookup(DICTIONARIES.en, `status.${slug}`);
      return typeof english === "string" ? english : String(status);
    },
    [lang],
  );

  /** Locale-aware dates and numbers (Devanagari/Gujarati month and digit names). */
  const locale = meta.htmlLang === "en" ? "en-IN" : `${meta.htmlLang}-IN`;

  const setLang = useCallback((next) => {
    const code = normaliseLanguage(next);
    if (code) setLangState(code);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      meta,
      setLang,
      t,
      tl,
      statusLabel,
      locale,
      languages: LANGUAGES,
    }),
    [lang, meta, setLang, t, tl, statusLabel, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Shorthand for the common case: const { t } = useT(). */
export function useT() {
  return useI18n();
}

export default I18nContext;
