import { Component } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "../shared/components/SiteHeader";

export function RouteStatus({ kind }: { kind: "loading" | "notFound" | "error" }) {
  const { t } = useTranslation();
  return <><SiteHeader /><main className="route-status" aria-busy={kind === "loading"}>
    <h1>{t(`routes.${kind}.title`)}</h1><p role={kind === "loading" ? "status" : undefined}>{t(`routes.${kind}.description`)}</p>
    {kind !== "loading" && <div className="route-status-actions">
      <Link to="/" className="text-button">{t("navigation.back")}</Link>
      {kind === "error" && <button type="button" className="text-button" onClick={() => window.location.reload()}>{t("routes.reload")}</button>}
    </div>}
  </main></>;
}

export class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RouteStatus kind="error" /> : this.props.children; }
}
