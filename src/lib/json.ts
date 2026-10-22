import { createScanner, format, printParseErrorCode, visit } from "jsonc-parser";

export const MAX_INPUT_LENGTH = 2_000_000;
export const MAX_DEPTH = 256;
export const MAX_OUTPUT_LENGTH = 10_000_000;
export type Indentation = 2 | 4;
export interface JsonIssue {
  message: string;
  offset: number;
  length: number;
  line: number;
  column: number;
}
export type FormatResult =
  | { status: "empty" }
  | { status: "error"; issue: JsonIssue }
  | { status: "valid"; output: string; lines: number; bytes: number; duration: number };

export function isBlankJsonInput(source: string): boolean {
  return source.length <= MAX_INPUT_LENGTH && /^[ \t\r\n]*$/.test(source);
}

const messages: Record<string, string> = {
  InvalidSymbol: "发现无效字符，请使用标准 JSON 语法。",
  InvalidNumberFormat: "数字格式不正确，请检查小数点或指数。",
  PropertyNameExpected: "属性名需要使用双引号。",
  ValueExpected: "此处缺少有效的 JSON 值。",
  ColonExpected: "属性名后缺少冒号 :。",
  CommaExpected: "相邻的属性或元素之间缺少逗号 ,。",
  CloseBraceExpected: "对象缺少结束的大括号 }。",
  CloseBracketExpected: "数组缺少结束的方括号 ]。",
  EndOfFileExpected: "JSON 结束后仍有内容，请只输入一个 JSON 值。",
  InvalidCommentToken: "标准 JSON 不支持注释，请移除注释。",
  UnexpectedEndOfComment: "注释未结束；标准 JSON 不支持注释。",
  UnexpectedEndOfString: "字符串缺少结束的双引号。",
  UnexpectedEndOfNumber: "数字不完整，请补全小数或指数。",
  InvalidUnicode: "Unicode 转义应为 \\u 加四位十六进制数字。",
  InvalidEscapeCharacter: "字符串中存在无效的转义字符。",
  InvalidCharacter: "字符串中包含未转义的控制字符。",
};

export function locateIssue(
  source: string,
  offset: number,
  length: number,
  message: string,
): JsonIssue {
  const boundedOffset = Math.min(Math.max(0, offset), source.length);
  const before = source.slice(0, boundedOffset);
  const lines = before.split(/\r\n|\r|\n/);
  return {
    message,
    offset: boundedOffset,
    length,
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

// Formatting edits whitespace in the original text. Never round-trip numbers
// through JavaScript Number or stringify a parsed object.
export function formatJson(source: string, indentation: Indentation = 2): FormatResult {
  const started = performance.now();
  if (source.length > MAX_INPUT_LENGTH) {
    return {
      status: "error",
      issue: locateIssue(source, 0, 0, "内容过大，最多支持 2,000,000 个字符。请缩小内容后重试。"),
    };
  }
  if (isBlankJsonInput(source)) return { status: "empty" };

  // Bound recursion before entering the third-party recursive parser.
  const scanner = createScanner(source, true);
  let depth = 0;
  scanner.scan();
  while (scanner.getTokenLength() > 0) {
    const token = source.slice(
      scanner.getTokenOffset(),
      scanner.getTokenOffset() + scanner.getTokenLength(),
    );
    if (token === "{" || token === "[") depth++;
    if (depth > MAX_DEPTH) {
      return {
        status: "error",
        issue: locateIssue(
          source,
          scanner.getTokenOffset(),
          1,
          `嵌套超过 ${MAX_DEPTH} 层，请简化 JSON 结构。`,
        ),
      };
    }
    if (token === "}" || token === "]") depth = Math.max(0, depth - 1);
    scanner.scan();
  }

  let issue: JsonIssue | undefined;
  visit(
    source,
    {
      onError(code, offset, length) {
        issue ??= locateIssue(
          source,
          offset,
          length,
          messages[printParseErrorCode(code)] ?? "JSON 语法不正确。",
        );
      },
    },
    { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false },
  );
  if (issue) return { status: "error", issue };

  // Only legal whitespace can contain literal CR after validation. Escaped
  // string contents (e.g. "\\r") are untouched. The formatter otherwise keeps CRLF.
  const normalized = source.replace(/\r\n?/g, "\n");
  const edits = format(normalized, undefined, {
    tabSize: indentation,
    insertSpaces: true,
    eol: "\n",
  }).sort((a, b) => a.offset - b.offset || a.length - b.length);
  const outputLength = edits.reduce(
    (length, edit) => length + edit.content.length - edit.length,
    normalized.length,
  );
  if (outputLength > MAX_OUTPUT_LENGTH) {
    return {
      status: "error",
      issue: locateIssue(source, 0, 0, "展开后的内容过大，请减少数组元素或嵌套层数后重试。"),
    };
  }
  // Apply the library's edits in one pass. Its applyEdits implementation copies
  // the whole string per edit, which is expensive for large arrays.
  const chunks: string[] = [];
  let cursor = 0;
  for (const edit of edits) {
    if (edit.offset < cursor || edit.offset + edit.length > normalized.length)
      throw new Error("Invalid formatting edits");
    chunks.push(normalized.slice(cursor, edit.offset), edit.content);
    cursor = edit.offset + edit.length;
  }
  chunks.push(normalized.slice(cursor));
  const output = chunks.join("").trim();
  return {
    status: "valid",
    output,
    lines: output.split("\n").length,
    bytes: new TextEncoder().encode(output).length,
    duration: Math.round((performance.now() - started) * 10) / 10,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
