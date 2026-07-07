import { defineAdapterTemplateConfigField } from "@vane/core";

import type { DestinationManifest } from "#/types.ts";

export const feishuManifest = {
  kind: "feishu",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "destinations.kinds.feishu",
  descriptionKey: "destinations.table.safeConfig.feishu",
  iconName: "feishu",
  configFields: [
    {
      type: "url",
      path: "webhookUrl",
      labelKey: "destinations.form.feishuWebhookUrl",
      required: true,
      sensitive: true,
    },
    {
      type: "secret",
      path: "signSecret",
      labelKey: "destinations.form.signSecret",
      placeholderKey: "destinations.form.optionalPlaceholder",
      sensitive: true,
    },
    defineAdapterTemplateConfigField({
      type: "template",
      path: "template",
      labelKey: "destinations.form.template",
      descriptionKey: "destinations.form.templateDescription",
      modes: [
        {
          mode: "text",
          labelKey: "destinations.form.templateModeText",
        },
        {
          mode: "feishu_card",
          labelKey: "destinations.form.templateModeFeishuCard",
          help: {
            labelKey: "destinations.form.feishuCardTemplateHelpLabel",
            descriptionKey: "destinations.form.feishuCardTemplateHelp",
            links: [
              {
                labelKey: "destinations.form.feishuCardJsonDocs",
                href: "https://open.feishu.cn/document/feishu-cards/card-json-structure",
              },
            ],
          },
        },
      ],
    }),
  ],
  secretFields: [
    {
      path: "webhookUrl",
      kind: "webhook_url",
      envHint: "FEISHU_WEBHOOK_URL",
      labelKey: "destinations.form.feishuWebhookUrl",
    },
    {
      path: "signSecret",
      kind: "signing_secret",
      envHint: "FEISHU_SIGN_SECRET",
      labelKey: "destinations.form.signSecret",
    },
  ],
  capabilities: {
    preview: true,
    test: true,
    delivery: true,
  },
} satisfies DestinationManifest<"feishu">;
