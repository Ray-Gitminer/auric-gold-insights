import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Context,
  type ReactNode,
} from "react";

import { en, type TranslationKey } from "@/locales/en";
import { th } from "@/locales/th";
import { fixturesTh } from "@/locales/fixtures-th";

export type Language = "th" | "en";

const DICTS = { th, en } as const;
const STORAGE_KEY = "auriq.lang";
export const DEFAULT_LANGUAGE: Language = "th";

type Vars = Record<string, string | number>;

type I18nValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  /** Translate demo fixture content (English source string) for the active language. */
  tx: (text: string) => string;
};

// Keep a single context instance across hot-module reloads, otherwise consumers
// that were re-evaluated separately read a different (empty) context and throw.
const globalScope = globalThis as typeof globalThis & {
  __auriqI18nContext?: Context<I18nValue | null>;
};
const I18nContext =
  globalScope.__auriqI18nContext ??
  (globalScope.__auriqI18nContext = createContext<I18nValue | null>(null));

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);

  // Read the stored preference after hydration to avoid SSR mismatches.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "th" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang];
    return {
      lang,
      setLang,
      t: (key, vars) => interpolate(dict[key] ?? en[key] ?? key, vars),
      tx: (text) => (lang === "th" ? (fixturesTh[text] ?? text) : text),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
