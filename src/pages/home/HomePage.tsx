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
    <main className="directory-main">
      <div className="directory-intro"><h1>{t("home.title")}</h1><p>{t("home.description")}</p></div>
      <section aria-labelledby="tools-heading">
        <div className="directory-labels"><h2 id="tools-heading">{t("home.available")}</h2><span>{t("home.open")}</span></div>
        <ul className="tool-list">
          {tools.map(tool => <li key={tool.id}>
            <Link className="tool-row" to={tool.path} aria-labelledby={`tool-${tool.id}-name`} aria-describedby={`tool-${tool.id}-description`}>
              <span className="tool-symbol"><Icon name={tool.icon} width={30} height={30} /></span>
              <div className="tool-info"><h3 id={`tool-${tool.id}-name`}>{t(tool.nameKey)}</h3><p id={`tool-${tool.id}-description`}>{t(tool.descriptionKey)}</p></div>
              <span className="tool-category">{t(tool.categoryKey)}</span>
              <Icon name="arrow" className="tool-open-arrow" />
            </Link>
          </li>)}
        </ul>
      </section>
    </main>
  </div>;
}
