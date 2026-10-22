export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";
// Keep the original key so existing preferences survive the Toolbox rename.
export const themeStorageKey = "json-format.theme";

export function readThemePreference(storage: () => Pick<Storage, "getItem"> = () => window.localStorage): ThemePreference {
  try {
    const value = storage().getItem(themeStorageKey);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function saveThemePreference(value: ThemePreference, storage: () => Pick<Storage, "setItem" | "removeItem"> = () => window.localStorage) {
  try {
    if (value === "system") storage().removeItem(themeStorageKey);
    else storage().setItem(themeStorageKey, value);
  } catch {
    // The current page can still switch themes when storage is unavailable.
  }
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): Theme {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}
