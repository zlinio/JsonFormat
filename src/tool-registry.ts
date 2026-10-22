import { lazy } from "react";
import type { ComponentProps, ComponentType, LazyExoticComponent } from "react";
import type { ParseKeys } from "i18next";
import type { Icon } from "./shared/components/Icon";

export interface ToolDefinition {
  id: string;
  path: `/tools/${string}`;
  nameKey: ParseKeys;
  descriptionKey: ParseKeys;
  titleKey: ParseKeys;
  categoryKey: ParseKeys;
  icon: ComponentProps<typeof Icon>["name"];
  Component: LazyExoticComponent<ComponentType>;
}

// Register tools here. Keep imports lazy so the directory never loads an editor.
export const tools = [{
  id: "json-format",
  path: "/tools/json-format",
  nameKey: "json.name",
  descriptionKey: "json.description",
  titleKey: "json.app.title",
  categoryKey: "categories.data",
  icon: "braces",
  Component: lazy(() => import("./tools/json-format/JsonFormatPage")),
}] as const satisfies readonly ToolDefinition[];
