/**
 * Language configuration for Acadexa.
 *
 * Three languages, one default. Everything else about the system (dictionary
 * shape, fallback order, persistence, URL sync) lives in `I18nContext.jsx`;
 * this file only describes the languages themselves.
 *
 * `htmlLang` is the BCP-47 tag written to `<html lang>` — screen readers and
 * translation tools rely on it, and the CSS in `index.css` uses it to switch
 * script fonts and loosen tight tracking that Devanagari and Gujarati dislike.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', short: 'EN', htmlLang: 'en', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', short: 'हि', htmlLang: 'hi', dir: 'ltr' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', short: 'ગુ', htmlLang: 'gu', dir: 'ltr' },
];

/** First-time visitors get English unless a deployment overrides this. */
export const DEFAULT_LANGUAGE = 'en';

/** localStorage key. Prefixed like the theme and consent keys for easy auditing. */
export const LANGUAGE_STORAGE_KEY = 'acadexa_lang';

/** `?lang=hi` keeps a shareable, language-specific URL without changing routes. */
export const LANGUAGE_QUERY_KEY = 'lang';

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function isSupportedLanguage(code) {
  return LANGUAGE_CODES.includes(code);
}

/** Bare language of a tag: 'hi-IN' -> 'hi'. */
export function normaliseLanguage(code) {
  if (!code) return null;
  const bare = String(code).toLowerCase().split('-')[0];
  return isSupportedLanguage(bare) ? bare : null;
}

/**
 * Best guess for a visitor with no stored preference: the configured default,
 * unless the browser asks for one of the supported languages first.
 * Deliberately conservative — English stays the default of record.
 */
export function detectLanguage() {
  try {
    const stored = normaliseLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* storage blocked — fall through */
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = normaliseLanguage(params.get(LANGUAGE_QUERY_KEY));
    if (fromUrl) return fromUrl;
  } catch {
    /* no window (SSR/test) */
  }
  return DEFAULT_LANGUAGE;
}

export function languageMeta(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
