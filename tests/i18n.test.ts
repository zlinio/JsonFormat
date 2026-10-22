import { describe, expect, test } from "bun:test";
import { createInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { languageStorageKey, normalizeLanguage, resources } from "../src/i18n/resources";
import { issueMessage } from "../src/i18n/issueMessage";
import { formatJson, MAX_INPUT_LENGTH, parserIssueCodes } from "../src/lib/json";
import type { IssueCode, JsonIssue } from "../src/lib/json";
import { createLanguagePreference } from "../src/i18n/languagePreference";

function entries(value: Record<string, unknown>, prefix = ""): [string, string][] {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? prefix + "." + key : key;
    return typeof item === "string" ? [[path, item] as [string, string]]
      : entries(item as Record<string, unknown>, path);
  });
}

describe("translation resources", () => {
  test("languages contain matching keys and interpolation parameters", () => {
    const english = new Map(entries(resources.en.translation));
    const chinese = new Map(entries(resources["zh-CN"].translation));
    expect([...chinese.keys()].sort()).toEqual([...english.keys()].sort());
    const parameters = (text: string) => [...text.matchAll(/{{\s*([^},]+)(?:,[^}]+)?}}/g)].map(match => match[1]).sort();
    for (const [key, text] of english) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(chinese.get(key)?.trim().length).toBeGreaterThan(0);
      expect(parameters(chinese.get(key)!)).toEqual(parameters(text));
      if (key.startsWith("codeMirror.")) {
        expect(chinese.get(key)!.split("$").length).toBe(text.split("$").length);
      }
    }
  });

  test.each(["en", "zh-CN"] as const)("every parser and runtime error has a usable %s translation", async locale => {
    const instance = createInstance();
    await instance.init({ resources, lng: locale, fallbackLng: "en", interpolation: { escapeValue: false } });
    const codes: IssueCode[] = [...parserIssueCodes, "InvalidJson", "InputTooLarge", "TooDeep",
      "OutputTooLarge", "WorkerUnavailable", "ProcessingFailed"];
    for (const code of codes) {
      const issue: JsonIssue = { code, params: { limit: 256 }, offset: 0, length: 0, line: 1, column: 1 };
      const message = issueMessage(instance.t, issue);
      expect(message).not.toBe("errors." + code);
      expect(message).not.toContain("{{");
      expect(message).not.toContain("undefined");
      expect(message.length).toBeGreaterThan(0);
    }
  });

  test("one structured issue changes language without recalculating its position", async () => {
    const result = formatJson('{\n  "a" 1\n}');
    if (result.status !== "error") throw new Error("Expected an issue");
    const before = structuredClone(result);
    const instance = createInstance();
    await instance.init({ resources, lng: "en" });
    expect(issueMessage(instance.t, result.issue)).toContain("colon");
    await instance.changeLanguage("zh-CN");
    expect(issueMessage(instance.t, result.issue)).toContain("冒号");
    expect(result).toEqual(before);
    expect(result.issue).toMatchObject({ code: "ColonExpected", line: 2, column: 7 });
  });

  test("formats size limits and line positions with interpolation", async () => {
    const instance = createInstance();
    await instance.init({ resources, lng: "en" });
    const issue: JsonIssue = { code: "InputTooLarge", params: { limit: MAX_INPUT_LENGTH },
      offset: 0, length: 0, line: 1, column: 1 };
    expect(issueMessage(instance.t, issue)).toContain("2,000,000");
    expect(instance.t("state.jumpToError", { line: 83, column: 12 })).toBe("Go to line 83, column 12");
    await instance.changeLanguage("zh-CN");
    expect(instance.t("state.jumpToError", { line: 83, column: 12 })).toBe("定位到第 83 行，第 12 列");
  });
});

