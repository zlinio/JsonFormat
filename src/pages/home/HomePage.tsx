import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { tools } from "../../tool-registry";
import { Icon } from "../../shared/components/Icon";
import { SiteHeader } from "../../shared/components/SiteHeader";
import "./home.css";

export default function HomePage() {
  const { t } = useTranslation();
  return <div className="directory-page">
    <SiteHeader />
    <main className="directory-main" aria-label={t("home.title")}>
      <ul className="tool-list" aria-label={t("home.available")}>
        {tools.map(tool => <li key={tool.id}>
          <Link className="tool-row" to={tool.path} aria-labelledby={`tool-${tool.id}-name`}>
            <span className="tool-symbol"><Icon name={tool.icon} width={22} height={22} /></span>
            <span className="tool-name" id={`tool-${tool.id}-name`}>{t(tool.nameKey)}</span>
            <Icon name="arrow" className="tool-open-arrow" />
          </Link>
        </li>)}
      </ul>
    </main>
  </div>;
}
