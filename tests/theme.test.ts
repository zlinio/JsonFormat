import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { readThemePreference, resolveTheme, saveThemePreference, themeStorageKey } from "../src/lib/theme";

describe("theme preference", () => {
  test("persists explicit choices and removes the override when following the system", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
    expect(readThemePreference(() => storage)).toBe("system");
    saveThemePreference("dark", () => storage);
    expect(readThemePreference(() => storage)).toBe("dark");
    saveThemePreference("light", () => storage);
    expect(readThemePreference(() => storage)).toBe("light");
    saveThemePreference("system", () => storage);
    expect(values.has(themeStorageKey)).toBe(false);
    expect(readThemePreference(() => storage)).toBe("system");
  });

  test("blocked storage and invalid preferences safely fall back to system", () => {
    const blocked = () => { throw new Error("Storage blocked"); };
    expect(readThemePreference(blocked)).toBe("system");
    expect(() => saveThemePreference("dark", blocked)).not.toThrow();
    expect(() => saveThemePreference("system", blocked)).not.toThrow();
    expect(readThemePreference(() => ({ getItem: () => "invalid" }))).toBe("system");
  });

  test("system changes apply only when following the system", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  test("the pre-paint script matches the runtime theme for every preference", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeDefined();
    for (const saved of [null, "light", "dark", "system", "invalid", "blocked"]) {
      for (const systemDark of [false, true]) {
        const root = { dataset: {} as Record<string, string> };
        const meta = { content: "" };
        const storage = () => {
          if (saved === "blocked") throw new Error("Storage blocked");
          return { getItem: () => saved };
        };
        runInNewContext(script!, {
          get localStorage() { return storage(); },
          matchMedia: () => ({ matches: systemDark }),
          document: { documentElement: root, querySelector: () => meta },
        });
        const expected = resolveTheme(readThemePreference(storage), systemDark);
        expect(root.dataset.theme).toBe(expected);
        expect(meta.content).toBe(expected === "dark" ? "#0c0c0c" : "#ffffff");
      }
    }
  });
});
