import type { TFunction } from "i18next";
import type { JsonIssue } from "../lib/json";

export function issueMessage(t: TFunction, issue: JsonIssue) {
  return t(`json.errors.${issue.code}`, { limit: issue.params?.limit });
}
