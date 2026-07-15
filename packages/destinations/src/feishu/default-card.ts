import { JsonObjectSchema } from "@vane/core";
import type { JsonObject } from "@vane/core";

import type { FeishuCardV2 } from "#/feishu/card.types.ts";

const defaultFeishuCardTemplateDefinition = {
  schema: "2.0",
  config: {
    width_mode: "compact",
    enable_forward: true,
    summary: {
      content: "[{{event.statusDisplay}}] [{{event.severityDisplay}}] {{event.title}}",
    },
  },
  header: {
    template: "{{bindings.statusColor}}",
    title: {
      tag: "plain_text",
      content: "{{event.title}}",
    },
    subtitle: {
      tag: "plain_text",
      content: "{{source.name}} · {{event.occurredAtDisplay}}",
    },
    text_tag_list: [
      {
        tag: "text_tag",
        text: {
          tag: "plain_text",
          content: "{{event.severityDisplay}}",
        },
        color: "grey",
      },
      {
        tag: "text_tag",
        text: {
          tag: "plain_text",
          content: "{{event.statusDisplay}}",
        },
        color: "{{bindings.statusColor}}",
      },
    ],
  },
  body: {
    direction: "vertical",
    padding: "12px 12px 10px 12px",
    vertical_spacing: "8px",
    elements: [
      {
        tag: "markdown",
        content: "**Alert summary**\n{{event.message}}",
        text_size: "normal",
      },
      {
        tag: "column_set",
        flex_mode: "bisect",
        background_style: "grey",
        columns: [
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            vertical_spacing: "4px",
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**Status**\n{{event.statusDisplay}}",
                  text_size: "notation",
                },
              },
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**Source**\n{{source.name}}",
                  text_size: "notation",
                },
              },
            ],
          },
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            vertical_spacing: "4px",
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**Severity**\n{{event.severityDisplay}}",
                  text_size: "notation",
                },
              },
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**Upstream system**\n{{source.provider}}",
                  text_size: "notation",
                },
              },
            ],
          },
        ],
      },
      {
        tag: "hr",
      },
      {
        tag: "markdown",
        content:
          "Fingerprint: `{{event.fingerprint}}` · Event: `{{event.id}}` · Destination: {{destination.name}}",
        text_size: "notation",
      },
    ],
  },
} satisfies FeishuCardV2;

export const defaultFeishuCardTemplate: JsonObject = JsonObjectSchema.parse(
  defaultFeishuCardTemplateDefinition,
);

const zhHansText = new Map([
  ["**Alert summary**\n{{event.message}}", "**告警摘要**\n{{event.message}}"],
  ["**Status**\n{{event.statusDisplay}}", "**状态**\n{{event.statusDisplay}}"],
  ["**Source**\n{{source.name}}", "**告警源**\n{{source.name}}"],
  ["**Severity**\n{{event.severityDisplay}}", "**级别**\n{{event.severityDisplay}}"],
  ["**Upstream system**\n{{source.provider}}", "**上游系统**\n{{source.provider}}"],
]);

const legacyDefaultText = new Map([
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

export const legacyDefaultFeishuCardTemplate = localizeCardValue(
  defaultFeishuCardTemplate,
  legacyDefaultText,
) as JsonObject;

export function defaultFeishuCardTemplateForLocale(locale: "en-US" | "zh-Hans"): JsonObject {
  return locale === "zh-Hans"
    ? (localizeCardValue(defaultFeishuCardTemplate, zhHansText) as JsonObject)
    : defaultFeishuCardTemplate;
}

export function isBuiltInFeishuCardTemplate(value: JsonObject): boolean {
  const serialized = JSON.stringify(value);

  return (
    serialized === JSON.stringify(defaultFeishuCardTemplate) ||
    serialized === JSON.stringify(legacyDefaultFeishuCardTemplate)
  );
}

function localizeCardValue(
  value: JsonObject[keyof JsonObject] | JsonObject,
  replacements: ReadonlyMap<string, string>,
): unknown {
  if (typeof value === "string") {
    return replacements.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeCardValue(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeCardValue(item, replacements)]),
    );
  }

  return value;
}
