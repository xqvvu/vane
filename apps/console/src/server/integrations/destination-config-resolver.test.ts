import { describe, expect, it } from "vite-plus/test";

import { openSqliteStore } from "#/infra/sqlite/store";
import { createDestinationConfigResolver } from "#/server/integrations/destination-config-resolver";
import { DomainValidationError } from "#/server/runtime/domain-errors";

const NOW = "2026-10-09T00:00:00.000Z";

describe("destination config resolver", () => {
  it("returns non-Feishu configs untouched", async () => {
    const { resolver } = await createTestResolver();
    const config = { url: "https://relay.example.test" };

    await expect(resolver({ kind: "generic_webhook", config })).resolves.toBe(config);
  });

  it("injects the resolved credential for app send mode", async () => {
    const { app, resolver } = await createTestResolver();

    const resolved = await resolver({
      kind: "feishu",
      config: { sendMode: "app", app: { appRef: app.id, chatId: "oc_group" } },
    });

    expect(resolved).toEqual({
      sendMode: "app",
      app: {
        appRef: "feishu-app-1",
        chatId: "oc_group",
        appId: "cli_sre",
        appSecret: "secret-1",
      },
    });
  });

  it("leaves webhook-mode configs untouched, including a leftover app reference", async () => {
    const { app, resolver } = await createTestResolver();
    const config = {
      sendMode: "webhook",
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      app: { appRef: app.id, chatId: "oc_group" },
    };

    await expect(resolver({ kind: "feishu", config })).resolves.toBe(config);
  });

  it("treats a config without sendMode as webhook mode", async () => {
    const { app, resolver } = await createTestResolver();
    const config = {
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      app: { appRef: app.id, chatId: "oc_group" },
    };

    await expect(resolver({ kind: "feishu", config })).resolves.toBe(config);
  });

  it("keeps already resolved credentials without looking anything up", async () => {
    const { resolver, store } = await createTestResolver();

    await store.feishuApps.delete("feishu-app-1");

    const config = {
      sendMode: "app",
      app: { appRef: "feishu-app-1", chatId: "oc_group", appId: "cli_sre", appSecret: "secret-1" },
    };

    await expect(resolver({ kind: "feishu", config })).resolves.toBe(config);
  });

  it("fails with a domain validation error when the referenced app is gone", async () => {
    const { resolver, store } = await createTestResolver();

    await store.feishuApps.delete("feishu-app-1");

    await expect(
      resolver({
        kind: "feishu",
        config: { sendMode: "app", app: { appRef: "feishu-app-1", chatId: "oc_group" } },
      }),
    ).rejects.toThrow(DomainValidationError);
  });
});

async function createTestResolver() {
  const store = await openSqliteStore({
    databasePath: ":memory:",
    now: () => NOW,
    ids: {
      feishuApp: () => "feishu-app-1",
    },
  });
  const app = await store.feishuApps.create({
    name: "SRE pager",
    appId: "cli_sre",
    appSecret: "secret-1",
  });
  const resolver = createDestinationConfigResolver({ store });

  return { app, resolver, store };
}
