import { EditorState } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { EditorView, placeholder } from "@codemirror/view";
import { resources } from "../../../i18n/resources";
import type { Locale } from "../../../i18n/resources";

export function editorLanguage(locale: Locale, readOnly: boolean): Extension {
  const text = resources[locale].translation.json;
  return [
    EditorState.phrases.of(text.codeMirror),
    placeholder(text.editor.placeholder),
    EditorView.contentAttributes.of({
      "aria-label": readOnly ? text.editor.outputLabel : text.editor.inputLabel,
      role: "textbox", "aria-multiline": "true", "aria-readonly": String(readOnly),
      tabindex: "0", spellcheck: "false",
    }),
  ];
}

// Native CodeMirror panels retain their DOM when phrases change. Update their
// labels in place so open panels keep the query, checkboxes, focus and selection.
export const translateOpenEditorUI = EditorView.updateListener.of(update => {
  if (update.startState.facet(EditorState.phrases) === update.state.facet(EditorState.phrases)) return;
  const root = update.view.dom;
  const phrase = (key: string) => update.state.phrase(key);
  for (const [name, key] of [["search", "Find"], ["replace", "Replace"]] as const) {
    const input = root.querySelector<HTMLInputElement>('.cm-search input[name="' + name + '"]');
    if (input) { input.placeholder = phrase(key); input.setAttribute("aria-label", phrase(key)); }
  }
  for (const [name, key] of [["next", "next"], ["prev", "previous"], ["select", "all"], ["replace", "replace"], ["replaceAll", "replace all"]] as const) {
    const button = root.querySelector('.cm-search button[name="' + name + '"]');
    if (button) button.textContent = phrase(key);
  }
  for (const [name, key] of [["case", "match case"], ["re", "regexp"], ["word", "by word"]] as const) {
    const label = root.querySelector('.cm-search input[name="' + name + '"]')?.parentElement;
    if (label?.lastChild?.nodeType === Node.TEXT_NODE) label.lastChild.textContent = phrase(key);
  }
  for (const close of root.querySelectorAll('.cm-search button[name="close"], .cm-panel-lint button[name="close"], .cm-dialog-close')) {
    close.setAttribute("aria-label", phrase("close"));
  }
  for (const folded of root.querySelectorAll<HTMLElement>(".cm-foldPlaceholder")) {
    folded.title = phrase("unfold");
    folded.setAttribute("aria-label", phrase("folded code"));
  }
  root.querySelector('.cm-panel-lint [role="listbox"]')?.setAttribute("aria-label", phrase("Diagnostics"));
  // Translate the built-in go-to-line dialog and empty diagnostics if open.
  for (const element of root.querySelectorAll(".cm-dialog label, .cm-dialog button, .cm-panel-lint .cm-diagnosticText")) {
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      for (const key of ["Go to line", "go", "No diagnostics"]) {
        const previous = update.startState.phrase(key);
        if (node.textContent === previous) node.textContent = phrase(key);
        else if (key === "Go to line" && node.textContent === previous + ": ") node.textContent = phrase(key) + ": ";
      }
    }
  }
});
