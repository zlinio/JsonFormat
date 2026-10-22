import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { setDiagnostics } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import type { Indentation, JsonIssue } from "../lib/json";
import { jsonFoldGutter } from "./jsonFoldGutter";

interface Props {
  value: string;
  label: string;
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
  label,
  dark,
  wrap,
  indentation,
  readOnly = false,
  issue,
  onChange,
  editorRef,
}: Props) {
  const localRef = useRef<ReactCodeMirrorRef>(null);
  const editor = editorRef ?? localRef;
  const extensions = useMemo(
    () => [
      json(),
      jsonFoldGutter(),
      indentUnit.of(" ".repeat(indentation)),
      EditorView.contentAttributes.of({
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
        "aria-readonly": String(readOnly),
        tabindex: "0",
        spellcheck: "false",
      }),
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
    [label, dark, wrap, indentation, readOnly],
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
                message: issue.message,
              },
            ]
          : [],
      ),
    );
  }, [issue, value, editor]);

  return (
    <CodeMirror
      ref={editor}
      value={value}
      onChange={onChange}
      className="json-editor"
      height="100%"
      theme="none"
      extensions={extensions}
      readOnly={readOnly}
      editable={!readOnly}
      indentWithTab={false}
      placeholder="在这里粘贴 JSON …"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        autocompletion: false,
        closeBrackets: false,
        searchKeymap: true,
        tabSize: indentation,
      }}
    />
  );
}
