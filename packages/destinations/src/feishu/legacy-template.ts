import type { JsonObject, JsonValue } from "@vane/core";

import { destinationCopy } from "#/presentation.ts";

import { defaultFeishuCardTemplate } from "#/feishu/default-card.ts";

const legacyTemplates = [
  localizePresentationLabels("en-US"),
  localizePresentationLabels("zh-Hans"),
  createLegacyRawValueTemplate(),
];

export function isLegacyBuiltInFeishuCardTemplate(value: JsonObject): boolean {
  const serialized = JSON.stringify(value);

  return legacyTemplates.some((template) => JSON.stringify(template) === serialized);
}

function localizePresentationLabels(locale: "en-US" | "zh-Hans"): JsonObject {
  const labels = destinationCopy({ locale, timeZone: "UTC" }).labels;
  const replacements = Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [`{{presentation.labels.${key}}}`, value]),
  );

  return replaceTemplateVariables(defaultFeishuCardTemplate, replacements) as JsonObject;
}

function createLegacyRawValueTemplate(): JsonObject {
  const replacements = new Map([
    [
      "[{{event.statusDisplay}}] [{{event.severityDisplay}}] {{event.title}}",
      "[{{event.status}}] [{{event.severity}}] {{event.title}}",
    ],
    ["{{source.name}} · {{event.occurredAtDisplay}}", "{{source.name}} · {{event.occurredAt}}"],
    ["{{event.severityDisplay}}", "{{event.severity}}"],
    ["{{event.statusDisplay}}", "{{event.status}}"],
    ["**Alert summary**\n{{event.message}}", "**告警摘要**\n{{event.message}}"],
    ["**Status**\n{{event.statusDisplay}}", "**状态**\n{{event.status}}"],
    ["**Source**\n{{source.name}}", "**告警源**\n{{source.name}}"],
    ["**Severity**\n{{event.severityDisplay}}", "**级别**\n{{event.severity}}"],
    ["**Upstream system**\n{{source.provider}}", "**上游系统**\n{{source.provider}}"],
  ]);

  return replaceExactStrings(localizePresentationLabels("en-US"), replacements) as JsonObject;
}

function replaceTemplateVariables(
  value: JsonValue,
  replacements: Readonly<Record<string, string>>,
): JsonValue {
  if (typeof value === "string") {
    return Object.entries(replacements).reduce(
      (rendered, [variable, replacement]) => rendered.replaceAll(variable, replacement),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTemplateVariables(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceTemplateVariables(item, replacements),
      ]),
    );
  }

  return value;
}

function replaceExactStrings(
  value: JsonValue,
  replacements: ReadonlyMap<string, string>,
): JsonValue {
  if (typeof value === "string") {
    return replacements.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceExactStrings(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceExactStrings(item, replacements)]),
    );
  }

  return value;
}
