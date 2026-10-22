import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources, languageStorageKey, normalizeLanguage } from "./resources";

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["zh-CN", "en"],
    fallbackLng: "en",
    load: "currentOnly",
    initAsync: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: languageStorageKey,
      caches: ["localStorage"],
      convertDetectedLanguage: language => normalizeLanguage(language) ?? language,
    },
  });

export default i18n;