describe("language detection", () => {
  test.each([
    ["zh", "zh-CN"], ["zh-Hant-TW", "zh-CN"], ["zh_CN", "zh-CN"],
    ["en-GB", "en"], ["EN-us", "en"], ["fr-FR", undefined], ["invalid", undefined],
  ] as const)("normalizes %s", (input, expected) => expect(normalizeLanguage(input)).toBe(expected));

  test.each([
    [["zh-CN", "en-US"], "zh-CN"],
    [["en", "zh-CN"], "en"],
    [["invalid", "zh-TW"], "zh-CN"],
    [["fr-FR", "de"], "en"],
  ] as const)("uses the first supported preference and falls back to English: %j", async (candidates, expected) => {
    const detector = new LanguageDetector();
    detector.addDetector({ name: "preferences", lookup: () => [...candidates] });
    const instance = createInstance();
    await instance.use(detector).init({
      resources, supportedLngs: ["zh-CN", "en"], fallbackLng: "en", load: "currentOnly",
      detection: { order: ["preferences"], caches: [],
        convertDetectedLanguage: language => normalizeLanguage(language) ?? language },
    });
    expect(instance.resolvedLanguage).toBe(expected);
  });

  test("a blocked localStorage falls through to the browser preference", async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
      get localStorage() { throw new Error("Storage blocked"); },
    } });
    try {
      const detector = new LanguageDetector();
      detector.addDetector({ name: "browserPreference", lookup: () => "zh-CN" });
      const instance = createInstance();
      await instance.use(detector).init({
        resources, supportedLngs: ["zh-CN", "en"], fallbackLng: "en",
        detection: { order: ["localStorage", "browserPreference"], caches: ["localStorage"],
          lookupLocalStorage: languageStorageKey },
      });
      expect(instance.resolvedLanguage).toBe("zh-CN");
      await instance.changeLanguage("en");
      expect(instance.resolvedLanguage).toBe("en");
    } finally {
      if (original) Object.defineProperty(globalThis, "window", original);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });
});

describe("follow browser preference", () => {
  function memoryStorage(initial?: string) {
    const values = new Map(initial ? [[languageStorageKey, initial]] : []);
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
  }

  async function initialize(preference: ReturnType<typeof createLanguagePreference>, browserLanguages: () => string[]) {
    const detector = new LanguageDetector();
    detector.addDetector(preference.detector);
    detector.addDetector({ name: "browserPreference", lookup: browserLanguages });
    const instance = createInstance();
    await instance.use(detector).init({
      resources, supportedLngs: ["zh-CN", "en"], fallbackLng: "en", load: "currentOnly",
      detection: { order: ["languagePreference", "browserPreference"], caches: [],
        convertDetectedLanguage: language => normalizeLanguage(language) ?? language },
    });
    return instance;
  }

  test("switches a saved manual choice to auto and detects again after reload", async () => {
    const storage = memoryStorage("zh-CN");
    const preference = createLanguagePreference(() => storage);
    const instance = await initialize(preference, () => ["en-US"]);
    expect(preference.get()).toBe("zh-CN");
    expect(instance.resolvedLanguage).toBe("zh-CN");

    preference.set("auto");
    await instance.changeLanguage();
    expect(preference.get()).toBe("auto");
    expect(instance.resolvedLanguage).toBe("en");
    expect(storage.getItem(languageStorageKey)).toBeNull();

    const reloadedPreference = createLanguagePreference(() => storage);
    const reloaded = await initialize(reloadedPreference, () => ["zh-TW"]);
    expect(reloadedPreference.get()).toBe("auto");
    expect(reloaded.resolvedLanguage).toBe("zh-CN");
    expect(storage.getItem(languageStorageKey)).toBeNull();
  });

  test("distinguishes explicit English from auto even when both resolve to English", async () => {
    const storage = memoryStorage();
    const preference = createLanguagePreference(() => storage);
    let browserLanguages = ["en-US"];
    const instance = await initialize(preference, () => browserLanguages);
    expect(preference.get()).toBe("auto");
    preference.set("en");
    await instance.changeLanguage();
    expect(preference.get()).toBe("en");
    expect(storage.getItem(languageStorageKey)).toBe("en");
    browserLanguages = ["zh-CN"];
    await instance.changeLanguage();
    expect(instance.resolvedLanguage).toBe("en");

    preference.set("auto");
    await instance.changeLanguage();
    expect(instance.resolvedLanguage).toBe("zh-CN");
    browserLanguages = ["fr-FR"];
    await instance.changeLanguage();
    expect(instance.resolvedLanguage).toBe("en");
    expect(preference.get()).toBe("auto");
  });

  test("manual and automatic switching still work when storage is blocked", async () => {
    const preference = createLanguagePreference(() => { throw new Error("Storage blocked"); });
    const instance = await initialize(preference, () => ["en-US"]);
    preference.set("zh-CN");
    await instance.changeLanguage();
    expect(instance.resolvedLanguage).toBe("zh-CN");
    preference.set("auto");
    await instance.changeLanguage();
    expect(preference.get()).toBe("auto");
    expect(instance.resolvedLanguage).toBe("en");
  });
});
