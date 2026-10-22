import { useTranslation } from "react-i18next";
import type { Theme } from "../lib/theme";
import { Icon } from "./Icon";

export function ThemeSwitcher({ theme, onChange }: {
  theme: Theme; onChange: (value: Theme) => void;
}) {
  const { t } = useTranslation();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = t(nextTheme === "light" ? "theme.switchToLight" : "theme.switchToDark");
  return <button type="button" className="icon-button theme-toggle" aria-label={label} title={label}
    onClick={() => onChange(nextTheme)}>
    <Icon name="sun" className={nextTheme === "light" ? "is-visible" : undefined} />
    <Icon name="moon" className={nextTheme === "dark" ? "is-visible" : undefined} />
  </button>;
}
