import { describe, expect, it } from "vite-plus/test";

import { createFeishuUrgentPhoneAdapter } from "#destinations/urgency/feishu-urgent/index";
import { createDefaultUrgencyRegistry, UrgencyRegistry } from "#destinations/urgency/registry";
import type { UrgencyChannelAdapter } from "#destinations/urgency/types";

describe("urgency registry", () => {
  it("registers the feishu urgent phone channel by default", () => {
    const registry = createDefaultUrgencyRegistry();

    expect(registry.list.map((adapter) => adapter.kind)).toEqual(["feishu_urgent_phone"]);
  });

  it("rejects duplicate channel kinds", () => {
    const registry = new UrgencyRegistry();

    registry.register(createFeishuUrgentPhoneAdapter());

    expect(() => registry.register(createFeishuUrgentPhoneAdapter())).toThrow(
      "Urgency channel already registered: feishu_urgent_phone",
    );
  });

  it("rejects unknown channel kinds at registration", () => {
    const registry = new UrgencyRegistry();

    expect(() =>
      registry.register({ kind: "pagerduty" } as unknown as UrgencyChannelAdapter),
    ).toThrow();
  });

  it("fails lookup for an unregistered channel", () => {
    const registry = new UrgencyRegistry();

    expect(() => registry.get("feishu_urgent_phone")).toThrow(
      "Unknown urgency channel: feishu_urgent_phone",
    );
  });

  it("delegates pings to the registered channel", async () => {
    const pings: unknown[] = [];
    const registry = new UrgencyRegistry();

    registry.register({
      kind: "feishu_urgent_phone",
      async ping(input) {
        pings.push(input);

        return { ok: true, statusCode: 200, responseBody: "{}" };
      },
    });

    const result = await registry.ping("feishu_urgent_phone", {
      app: { appId: "cli_sre", appSecret: "secret-1" },
      messageId: "om_1",
      receivers: ["ou_1"],
      userIdType: "open_id",
    });

    expect(result).toEqual({ ok: true, statusCode: 200, responseBody: "{}" });
    expect(pings).toHaveLength(1);
  });
});
