import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources, normalizeLanguage } from "./resources";
import { createLanguagePreference } from "./languagePreference";

export const languagePreference = createLanguagePreference();
const detector = new LanguageDetector();
detector.addDetector(languagePreference.detector);

export const i18nReady = i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["zh-CN", "en"],
    fallbackLng: "en",
    load: "currentOnly",
    initAsync: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["languagePreference", "navigator"],
      // Only explicit choices are saved; detection must not turn auto into manual.
      caches: [],
      convertDetectedLanguage: language => normalizeLanguage(language) ?? language,
    },
  });

export default i18n;
