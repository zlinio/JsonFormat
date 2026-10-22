import { codeFolding, foldable, foldedRanges, foldEffect, syntaxTree, unfoldEffect } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView, GutterMarker, gutter } from '@codemirror/view';

function foldedOnLine(state: EditorState, from: number, to: number) {
  let range: { from: number; to: number } | undefined;
  foldedRanges(state).between(from, to, (start, end) => {
    if (!range || start < range.from) range = { from: start, to: end };
  });
  return range;
}

function syncButton(button: HTMLButtonElement, state: EditorState) {
  const line = state.doc.lineAt(Number(button.dataset.lineFrom));
  const open = !foldedOnLine(state, line.from, line.to);
  button.setAttribute('aria-expanded', String(open));
  button.title = state.phrase(open ? 'Fold line $' : 'Unfold line $', line.number);
  button.setAttribute('aria-label', button.title);
}

class FoldMarker extends GutterMarker {
  constructor(readonly from: number) { super(); }

  // Keep the same SVG when folding changes so its CSS transform can transition.
  eq(other: FoldMarker) { return this.from === other.from; }

  toDOM(view: EditorView) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cm-fold-toggle';
    // CodeMirror hides gutters from assistive technology; editor fold shortcuts remain available.
    button.tabIndex = -1;
    button.dataset.lineFrom = String(this.from);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm9 6 6 6-6 6');
    svg.append(path);
    button.append(svg);
    syncButton(button, view.state);
    return button;
  }
}

class FoldSpacer extends GutterMarker {
  toDOM() {
    const spacer = document.createElement('span');
    spacer.className = 'cm-fold-spacer';
    return spacer;
  }
}

export function jsonFoldGutter(): Extension {
  return [
    codeFolding(),
    gutter({
      class: 'cm-jsonFoldGutter',
      initialSpacer: () => new FoldSpacer(),
      lineMarker(view, line) {
        return foldedOnLine(view.state, line.from, line.to) || foldable(view.state, line.from, line.to)
          ? new FoldMarker(line.from) : null;
      },
      lineMarkerChange: update => update.docChanged
        || foldedRanges(update.startState) !== foldedRanges(update.state)
        || syntaxTree(update.startState) !== syntaxTree(update.state),
      domEventHandlers: {
        mousedown: () => true,
        click(view, line, event) {
          if (!(event.target instanceof Element) || !event.target.closest('.cm-fold-toggle')) return false;
          const folded = foldedOnLine(view.state, line.from, line.to);
          const range = folded ?? foldable(view.state, line.from, line.to);
          if (!range) return false;
          view.dispatch({ effects: (folded ? unfoldEffect : foldEffect).of(range) });
          return true;
        },
      },
    }),
    EditorView.updateListener.of(update => {
      if (!update.docChanged && foldedRanges(update.startState) === foldedRanges(update.state)
        && update.startState.facet(EditorState.phrases) === update.state.facet(EditorState.phrases)) return;
      for (const button of update.view.dom.querySelectorAll<HTMLButtonElement>('.cm-fold-toggle')) {
        syncButton(button, update.state);
      }
    }),
  ];
}
