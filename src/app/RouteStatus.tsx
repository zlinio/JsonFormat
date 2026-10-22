import { Component } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "../shared/components/SiteHeader";
import { Button } from "../shared/components/ui/button";

export function RouteStatus({ kind }: { kind: "loading" | "notFound" | "error" }) {
  const { t } = useTranslation();
  return <><SiteHeader /><main className="route-status" aria-busy={kind === "loading"}>
    <h1>{t(`routes.${kind}.title`)}</h1><p role={kind === "loading" ? "status" : undefined}>{t(`routes.${kind}.description`)}</p>
    {kind !== "loading" && <div className="route-status-actions">
      <Button variant="outline" size="sm" asChild><Link to="/">{t("navigation.back")}</Link></Button>
      {kind === "error" && <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>{t("routes.reload")}</Button>}
    </div>}
  </main></>;
}

export class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RouteStatus kind="error" /> : this.props.children; }
}
