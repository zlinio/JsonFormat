import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { RefObject } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { setDiagnostics } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import { search, SearchQuery, setSearchQuery } from "@codemirror/search";
import type { Indentation, JsonIssue } from "../lib/json";
import { jsonFoldGutter } from "./jsonFoldGutter";
import { editorLanguage, translateOpenEditorUI } from "../i18n/editorLanguage";
import { normalizeLanguage } from "../i18n/resources";
import { issueMessage } from "../i18n/issueMessage";

interface Props {
  value: string;
  dark: boolean;
  wrap: boolean;
  indentation: Indentation;
  readOnly?: boolean;
  issue?: JsonIssue;
  onChange?: (value: string) => void;
  editorRef?: RefObject<ReactCodeMirrorRef | null>;
}

export function JsonEditor({
  value,
  dark,
  wrap,
  indentation,
  readOnly = false,
  issue,
  onChange,
  editorRef,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLanguage(i18n.resolvedLanguage ?? "en") ?? "en";
  const localRef = useRef<ReactCodeMirrorRef>(null);
  const editor = editorRef ?? localRef;
  const languageCompartment = useMemo(() => new Compartment(), []);
  const languageExtension = useMemo(() => editorLanguage(locale, readOnly), [locale, readOnly]);
  const configureLanguage = useCallback((view: EditorView) => {
    const panel = view.dom.querySelector(".cm-search");
    const field = (name: string) => panel?.querySelector<HTMLInputElement>('input[name="' + name + '"]');
    const searchField = field("search");
    const active = document.activeElement;
    const scrollTop = view.scrollDOM.scrollTop;
    const scrollLeft = view.scrollDOM.scrollLeft;
    // Preserve drafts as well as committed queries if CodeMirror remounts a panel.
    const effects = searchField ? [setSearchQuery.of(new SearchQuery({
      search: searchField.value, replace: field("replace")?.value ?? "",
      caseSensitive: field("case")?.checked, regexp: field("re")?.checked,
      wholeWord: field("word")?.checked,
    })), languageCompartment.reconfigure(languageExtension)]
      : [languageCompartment.reconfigure(languageExtension)];
    view.dispatch({ effects });
    view.scrollDOM.scrollTop = scrollTop;
    view.scrollDOM.scrollLeft = scrollLeft;
    if (active instanceof HTMLElement && active.isConnected && document.activeElement !== active) {
      active.focus({ preventScroll: true });
    }
  }, [languageCompartment, languageExtension]);
  // Run after the wrapper has applied its own extension configuration.
  useEffect(() => {
    if (editor.current?.view) configureLanguage(editor.current.view);
  }, [configureLanguage, editor]);
  const extensions = useMemo(
    () => [
      json(),
      search(),
      jsonFoldGutter(),
      languageCompartment.of([]),
      translateOpenEditorUI,
      indentUnit.of(" ".repeat(indentation)),
      syntaxHighlighting(
        HighlightStyle.define([
          { tag: tags.propertyName, color: "var(--code-key)" },
          { tag: tags.string, color: "var(--teal)" },
          { tag: tags.number, color: "var(--code-number)" },
          { tag: [tags.bool, tags.null], color: "var(--code-literal)" },
          { tag: tags.punctuation, color: "var(--muted)" },
        ]),
      ),
      EditorView.theme(
        {
          "&": {
            height: "100%",
            fontSize: "13px",
            backgroundColor: "transparent",
            color: "var(--code-ink)",
          },
          ".cm-scroller": { fontFamily: "var(--font-code)", lineHeight: "28px", overflow: "auto" },
          ".cm-content": { padding: "20px 0", caretColor: "var(--accent)" },
          ".cm-line": { padding: "0 22px 0 12px" },
          ".cm-gutters": {
            backgroundColor: "transparent",
            color: "var(--line-number)",
            border: "none",
            padding: "0 0 0 8px",
          },
          ".cm-lineNumbers .cm-gutterElement": { minWidth: "30px", paddingRight: "12px" },
          ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--active-line)" },
          ".cm-cursor": { borderLeftColor: "var(--accent)" },
          "&.cm-focused": { outline: "none" },
          "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
            backgroundColor: "var(--selection)",
          },
          ".cm-placeholder": { color: "var(--muted)", fontFamily: "var(--font-body)" },
          ".cm-foldPlaceholder": {
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--accent)",
            padding: "0 5px",
          },
          ".cm-tooltip": {
            backgroundColor: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
          },
          ".cm-panels": { backgroundColor: "var(--surface-alt)", color: "var(--ink)" },
        },
        { dark },
      ),
      ...(wrap ? [EditorView.lineWrapping] : []),
    ],
    [dark, wrap, indentation, readOnly, languageCompartment],
  );

  useEffect(() => {
    const view = editor.current?.view;
    if (!view) return;
    view.dispatch(
      setDiagnostics(
        view.state,
        issue
          ? [
              {
                from: Math.min(issue.offset, value.length),
                to: Math.min(issue.offset + Math.max(1, issue.length), value.length),
                severity: "error",
                message: issueMessage(t, issue),
              },
            ]
          : [],
      ),
    );
  }, [issue, value, editor, t]);

  const basicSetup = useMemo(() => ({
    lineNumbers: true, foldGutter: false, highlightActiveLine: !readOnly,
    highlightActiveLineGutter: !readOnly, autocompletion: false,
    closeBrackets: false, searchKeymap: true, tabSize: indentation,
  }), [readOnly, indentation]);

  return (
    <CodeMirror
      ref={editor}
      onCreateEditor={configureLanguage}
      value={value}
      onChange={onChange}
      className="json-editor"
      height="100%"
      theme="none"
      extensions={extensions}
      readOnly={readOnly}
      editable={!readOnly}
      indentWithTab={false}
      basicSetup={basicSetup}
    />
  );
}
