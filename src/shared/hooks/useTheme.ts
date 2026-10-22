import { useEffect, useLayoutEffect, useState } from "react";
import { readThemePreference, resolveTheme, saveThemePreference } from "../lib/theme";
import type { ThemePreference } from "../lib/theme";

export function useTheme() {
  const [preference, setPreference] = useState(() => readThemePreference());
  const [media] = useState(() => window.matchMedia("(prefers-color-scheme: dark)"));
  const [systemDark, setSystemDark] = useState(media.matches);
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const update = () => setSystemDark(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, [media]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0c0c0c" : "#ffffff");
  }, [theme]);

  return { theme, setPreference(value: ThemePreference) {
    saveThemePreference(value);
    setPreference(value);
  } };
}
