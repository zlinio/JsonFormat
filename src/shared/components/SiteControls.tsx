import { useAppearance } from "../../app/AppProviders";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function SiteControls() {
  const { theme, setPreference } = useAppearance();
  return <div className="site-controls">
    <LanguageSwitcher />
    <ThemeSwitcher theme={theme} onChange={setPreference} />
  </div>;
}
