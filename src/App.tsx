import { useEffect, useRef, useState } from 'react';
import { foldAll, unfoldAll } from '@codemirror/language';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { Icon } from './components/Icon';
import { JsonEditor } from './components/JsonEditor';
import { useJsonFormatter } from './hooks/useJsonFormatter';

export default function App() {
  const [source, setSource] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);
  const inputEditor = useRef<ReactCodeMirrorRef>(null);
  const outputEditor = useRef<ReactCodeMirrorRef>(null);
  const result = useJsonFormatter(source, 2);
  const valid = result.status === 'valid';

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function notify(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3500);
  }

  function replaceSource(value: string) {
    const view = inputEditor.current?.view;
    if (view) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value }, selection: { anchor: 0 } });
      view.focus();
    }
    setSource(value);
  }

  async function copyOutput() {
    if (result.status !== 'valid') return;
    try {
      await navigator.clipboard.writeText(result.output);
      notify('格式化结果已复制');
    } catch {
      const view = outputEditor.current?.view;
      if (view) {
        view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
        view.focus();
      }
      notify('无法访问剪贴板，已选中结果，请按 Ctrl/Cmd + C 复制');
    }
  }

  function downloadOutput() {
    if (result.status !== 'valid') return;
    const url = URL.createObjectURL(new Blob([result.output + '\n'], { type: 'application/json;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'formatted.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('已下载 formatted.json');
  }

  function jumpToError() {
    const view = inputEditor.current?.view;
    if (result.status !== 'error' || !view) return;
    view.dispatch({ selection: { anchor: Math.min(result.issue.offset, source.length) }, scrollIntoView: true });
    view.focus();
  }

  return <div className="app-shell">
    <main>
      <section className="workspace" aria-label="JSON 格式化工作区">
        <div className="panes">
          <section className="pane input-pane" aria-labelledby="input-heading">
            <div className="pane-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><h2 id="input-heading">原始内容</h2><span className="type-label">INPUT</span></div>
              <button className="icon-button" disabled={!source} onClick={() => replaceSource('')} aria-label="清空输入" title="清空输入"><Icon name="trash" /></button>
            </div>
            <div className="editor-container"><JsonEditor value={source} label="JSON 输入" dark={false} wrap indentation={2} onChange={setSource} editorRef={inputEditor} issue={result.status === 'error' ? result.issue : undefined} /></div>
          </section>

          <section className="pane output-pane" aria-labelledby="output-heading">
            <div className="pane-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><h2 id="output-heading">格式化结果</h2><span className="type-label output-label">OUTPUT</span></div>
              <div className="flex items-center gap-1"><button className="icon-button" disabled={!valid} aria-label="折叠全部" title="折叠全部" onClick={() => { const view = outputEditor.current?.view; if (view) foldAll(view); }}><Icon name="fold" /></button><button className="icon-button" disabled={!valid} aria-label="展开全部" title="展开全部" onClick={() => { const view = outputEditor.current?.view; if (view) unfoldAll(view); }}><Icon name="unfold" /></button><span className="toolbar-divider" /><button className="icon-button" disabled={!valid} onClick={downloadOutput} aria-label="下载 JSON" title="下载 JSON"><Icon name="download" /></button><button className="icon-button" disabled={!valid} onClick={copyOutput} aria-label="复制" title="复制"><Icon name="copy" /></button></div>
            </div>
            <div className="editor-container result-container" aria-busy={result.status === 'pending'}>
              {result.status === 'valid' ? <JsonEditor value={result.output} label="格式化 JSON 结果" dark={false} wrap indentation={2} readOnly editorRef={outputEditor} /> : <div className={`result-placeholder ${result.status === 'error' ? 'has-error' : ''}`} role="status" aria-live="polite">
                {result.status === 'error' ? <><div className="empty-symbol error-symbol"><Icon name="alert" width={30} height={30} /></div><h3>还差一点，就整理好了</h3><p>{result.issue.message}</p><button className="text-button error-jump" onClick={jumpToError}>定位到第 {result.issue.line} 行，第 {result.issue.column} 列<Icon name="arrow" width={15} height={15} /></button></> : result.status === 'pending' ? <><div className="empty-symbol"><span className="spinner" /></div><h3>正在整理结构…</h3><p>保留每一个值，只整理它们的排列。</p></> : <><div className="empty-symbol brace-symbol" aria-hidden="true"><span>{'{'}</span><div><i /><i /><i /></div><span>{'}'}</span></div><h3>清晰的结构，从这里开始</h3><p>在左侧粘贴 JSON，格式化结果会自动呈现。</p></>}
              </div>}
            </div>
          </section>
        </div>

      </section>
    </main>
    <div className={`toast ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite">{toast && <><Icon name="check" width={17} height={17} /><span>{toast}</span><button className="icon-button" aria-label="关闭提示" onClick={() => setToast('')}><Icon name="close" width={15} height={15} /></button></>}</div>
  </div>;
}
