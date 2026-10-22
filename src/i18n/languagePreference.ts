import { languageStorageKey, normalizeLanguage } from "./resources";
import type { Locale } from "./resources";

export type LanguagePreference = Locale | "auto";
type PreferenceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Keep the chosen mode separate from the language detected for this visit.
export function createLanguagePreference(storage: () => PreferenceStorage = () => window.localStorage) {
  let current: LanguagePreference = "auto";
  try {
    current = normalizeLanguage(storage().getItem(languageStorageKey) ?? "") ?? "auto";
  } catch {
    // Browsers may deny storage access; the in-memory preference still works.
  }
  return {
    get: () => current,
    set(value: LanguagePreference) {
      current = value;
      try {
        if (value === "auto") storage().removeItem(languageStorageKey);
        else storage().setItem(languageStorageKey, value);
      } catch {
        // Retain this choice for the current page when persistence is unavailable.
      }
    },
    detector: {
      name: "languagePreference",
      lookup: () => current === "auto" ? undefined : current,
    },
  };
}
