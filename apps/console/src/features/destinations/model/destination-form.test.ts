import { describe, expect, it } from "vitest";

import {
  applyDynamicStatusColor,
  canApplyDynamicStatusColor,
  destinationTemplateFormStateFromDraft,
  destinationConfigPatchFromForm,
  destinationConfigFromForm,
  formDestinationKind,
  formDestinationKindValue,
} from "#/features/destinations/model/destination-form.ts";

describe("destination form helpers", () => {
  it("maps generic webhook method, headers, and template fields into destination config", () => {
    const data = new FormData();

    data.set("kind", "generic_webhook");
    data.set("url", "https://relay.example.test/vane");
    data.set("method", "PATCH");
    data.set("headers", "Authorization: Bearer relay-secret\nX-Team: sre\ninvalid");
    data.set("templateText", "{{event.title}} from {{source.name}}");

    expect(formDestinationKind(data)).toBe("generic_webhook");
    expect(destinationConfigFromForm("generic_webhook", data)).toEqual({
      url: "https://relay.example.test/vane",
      method: "PATCH",
      headers: {
        Authorization: "Bearer relay-secret",
        "X-Team": "sre",
      },
      template: {
        mode: "text",
        text: "{{event.title}} from {{source.name}}",
      },
    });
  });

  it("maps email recipients, reply-to, headers, and template fields into destination config", () => {
    const data = new FormData();

    data.set("kind", "email");
    data.set("endpointUrl", "https://mail.example.test/send");
    data.set("to", "sre@example.test, audit@example.test\nops@example.test");
    data.set("from", "vane@example.test");
    data.set("replyTo", "ops@example.test");
    data.set("subjectPrefix", "[Vane]");
    data.set("headers", "Authorization: Bearer gateway-secret\nX-Mailer: Vane");
    data.set("templateText", "{{event.message}}");

    expect(formDestinationKind(data)).toBe("email");
    expect(destinationConfigFromForm("email", data)).toEqual({
      endpointUrl: "https://mail.example.test/send",
      to: ["sre@example.test", "audit@example.test", "ops@example.test"],
      from: "vane@example.test",
      replyTo: "ops@example.test",
      subjectPrefix: "[Vane]",
      headers: {
        Authorization: "Bearer gateway-secret",
        "X-Mailer": "Vane",
      },
      template: {
        mode: "text",
        text: "{{event.message}}",
      },
    });
  });

  it("maps Feishu card templates into destination config", () => {
    const data = new FormData();

    data.set("kind", "feishu");
    data.set("webhookUrl", "https://open.feishu.cn/webhook");
    data.set("signSecret", "feishu-sign-secret");
    data.set("templateMode", "feishu_card");
    data.set(
      "templateBindings",
      JSON.stringify({
        statusColor: {
          select: "event.status",
          cases: { firing: "red", resolved: "green", unknown: "grey" },
          fallback: "grey",
        },
      }),
    );
    data.set(
      "templateCard",
      JSON.stringify({
        header: {
          title: {
            tag: "plain_text",
            content: "[{{event.severity}}] {{event.title}}",
          },
        },
        elements: [
          {
            tag: "div",
            text: {
              tag: "lark_md",
              content: "{{event.message}}",
            },
          },
        ],
      }),
    );

    expect(destinationConfigFromForm("feishu", data)).toEqual({
      webhookUrl: "https://open.feishu.cn/webhook",
      signSecret: "feishu-sign-secret",
      template: {
        mode: "feishu_card",
        bindings: {
          statusColor: {
            select: "event.status",
            cases: { firing: "red", resolved: "green", unknown: "grey" },
            fallback: "grey",
          },
        },
        card: {
          header: {
            title: {
              tag: "plain_text",
              content: "[{{event.severity}}] {{event.title}}",
            },
          },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: "{{event.message}}",
              },
            },
          ],
        },
      },
    });
  });

  it("builds destination edit patches without empty secret fields", () => {
    const generic = new FormData();

    generic.set("kind", "generic_webhook");
    generic.set("url", "");
    generic.set("method", "PATCH");
    generic.set("headers", "");
    generic.set("templateText", "{{event.title}} from {{destination.name}}");

    expect(destinationConfigPatchFromForm("generic_webhook", generic)).toEqual({
      method: "PATCH",
      template: {
        mode: "text",
        text: "{{event.title}} from {{destination.name}}",
      },
    });

    const email = new FormData();

    email.set("endpointUrl", "");
    email.set("to", "");
    email.set("from", "");
    email.set("subjectPrefix", "[Vane]");

    expect(destinationConfigPatchFromForm("email", email)).toEqual({
      subjectPrefix: "[Vane]",
    });

    const feishuCardWithoutDraft = new FormData();

    feishuCardWithoutDraft.set("templateMode", "feishu_card");
    feishuCardWithoutDraft.set("templateCard", "");

    expect(destinationConfigPatchFromForm("feishu", feishuCardWithoutDraft)).toEqual({});
  });

  it("falls back unknown destination form kinds to generic webhook", () => {
    expect(formDestinationKindValue("unsupported")).toBe("generic_webhook");
  });

  it("loads a saved binding draft without exposing unrelated config", () => {
    expect(
      destinationTemplateFormStateFromDraft({
        mode: "feishu_card",
        bindings: {
          statusColor: {
            select: "event.status",
            cases: { firing: "orange", resolved: "green" },
            fallback: "grey",
          },
        },
        card: {
          header: { template: "{{bindings.statusColor}}" },
        },
      }),
    ).toMatchObject({
      templateMode: "feishu_card",
      templateColorEnabled: true,
      templateColorSelector: "event.status",
      templateColorCases: { firing: "orange", resolved: "green" },
      templateColorFallback: "grey",
      templateCard: expect.stringContaining("{{bindings.statusColor}}"),
    });
  });

  it("applies dynamic status colors only to recognized card paths", () => {
    const card = JSON.stringify({
      header: {
        template: "red",
        text_tag_list: [
          { text: { content: "{{event.severity}}" }, color: "red" },
          { text: { content: "{{event.status}}" }, color: "orange" },
        ],
      },
      body: {
        color: "red",
      },
    });

    expect(canApplyDynamicStatusColor(card)).toBe(true);

    const applied = JSON.parse(applyDynamicStatusColor(card)) as {
      header: { template: string; text_tag_list: Array<{ color: string }> };
      body: { color: string };
    };

    expect(applied.header.template).toBe("{{bindings.statusColor}}");
    expect(applied.header.text_tag_list[0]?.color).toBe("red");
    expect(applied.header.text_tag_list[1]?.color).toBe("{{bindings.statusColor}}");
    expect(applied.body.color).toBe("red");
  });
});
