import { useTranslation } from "react-i18next";
import type { Theme } from "../lib/theme";
import { Icon } from "./Icon";

export function ThemeSwitcher({ theme, onChange }: {
  theme: Theme; onChange: (value: Theme) => void;
}) {
  const { t } = useTranslation();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = t(nextTheme === "light" ? "theme.switchToLight" : "theme.switchToDark");
  return <button type="button" className="icon-button" aria-label={label} title={label}
    onClick={() => onChange(nextTheme)}>
    <Icon name={nextTheme === "light" ? "sun" : "moon"} />
  </button>;
}
