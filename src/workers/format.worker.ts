/// <reference lib="webworker" />
import { formatJson } from "../lib/json";
import type { FormatResult, Indentation } from "../lib/json";

const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.onmessage = (event: MessageEvent<{ source: string; indentation: Indentation }>) => {
  let result: FormatResult;
  try {
    result = formatJson(event.data.source, event.data.indentation);
  } catch {
    result = {
      status: "error",
      issue: {
        message: "无法处理这段内容，请缩小内容或检查 JSON 结构后重试。",
        offset: 0,
        length: 0,
        line: 1,
        column: 1,
      },
    };
  }
  scope.postMessage(result);
};
