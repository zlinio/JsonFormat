import { describe, expect, test } from "bun:test";
import { createInstance } from "i18next";
import { matchRoutes } from "react-router";
import { tools } from "../src/tool-registry";
import { resources } from "../src/i18n/resources";

describe("tool registry", () => {
  test("tools have unique identifiers and shareable routes", () => {
    expect(new Set(tools.map(tool => tool.id)).size).toBe(tools.length);
    expect(new Set(tools.map(tool => tool.path)).size).toBe(tools.length);
    for (const tool of tools) {
      expect(tool.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(tool.path).toBe(`/tools/${tool.id}`);
    }
  });

  test.each(["en", "zh-CN"] as const)("every tool has complete %s directory and page metadata", async lng => {
    const instance = createInstance();
    await instance.init({ resources, lng, fallbackLng: false });
    for (const tool of tools) {
      for (const key of [tool.nameKey, tool.descriptionKey, tool.titleKey, tool.categoryKey]) {
        expect(instance.exists(key)).toBe(true);
        expect(instance.t(key)).not.toBe(key);
        expect(instance.t(key).trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("registered paths resolve directly and unknown paths reach the fallback", () => {
    const routes = [{ path: "/", id: "home" }, ...tools.map(({ path, id }) => ({ path, id })), { path: "*", id: "notFound" }];
    expect(matchRoutes(routes, "/")?.at(-1)?.route.id).toBe("home");
    for (const tool of tools) {
      expect(matchRoutes(routes, tool.path)?.at(-1)?.route.id).toBe(tool.id);
      expect(matchRoutes(routes, `${tool.path}/`)?.at(-1)?.route.id).toBe(tool.id);
    }
    expect(matchRoutes(routes, "/tools/missing")?.at(-1)?.route.id).toBe("notFound");
    expect(matchRoutes(routes, "/tools/json-format/unknown")?.at(-1)?.route.id).toBe("notFound");
  });
});
