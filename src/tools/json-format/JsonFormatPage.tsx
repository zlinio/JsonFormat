import { useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { foldAll, unfoldAll } from "@codemirror/language";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { Icon } from "../../shared/components/Icon";
import { IconButton } from "../../shared/components/IconButton";
import { Button } from "../../shared/components/ui/button";
import { Separator } from "../../shared/components/ui/separator";
import { SiteControls } from "../../shared/components/SiteControls";
import { useNotice } from "../../shared/components/ToastProvider";
import { useAppearance, useToolDraft } from "../../app/AppProviders";
import { JsonEditor } from "./components/JsonEditor";
import { useJsonFormatter } from "./hooks/useJsonFormatter";
import { issueMessage } from "./i18n/issueMessage";
import "./styles.css";

export default function JsonFormatPage() {
  const { t } = useTranslation();
  const { theme } = useAppearance();
  const [source, setSource] = useToolDraft("json-format");
  const notify = useNotice();
  const inputEditor = useRef<ReactCodeMirrorRef>(null);
  const outputEditor = useRef<ReactCodeMirrorRef>(null);
  const result = useJsonFormatter(source, 2);
  const valid = result.status === "valid";

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
      notify("copySuccess");
    } catch {
      const view = outputEditor.current?.view;
      if (view) {
        view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
        view.focus();
      }
      notify("copyFallback");
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
    notify("downloadSuccess", "formatted.json");
  }

  function jumpToError() {
    const view = inputEditor.current?.view;
    if (result.status !== "error" || !view) return;
    view.dispatch({ selection: { anchor: Math.min(result.issue.offset, source.length) }, scrollIntoView: true });
    view.focus();
  }

  return <div className="json-format">
    <main>
      <section className="workspace" aria-label={t("json.app.workspace")}>
        <div className="panes">
          <section className="pane input-pane" aria-labelledby="input-heading">
            <div className="pane-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconButton asChild label={t("navigation.back")}><Link to="/"><Icon name="back" /></Link></IconButton>
                <h2 id="input-heading">{t("json.pane.input")}</h2>
                <span className="type-label">{t("json.pane.inputBadge")}</span>
              </div>
              <IconButton disabled={!source} onClick={clearSource}
                label={t("json.actions.clear")}><Icon name="trash" /></IconButton>
            </div>
            <div className="editor-container">
              <JsonEditor value={source} dark={theme === "dark"} wrap indentation={2} onChange={setSource}
                editorRef={inputEditor} issue={result.status === "error" ? result.issue : undefined} />
            </div>
          </section>

          <section className="pane output-pane" aria-labelledby="output-heading">
            <div className="pane-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 id="output-heading">{t("json.pane.output")}</h2>
                <span className="type-label output-label">{t("json.pane.outputBadge")}</span>
              </div>
              <div className="pane-actions flex items-center gap-1">
                <IconButton disabled={!valid} label={t("json.actions.foldAll")}
                  onClick={() => { const view = outputEditor.current?.view; if (view) foldAll(view); }}><Icon name="fold" /></IconButton>
                <IconButton disabled={!valid} label={t("json.actions.unfoldAll")}
                  onClick={() => { const view = outputEditor.current?.view; if (view) unfoldAll(view); }}><Icon name="unfold" /></IconButton>
                <Separator orientation="vertical" className="toolbar-divider" />
                <IconButton disabled={!valid} onClick={downloadOutput}
                  label={t("json.actions.download")}><Icon name="download" /></IconButton>
                <IconButton disabled={!valid} onClick={copyOutput}
                  label={t("json.actions.copy")}><Icon name="copy" /></IconButton>
                <SiteControls />
              </div>
            </div>
            <div className="editor-container result-container" aria-busy={result.status === "pending"}>
              {result.status === "valid"
                ? <JsonEditor value={result.output} dark={theme === "dark"} wrap indentation={2} readOnly editorRef={outputEditor} />
                : <div className={"result-placeholder" + (result.status === "error" ? " has-error" : "")} role="status" aria-live="polite">
                  {result.status === "error" ? <>
                    <div className="empty-symbol error-symbol"><Icon name="alert" width={30} height={30} /></div>
                    <h3>{t("json.state.errorTitle")}</h3><p>{issueMessage(t, result.issue)}</p>
                    <Button variant="ghost" size="sm" className="error-jump" onClick={jumpToError}>
                      {t("json.state.jumpToError", { line: result.issue.line, column: result.issue.column })}
                      <Icon name="arrow" width={15} height={15} />
                    </Button>
                  </> : result.status === "pending" ? <>
                    <div className="empty-symbol"><span className="spinner" /></div>
                    <h3>{t("json.state.pendingTitle")}</h3><p>{t("json.state.pendingBody")}</p>
                  </> : <>
                    <div className="empty-symbol brace-symbol" aria-hidden="true">
                      <span>{"{"}</span><div><i /><i /><i /></div><span>{"}"}</span>
                    </div>
                    <h3>{t("json.state.emptyTitle")}</h3><p>{t("json.state.emptyBody")}</p>
                  </>}
                </div>}
            </div>
          </section>
        </div>
      </section>
    </main>
  </div>;
}
