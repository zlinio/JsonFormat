import { useTranslation } from "react-i18next";
import type { Theme, ThemePreference } from "../lib/theme";
import { PreferenceMenu } from "./PreferenceMenu";

export function ThemeSwitcher({ theme, preference, onChange }: {
  theme: Theme; preference: ThemePreference; onChange: (value: ThemePreference) => void;
}) {
  const { t } = useTranslation();
  return <PreferenceMenu<ThemePreference> label={t("theme.change")}
    icon={preference === "system" ? "monitor" : theme === "dark" ? "moon" : "sun"}
    value={preference} onChange={onChange} choices={[
      { value: "system", label: t("theme.system") },
      { value: "light", label: t("theme.light") },
      { value: "dark", label: t("theme.dark") },
    ]} />;
}
