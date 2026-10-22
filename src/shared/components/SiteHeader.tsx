import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { SiteControls } from "./SiteControls";

export function SiteHeader() {
  const { t } = useTranslation();
  return <header className="site-header">
    <Link className="site-brand" to="/" aria-label={t("navigation.home")}>
      <Icon name="braces" width={22} height={22} /><span>TOOLBOX</span>
    </Link>
    <SiteControls />
  </header>;
}
