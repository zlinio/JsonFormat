import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { foldAll, unfoldAll } from "@codemirror/language";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { Icon } from "./components/Icon";
import { JsonEditor } from "./components/JsonEditor";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { useTheme } from "./hooks/useTheme";
import { useJsonFormatter } from "./hooks/useJsonFormatter";
import { issueMessage } from "./i18n/issueMessage";

type Notice = {
  key: "notifications.copySuccess" | "notifications.copyFallback" | "notifications.downloadSuccess";
  params?: { filename: string };
};

export default function App() {
  const { t, i18n } = useTranslation();
  const { theme, preference, setPreference } = useTheme();
  const [source, setSource] = useState("");
  const [toast, setToast] = useState<Notice | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const inputEditor = useRef<ReactCodeMirrorRef>(null);
  const outputEditor = useRef<ReactCodeMirrorRef>(null);
  const result = useJsonFormatter(source, 2);
  const valid = result.status === "valid";
  const locale = i18n.resolvedLanguage ?? "en";

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t("app.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.description"));
  }, [locale, t]);

  function notify(key: Notice["key"], params?: Notice["params"]) {
    setToast({ key, params });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }

  function clearSource() {
    const view = inputEditor.current?.view;
    if (view) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" }, selection: { anchor: 0 } });
      view.focus();
    }
    setSource("");
  }

  async function copyOutput() {
    if (result.status !== "valid") return;
    try {
      await navigator.clipboard.writeText(result.output);
      notify("notifications.copySuccess");
    } catch {
      const view = outputEditor.current?.view;
      if (view) {
        view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
        view.focus();
      }
      notify("notifications.copyFallback");
    }
  }

  function downloadOutput() {
    if (result.status !== "valid") return;
    const url = URL.createObjectURL(new Blob([result.output + "\n"], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "formatted.json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("notifications.downloadSuccess", { filename: "formatted.json" });
  }

  function jumpToError() {
    const view = inputEditor.current?.view;
    if (result.status !== "error" || !view) return;
    view.dispatch({ selection: { anchor: Math.min(result.issue.offset, source.length) }, scrollIntoView: true });
    view.focus();
  }

  return <div className="app-shell">
    <main>
      <section className="workspace" aria-label={t("app.workspace")}>
        <div className="panes">
          <section className="pane input-pane" aria-labelledby="input-heading">
            <div className="pane-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 id="input-heading">{t("pane.input")}</h2>
                <span className="type-label">{t("pane.inputBadge")}</span>
              </div>
              <button className="icon-button" disabled={!source} onClick={clearSource}
                aria-label={t("actions.clear")} title={t("actions.clear")}><Icon name="trash" /></button>
            </div>
            <div className="editor-container">
              <JsonEditor value={source} dark={theme === "dark"} wrap indentation={2} onChange={setSource}
                editorRef={inputEditor} issue={result.status === "error" ? result.issue : undefined} />
            </div>
          </section>

          <section className="pane output-pane" aria-labelledby="output-heading">
            <div className="pane-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 id="output-heading">{t("pane.output")}</h2>
                <span className="type-label output-label">{t("pane.outputBadge")}</span>
              </div>
              <div className="pane-actions flex items-center gap-1">
                <button className="icon-button" disabled={!valid} aria-label={t("actions.foldAll")} title={t("actions.foldAll")}
                  onClick={() => { const view = outputEditor.current?.view; if (view) foldAll(view); }}><Icon name="fold" /></button>
                <button className="icon-button" disabled={!valid} aria-label={t("actions.unfoldAll")} title={t("actions.unfoldAll")}
                  onClick={() => { const view = outputEditor.current?.view; if (view) unfoldAll(view); }}><Icon name="unfold" /></button>
                <span className="toolbar-divider" />
                <button className="icon-button" disabled={!valid} onClick={downloadOutput}
                  aria-label={t("actions.download")} title={t("actions.download")}><Icon name="download" /></button>
                <button className="icon-button" disabled={!valid} onClick={copyOutput}
                  aria-label={t("actions.copy")} title={t("actions.copy")}><Icon name="copy" /></button>
                <LanguageSwitcher />
                <ThemeSwitcher theme={theme} preference={preference} onChange={setPreference} />
              </div>
            </div>
            <div className="editor-container result-container" aria-busy={result.status === "pending"}>
              {result.status === "valid"
                ? <JsonEditor value={result.output} dark={theme === "dark"} wrap indentation={2} readOnly editorRef={outputEditor} />
                : <div className={"result-placeholder" + (result.status === "error" ? " has-error" : "")} role="status" aria-live="polite">
                  {result.status === "error" ? <>
                    <div className="empty-symbol error-symbol"><Icon name="alert" width={30} height={30} /></div>
                    <h3>{t("state.errorTitle")}</h3><p>{issueMessage(t, result.issue)}</p>
                    <button className="text-button error-jump" onClick={jumpToError}>
                      {t("state.jumpToError", { line: result.issue.line, column: result.issue.column })}
                      <Icon name="arrow" width={15} height={15} />
                    </button>
                  </> : result.status === "pending" ? <>
                    <div className="empty-symbol"><span className="spinner" /></div>
                    <h3>{t("state.pendingTitle")}</h3><p>{t("state.pendingBody")}</p>
                  </> : <>
                    <div className="empty-symbol brace-symbol" aria-hidden="true">
                      <span>{"{"}</span><div><i /><i /><i /></div><span>{"}"}</span>
                    </div>
                    <h3>{t("state.emptyTitle")}</h3><p>{t("state.emptyBody")}</p>
                  </>}
                </div>}
            </div>
          </section>
        </div>
      </section>
    </main>
    <div className={"toast" + (toast ? " is-visible" : "")} role="status" aria-live="polite">
      {toast && <><Icon name="check" width={17} height={17} /><span>{t(toast.key, { filename: toast.params?.filename })}</span>
        <button className="icon-button" aria-label={t("actions.closeToast")} onClick={() => setToast(null)}><Icon name="close" width={15} height={15} /></button>
      </>}
    </div>
  </div>;
}
