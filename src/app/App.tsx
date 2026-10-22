import { Suspense, useEffect } from "react";
import { HashRouter, Route, Routes, matchPath, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { AppProviders } from "./AppProviders";
import { RouteBoundary, RouteStatus } from "./RouteStatus";
import HomePage from "../pages/home/HomePage";
import { tools } from "../tool-registry";

function AppRoutes() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const tool = tools.find(item => matchPath(item.path, pathname));
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en";
    document.title = tool ? t(tool.titleKey) : pathname === "/" ? t("app.title") : t("routes.notFound.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", tool ? t(tool.descriptionKey) : t("app.description"));
  }, [tool, pathname, t, i18n.resolvedLanguage]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return <RouteBoundary key={pathname}><Suspense fallback={<RouteStatus kind="loading" />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      {tools.map(({ id, path, Component }) => <Route key={id} path={path} element={<Component />} />)}
      <Route path="*" element={<RouteStatus kind="notFound" />} />
    </Routes>
  </Suspense></RouteBoundary>;
}

export default function App() {
  return <HashRouter><AppProviders><AppRoutes /></AppProviders></HashRouter>;
}
