import { useTranslation } from "react-i18next";
import type { Theme } from "../lib/theme";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export function ThemeSwitcher({ theme, onChange }: {
  theme: Theme; onChange: (value: Theme) => void;
}) {
  const { t } = useTranslation();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = t(nextTheme === "light" ? "theme.switchToLight" : "theme.switchToDark");
  return <IconButton className="theme-toggle" label={label}
    onClick={() => onChange(nextTheme)}>
    <Icon name="sun" className={nextTheme === "light" ? "is-visible" : undefined} />
    <Icon name="moon" className={nextTheme === "dark" ? "is-visible" : undefined} />
  </IconButton>;
}
