import { createScanner, format, printParseErrorCode, visit } from "jsonc-parser";

export const MAX_INPUT_LENGTH = 2_000_000;
export const MAX_DEPTH = 256;
export const MAX_OUTPUT_LENGTH = 10_000_000;
export type Indentation = 2 | 4;
export const parserIssueCodes = [
  "InvalidSymbol", "InvalidNumberFormat", "PropertyNameExpected", "ValueExpected",
  "ColonExpected", "CommaExpected", "CloseBraceExpected", "CloseBracketExpected",
  "EndOfFileExpected", "InvalidCommentToken", "UnexpectedEndOfComment",
  "UnexpectedEndOfString", "UnexpectedEndOfNumber", "InvalidUnicode",
  "InvalidEscapeCharacter", "InvalidCharacter",
] as const;
export type IssueCode = typeof parserIssueCodes[number] | "InvalidJson" | "InputTooLarge"
  | "TooDeep" | "OutputTooLarge" | "WorkerUnavailable" | "ProcessingFailed";
export interface JsonIssue {
  code: IssueCode;
  params?: { limit: number };
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

export function locateIssue(
  source: string,
  offset: number,
  length: number,
  code: IssueCode,
  params?: JsonIssue["params"],
): JsonIssue {
  const boundedOffset = Math.min(Math.max(0, offset), source.length);
  const before = source.slice(0, boundedOffset);
  const lines = before.split(/\r\n|\r|\n/);
  return {
    code,
    ...(params ? { params } : {}),
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
      issue: locateIssue(source, 0, 0, "InputTooLarge", { limit: MAX_INPUT_LENGTH }),
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
          "TooDeep", { limit: MAX_DEPTH },
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
        const name = printParseErrorCode(code);
        issue ??= locateIssue(
          source,
          offset,
          length,
          (parserIssueCodes as readonly string[]).includes(name) ? name as IssueCode : "InvalidJson",
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
      issue: locateIssue(source, 0, 0, "OutputTooLarge"),
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
