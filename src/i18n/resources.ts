import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export const resources = {
  en: { translation: en },
  "zh-CN": { translation: zhCN },
} as const;

export type Locale = keyof typeof resources;
export const languageStorageKey = "json-format.language";

export function normalizeLanguage(language: string): Locale | undefined {
  const base = language.toLowerCase().split(/[-_]/)[0];
  if (base === "zh") return "zh-CN";
  if (base === "en") return "en";
  return undefined;
}
