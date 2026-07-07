import { describe, expect, it } from "vitest";

import { createDefaultDestinationRegistry } from "#/registry.ts";

describe("destination registry", () => {
  it("projects adapters to a client-safe catalog", () => {
    const catalog = createDefaultDestinationRegistry().toCatalog();

    expect(catalog.map((item) => item.kind).sort()).toEqual([
      "email",
      "feishu",
      "generic_webhook",
      "slack",
    ]);
    expect(catalog.find((item) => item.kind === "generic_webhook")).toMatchObject({
      kind: "generic_webhook",
      configVersion: 1,
      lifecycle: {
        status: "stable",
      },
      displayNameKey: "destinations.kinds.generic_webhook",
      capabilities: {
        preview: true,
        test: true,
        delivery: true,
      },
    });
    expect(catalog.find((item) => item.kind === "feishu")).toMatchObject({
      configFields: [
        expect.any(Object),
        expect.any(Object),
        {
          type: "template",
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
        },
      ],
    });
    expect(JSON.stringify(catalog)).not.toContain("secretFields");
    expect(JSON.stringify(catalog)).not.toContain("configSchema");
    expect(JSON.stringify(catalog)).not.toContain("send");
  });
});
