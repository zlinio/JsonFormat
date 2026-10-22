import { describe, expect, test } from "bun:test";
import { formatJson, isBlankJsonInput, MAX_DEPTH } from "../src/tools/json-format/lib/json";
import { applyEdits, format } from "jsonc-parser";

const SAMPLE =
  '{"project":"JSON Format","description":"让每一层结构，都清晰可读。","version":1,"localOnly":true,"features":["实时格式化","语法校验","无损数字"],"settings":{"indent":2,"theme":"light"},"example":{"id":9007199254740993,"price":19.9900,"tags":["React","TypeScript","Tailwind CSS","Bun"],"empty":null}}';

function output(source: string, indentation: 2 | 4 = 2) {
  const result = formatJson(source, indentation);
  if (result.status !== "valid") throw new Error(`Expected valid JSON: ${JSON.stringify(result)}`);
  return result.output;
}

describe("lossless JSON formatting", () => {
  test("formats nested objects and arrays with configurable indentation", () => {
    const source = '{"a":{"b":[1,true,null]}}';
    expect(output(source)).toBe(
      '{\n  "a": {\n    "b": [\n      1,\n      true,\n      null\n    ]\n  }\n}',
    );
    expect(output(source, 4)).toContain('\n        "b": [\n            1,');
  });

  test("preserves unsafe integers, decimal lexemes, negative zero, and exponents", () => {
    const source =
      '{"id":9007199254740993,"decimal":0.123456789012345678901,"price":19.9900,"negative":-0,"exp":1.2300e+50,"huge":1e400}';
    const formatted = output(source);
    for (const literal of [
      "9007199254740993",
      "0.123456789012345678901",
      "19.9900",
      "-0",
      "1.2300e+50",
      "1e400",
    ]) {
      expect(formatted).toContain(literal);
    }
  });

  test("preserves duplicate keys and original key order, including integer-like keys", () => {
    const source = '{"10":1,"2":2,"a":3,"a":4,"__proto__":{"safe":true}}';
    expect(output(source)).toBe(
      '{\n  "10": 1,\n  "2": 2,\n  "a": 3,\n  "a": 4,\n  "__proto__": {\n    "safe": true\n  }\n}',
    );
    expect(Object.getPrototypeOf({})).not.toHaveProperty("safe");
  });

  test("keeps Chinese, Unicode escapes, escaped quotes and brackets inside strings", () => {
    const source = '{"文本":"你好🌏","escaped":"\\u4f60\\n\\\"","brackets":"[[{{}}]]"}';
    expect(output(source)).toContain('"escaped": "\\u4f60\\n\\\""');
    expect(JSON.parse(output(source))).toEqual(JSON.parse(source));
  });

  test.each(["null", "false", "true", "0", "-123", '"hello"', "[]", "{}"])(
    "accepts top-level value %s",
    source => {
      expect(output(source)).toBe(source);
    },
  );

  test("normalizes CRLF to LF and removes surrounding JSON whitespace", () => {
    expect(output(' \r\n{\r\n "x":1\r\n}\r\n ')).toBe('{\n  "x": 1\n}');
  });

  test("is idempotent", () => {
    expect(output(output(SAMPLE))).toBe(output(SAMPLE));
  });

  test("matches the upstream edit application across varied documents", () => {
    const documents = [
      SAMPLE,
      "{}",
      '  [1, {"a": 2}, []] ',
      '{"a":1,"a":2}',
      '{\n"a" : [true, false], "b": "\\r\\n"\n}',
    ];
    for (const source of documents) {
      for (const indentation of [2, 4] as const) {
        const expected = applyEdits(
          source,
          format(source, undefined, { tabSize: indentation, insertSpaces: true, eol: "\n" }),
        ).trim();
        expect(output(source, indentation)).toBe(expected);
      }
    }
  });

  test("reports actual UTF-8 bytes and output line count", () => {
    const result = formatJson('{"text":"你好"}');
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;
    expect(result.lines).toBe(3);
    expect(result.bytes).toBe(new TextEncoder().encode(result.output).length);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

describe("strict validation and diagnostics", () => {
  test.each(["", " \r\n\t "])("treats empty input as an empty state", source => {
    expect(formatJson(source)).toEqual({ status: "empty" });
  });

  test.each([
    "{a:1}",
    "{'a':1}",
    '{"a":1,}',
    "[1,]",
    '{/* comment */"a":1}',
    "// comment\n{}",
    '{"a" 1}',
    '{"a":}',
    '{"a":1',
    "[1,2",
    "{} {}",
    '{"a":NaN}',
    '{"a":undefined}',
    "01",
    "1.",
    "1e",
    '"\\x20"',
    '"\\u12G4"',
    '"line\nbreak"',
    "\ufeff{}",
    "\ufeff",
    "\u00a0",
    "\u000b",
  ])("rejects malformed/non-standard JSON %s", source => {
    const result = formatJson(source);
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.issue.code.length).toBeGreaterThan(0);
    expect(result.issue.line).toBeGreaterThanOrEqual(1);
    expect(result.issue.column).toBeGreaterThanOrEqual(1);
    expect(result.issue.offset).toBeLessThanOrEqual(source.length);
  });

  test.each(["\n", "\r\n", "\r"])("locates an error with line separator %j", newline => {
    const source = `{${newline}  "a" 1${newline}}`;
    const result = formatJson(source);
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.issue.line).toBe(2);
    expect(result.issue.column).toBe(7);
    expect(result.issue.offset).toBe(source.indexOf("1"));
    expect(result.issue.code).toBe("ColonExpected");
  });

  test("bounds excessive nesting before recursive parsing", () => {
    expect(formatJson("[".repeat(MAX_DEPTH + 1) + "0" + "]".repeat(MAX_DEPTH + 1)).status).toBe(
      "error",
    );
    const source = "[".repeat(MAX_DEPTH) + "0" + "]".repeat(MAX_DEPTH);
    expect(JSON.parse(output(source))).toEqual(JSON.parse(source));
  });

  test.each([2, 4] as const)(
    "keeps valid output at the upstream 200-space cache boundary (%s spaces)",
    indentation => {
      const depth = 200 / indentation;
      const source = "[".repeat(depth) + "0" + "]".repeat(depth);
      const formatted = output(source, indentation);
      expect(formatted).not.toContain("undefined");
      expect(formatted).toContain("\n" + " ".repeat(200) + "0");
      expect(JSON.parse(formatted)).toEqual(JSON.parse(source));
    },
  );

  test("formats input beyond the former character limit without losing values", () => {
    const value = "x".repeat(2_000_001);
    const source = `{"text":"${value}","id":9007199254740993,"price":19.9900}`;
    expect(output(source)).toBe(`{\n  "text": "${value}",\n  "id": 9007199254740993,\n  "price": 19.9900\n}`);
  });

  test("treats whitespace beyond the former character limit as empty", () => {
    const source = " \t\r\n".repeat(500_001);
    expect(isBlankJsonInput(source)).toBe(true);
    expect(formatJson(source)).toEqual({ status: "empty" });
  });

  test("reports a syntax error after the former input limit at its actual position", () => {
    const source = `{"text":"${"x".repeat(2_000_001)}",\n"invalid" 1}`;
    const result = formatJson(source);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.issue).toMatchObject({
        code: "ColonExpected", offset: source.lastIndexOf("1"), line: 2, column: 11,
      });
    }
  });

  test("handles a larger payload without altering its contents", () => {
    const source = JSON.stringify(
      Array.from({ length: 60_000 }, (_, id) => ({ id, text: "格式化测试", enabled: true })),
    );
    expect(source.length).toBeGreaterThan(2_000_000);
    expect(JSON.parse(output(source))).toEqual(JSON.parse(source));
  });

  test("formats expanded output beyond the former output limit", () => {
    const source = "[".repeat(200) + Array(15000).fill("0").join(",") + "]".repeat(200);
    const result = formatJson(source, 4);
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;
    expect(result.output.length).toBeGreaterThan(10_000_000);
    expect(JSON.parse(result.output)).toEqual(JSON.parse(source));
    expect(result.lines).toBe(15_400);
    expect(result.bytes).toBe(result.output.length);
  });
});
