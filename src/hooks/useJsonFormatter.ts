import { useEffect, useState } from "react";
import type { FormatResult, Indentation } from "../lib/json";
import { isBlankJsonInput } from "../lib/json";

export type FormatterState = FormatResult | { status: "pending" };

export function useJsonFormatter(source: string, indentation: Indentation): FormatterState {
  const [snapshot, setSnapshot] = useState<{
    source: string;
    indentation: Indentation;
    result: FormatResult;
  }>();

  useEffect(() => {
    if (isBlankJsonInput(source)) return;
    let worker: Worker | undefined;
    let cancelled = false;
    const fail = () => {
      if (!cancelled)
        setSnapshot({
          source,
          indentation,
          result: {
            status: "error",
            issue: {
              message: "格式化服务启动失败，请刷新页面后重试。",
              offset: 0,
              length: 0,
              line: 1,
              column: 1,
            },
          },
        });
      worker?.terminate();
    };
    const timer = window.setTimeout(() => {
      try {
        worker = new Worker(new URL("../workers/format.worker.ts", import.meta.url), {
          type: "module",
        });
        worker.onmessage = (event: MessageEvent<FormatResult>) => {
          if (!cancelled) setSnapshot({ source, indentation, result: event.data });
          worker?.terminate();
        };
        worker.onerror = fail;
        worker.onmessageerror = fail;
        worker.postMessage({ source, indentation });
      } catch {
        fail();
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [source, indentation]);

  if (isBlankJsonInput(source)) return { status: "empty" };
  // An earlier response must never enable copy/download for the current input.
  if (snapshot?.source !== source || snapshot.indentation !== indentation)
    return { status: "pending" };
  return snapshot.result;
}
