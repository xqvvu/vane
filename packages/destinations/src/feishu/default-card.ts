import { JsonObjectSchema } from "@vane/core";
import type { JsonObject } from "@vane/core";

import type { FeishuCardV2 } from "#/feishu/card.types.ts";

const defaultFeishuCardTemplateDefinition = {
  schema: "2.0",
  config: {
    width_mode: "compact",
    enable_forward: true,
    summary: {
      content: "[{{event.severity}}] {{event.title}}",
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
      content: "{{source.name}} · {{event.occurredAt}}",
    },
    text_tag_list: [
      {
        tag: "text_tag",
        text: {
          tag: "plain_text",
          content: "{{event.severity}}",
        },
        color: "red",
      },
      {
        tag: "text_tag",
        text: {
          tag: "plain_text",
          content: "{{event.status}}",
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
        content: "**告警摘要**\n{{event.message}}",
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
                  content: "**状态**\n{{event.status}}",
                  text_size: "notation",
                },
              },
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**告警源**\n{{source.name}}",
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
                  content: "**级别**\n{{event.severity}}",
                  text_size: "notation",
                },
              },
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**上游系统**\n{{source.provider}}",
                  text_size: "notation",
                },
              },
            ],
          },
        ],
      },
      {
        tag: "column_set",
        flex_mode: "bisect",
        columns: [
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**服务**\n{{event.labels.service}}",
                  text_size: "notation",
                },
              },
            ],
          },
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "**环境**\n{{event.labels.environment}}",
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
