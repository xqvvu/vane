import { parse as parseToml } from "smol-toml";
import { describe, expect, it } from "vitest";

import { createDefaultDestinationRegistry } from "@vane/destinations";
import type { DestinationSendContext } from "@vane/destinations";

import { openSqliteStore } from "#/infra/sqlite/store.ts";
import { AppSettingsService } from "#/server/configuration/app-settings.service.ts";
import { ConfigPortabilityService } from "#/server/configuration/config-portability.service.ts";
import { DestinationService } from "#/server/destinations/destination.service.ts";
import { hashSourceToken } from "#/server/intake/intake.service.ts";
import { RouteService } from "#/server/routes/route.service.ts";
import { SourceService } from "#/server/sources/source.service.ts";

const now = "2026-06-09T08:00:00.000Z";

async function createStore() {
  return openSqliteStore({
    databasePath: ":memory:",
    now: () => now,
  });
}

/**
 * Composes the per-domain configuration services over a single store. The
 * tests below exercise sources, destinations, routes, settings, and TOML
 * portability together, so the harness wires them into one object instead of
 * repeating the same construction in every case.
 */
function createConfigurationServices(
  store: Awaited<ReturnType<typeof createStore>>,
  destinationSendContext?: DestinationSendContext,
) {
  const destinations = createDefaultDestinationRegistry();
  const generateSourceToken = () => "vane_src_test_token";

  const sources = new SourceService({ store, generateSourceToken });
  const destinationService = new DestinationService({
    store,
    destinations,
    destinationSendContext,
  });
  const routes = new RouteService({ store });
  const appSettings = new AppSettingsService({ store });
  const portability = new ConfigPortabilityService({ store, destinations, generateSourceToken });

  return {
    createSource: sources.createSource.bind(sources),
    updateSource: sources.updateSource.bind(sources),
    rotateSourceToken: sources.rotateSourceToken.bind(sources),
    deleteSource: sources.deleteSource.bind(sources),
    createDestination: destinationService.createDestination.bind(destinationService),
    updateDestination: destinationService.updateDestination.bind(destinationService),
    deleteDestination: destinationService.deleteDestination.bind(destinationService),
    testDestination: destinationService.testDestination.bind(destinationService),
    previewDestination: destinationService.previewDestination.bind(destinationService),
    previewDestinationDraft: destinationService.previewDestinationDraft.bind(destinationService),
    previewDestinationUpdate: destinationService.previewDestinationUpdate.bind(destinationService),
    createRoute: routes.createRoute.bind(routes),
    updateRoute: routes.updateRoute.bind(routes),
    deleteRoute: routes.deleteRoute.bind(routes),
    updateAppSettings: appSettings.updateAppSettings.bind(appSettings),
    listConfiguration: portability.listConfiguration.bind(portability),
    exportToml: portability.exportToml.bind(portability),
    importToml: portability.importToml.bind(portability),
  };
}

async function createService(store?: Awaited<ReturnType<typeof createStore>>) {
  store ??= await createStore();

  return {
    store,
    service: createConfigurationServices(store),
  };
}

async function createServiceWithDestinationFetch(fetch: DestinationSendContext["fetch"]) {
  const store = await createStore();

  return {
    store,
    service: createConfigurationServices(store, { fetch }),
  };
}

describe("configuration service", () => {
  it("creates sources with one-time plaintext tokens and persisted token hashes", async () => {
    const { store, service } = await createService();

    const created = await service.createSource({
      name: "Generic source",
      provider: "generic",
      config: {
        team: "sre",
      },
    });
    const stored = await store.sources.get(created.source.id);

    expect(created.source).toMatchObject({
      name: "Generic source",
      provider: "generic",
      enabled: true,
    });
    expect(created.token).toBe("vane_src_test_token");
    expect(stored?.tokenHash).toBe(hashSourceToken("vane_src_test_token"));
    expect(stored?.config).toEqual({ team: "sre" });

    await store.close();
  });

  it("rotates source tokens without returning the hash", async () => {
    const { store, service } = await createService();
    const created = await service.createSource({
      name: "Generic source",
      provider: "generic",
    });

    const rotated = await service.rotateSourceToken({ id: created.source.id });

    expect(rotated.token).toBe("vane_src_test_token");
    expect((await store.sources.get(created.source.id))?.tokenHash).toBe(
      hashSourceToken("vane_src_test_token"),
    );

    await store.close();
  });

  it("updates source metadata without exposing or changing the token hash", async () => {
    const { store, service } = await createService();
    const created = await service.createSource({
      name: "Generic source",
      provider: "generic",
      config: {
        signingSecret: "old-secret",
        team: "sre",
      },
    });
    const before = await store.sources.get(created.source.id);

    const updated = await service.updateSource({
      id: created.source.id,
      name: "Grafana prod",
      provider: "grafana",
      config: {
        signingSecret: "new-secret",
      },
    });

    expect(updated).toEqual({
      id: created.source.id,
      name: "Grafana prod",
      provider: "grafana",
      enabled: true,
    });
    expect(updated).not.toHaveProperty("tokenHash");
    expect((await store.sources.get(created.source.id))?.tokenHash).toBe(before?.tokenHash);
    expect((await store.sources.get(created.source.id))?.config).toEqual({
      signingSecret: "new-secret",
      team: "sre",
    });

    await store.close();
  });

  it("validates destination config through the registered destination sender", async () => {
    const { store, service } = await createService();

    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
        method: "PATCH",
        headers: {
          "x-team": "sre",
        },
      },
    });
    const stored = await store.destinations.get(destination.id);

    expect(destination).toMatchObject({
      name: "Ops webhook",
      kind: "generic_webhook",
      enabled: true,
    });
    expect(stored?.config).toEqual({
      url: "https://example.test/webhook",
      method: "PATCH",
      headers: {
        "x-team": "sre",
      },
    });

    await expect(
      service.createDestination({
        name: "Broken webhook",
        kind: "generic_webhook",
        config: {
          url: "not a url",
        },
      }),
    ).rejects.toThrow("Invalid URL");
    await expect(
      service.createDestination({
        name: "Broken template webhook",
        kind: "generic_webhook",
        config: {
          url: "https://example.test/webhook",
          template: { mode: "text", text: "{{event.title.toUpperCase}}" },
        },
      }),
    ).rejects.toThrow("Destination template contains unknown variable: event.title.toUpperCase");
    await expect(
      service.updateDestination({
        id: destination.id,
        config: {
          template: { mode: "text", text: "{{process.env.SECRET}}" },
        },
      }),
    ).rejects.toThrow("Destination template contains unknown variable: process.env.SECRET");

    await store.close();
  });

  it("validates email destination config through the registered destination sender", async () => {
    const { store, service } = await createService();

    const destination = await service.createDestination({
      name: "Email SRE",
      kind: "email",
      config: {
        endpointUrl: "https://mail-gateway.example.test/send",
        to: ["sre@example.test"],
        from: "vane@example.test",
        replyTo: "ops@example.test",
        subjectPrefix: "[Vane]",
        headers: {
          Authorization: "Bearer mail-gateway-secret",
        },
      },
    });
    const stored = await store.destinations.get(destination.id);

    expect(destination).toMatchObject({
      name: "Email SRE",
      kind: "email",
      enabled: true,
    });
    expect(stored?.config).toEqual({
      endpointUrl: "https://mail-gateway.example.test/send",
      to: ["sre@example.test"],
      from: "vane@example.test",
      replyTo: "ops@example.test",
      subjectPrefix: "[Vane]",
      headers: {
        Authorization: "Bearer mail-gateway-secret",
      },
    });

    await expect(
      service.createDestination({
        name: "Broken email",
        kind: "email",
        config: {
          endpointUrl: "https://mail-gateway.example.test/send",
          to: ["not-an-email"],
          from: "vane@example.test",
        },
      }),
    ).rejects.toThrow("Invalid email address");

    await store.close();
  });

  it("lists configuration without source token hashes or destination secrets", async () => {
    const { store, service } = await createService();
    const source = await service.createSource({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    const destination = await service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
      secretRefs: {
        webhookUrl: "SLACK_WEBHOOK_URL",
      },
    });

    const snapshot = await service.listConfiguration();

    expect(snapshot.sources).toEqual([
      {
        id: source.source.id,
        name: "Grafana prod",
        provider: "grafana",
        enabled: true,
      },
    ]);
    expect(snapshot.destinations).toEqual([
      {
        id: destination.id,
        name: "Slack SRE",
        kind: "slack",
        enabled: true,
      },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain("vane_src_test_token");
    expect(JSON.stringify(snapshot)).not.toContain(hashSourceToken("vane_src_test_token"));
    expect(JSON.stringify(snapshot)).not.toContain("https://hooks.slack.com/services/secret");
    expect(JSON.stringify(snapshot)).not.toContain("SLACK_WEBHOOK_URL");

    await store.close();
  });

  it("tests destinations through registered senders without returning rendered payloads", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const { store, service } = await createServiceWithDestinationFetch(async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 202,
        text: async () => "accepted token=downstream-token password: downstream-password",
      };
    });
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });

    const result = await service.testDestination({ id: destination.id });

    expect(result).toEqual({
      destination,
      success: true,
      statusCode: 202,
      responseBody: "accepted token=[REDACTED] password: [REDACTED]",
      error: null,
    });
    expect(JSON.stringify(result)).not.toContain("downstream-token");
    expect(JSON.stringify(result)).not.toContain("downstream-password");
    expect(calls[0]?.url).toBe("https://example.test/webhook");
    expect(JSON.parse(calls[0]?.init.body as string)).toMatchObject({
      eventId: expect.stringMatching(/^test-/),
      alert: {
        title: "Vane destination test",
        severity: "info",
      },
    });
    expect(result).not.toHaveProperty("renderedPayload");

    await store.close();
  });

  it("previews destination templates without sending or returning config", async () => {
    const { store, service } = await createService();
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
        template: { mode: "text", text: "{{event.title}} from {{source.name}}" },
      },
    });

    const result = await service.previewDestination({ id: destination.id });

    expect(result.destination).toEqual(destination);
    expect(result.sample).toEqual({
      kind: "built_in",
      eventId: "preview-event",
      source: {
        id: "preview-source",
        name: "Vane preview",
        provider: "generic",
        enabled: true,
      },
      receivedAt: null,
    });
    expect(result.context.event.title).toBe("Vane destination test");
    expect(result.context.source.name).toBe("Vane preview");
    expect(result.normalizedEvent.title).toBe("Vane destination test");
    expect(result.diagnostics).toEqual([]);
    expect(result.rawPayloadReference).toBeNull();
    expect(result.renderedPayload).toMatchObject({
      eventId: "preview-event",
      message: "Vane destination test from Vane preview",
    });
    expect(result).not.toHaveProperty("config");
    expect(JSON.stringify(result)).not.toContain("https://example.test/webhook");

    const emailDestination = await service.createDestination({
      name: "Email SRE",
      kind: "email",
      config: {
        endpointUrl: "https://mail-gateway.example.test/send",
        to: ["sre@example.test"],
        from: "vane@example.test",
        replyTo: "ops@example.test",
      },
    });
    const emailPreview = await service.previewDestination({ id: emailDestination.id });

    expect(emailPreview.renderedPayload).toMatchObject({
      subject: "[INFO firing] Vane destination test",
    });
    expect(emailPreview.renderedPayload).not.toHaveProperty("to");
    expect(emailPreview.renderedPayload).not.toHaveProperty("from");
    expect(emailPreview.renderedPayload).not.toHaveProperty("replyTo");
    expect(JSON.stringify(emailPreview)).not.toContain("https://mail-gateway.example.test/send");
    expect(JSON.stringify(emailPreview)).not.toContain("sre@example.test");

    await store.close();
  });

  it("previews destination templates with historical event samples and redacted raw reference", async () => {
    const { store, service } = await createService();
    const source = await service.createSource({
      name: "SigNoz",
      provider: "signoz",
    });
    const event = await store.intake.recordEvent({
      id: "event-template-preview",
      sourceId: source.source.id,
      idempotencyKey: null,
      normalized: {
        title: "High CPU",
        message: "CPU above threshold",
        severity: "critical",
        status: "firing",
        fingerprint: "signoz:cpu:api",
        labels: {
          service: "api",
          environment: "prod",
        },
        occurredAt: "2026-06-09T07:59:00.000Z",
      },
      rawPayload: {
        alertname: "HighCPU",
        token: "raw-token",
        nested: {
          signingSecret: "raw-signing-secret",
          safe: "visible",
        },
      },
      rawHeaders: {
        authorization: "Bearer source-token",
        "x-signoz": "visible-header",
      },
    });
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
        template: { mode: "text", text: "{{event.title}} {{event.labels.service}}" },
      },
    });

    const result = await service.previewDestination({
      id: destination.id,
      sampleEventId: event.id,
    });

    expect(result.sample).toEqual({
      kind: "historical_event",
      eventId: event.id,
      source: source.source,
      receivedAt: now,
    });
    expect(result.context.event.id).toBe(event.id);
    expect(result.context.event.labels.service).toBe("api");
    expect(result.normalizedEvent.title).toBe("High CPU");
    expect(result.renderedPayload).toMatchObject({
      eventId: event.id,
      message: "High CPU api",
    });
    expect(result.rawPayloadReference).toEqual({
      eventId: event.id,
      payload: {
        alertname: "HighCPU",
        token: "[REDACTED]",
        nested: {
          signingSecret: "[REDACTED]",
          safe: "visible",
        },
      },
      headers: {
        authorization: "[REDACTED]",
        "x-signoz": "visible-header",
      },
    });
    expect(JSON.stringify(result)).not.toContain("raw-token");
    expect(JSON.stringify(result)).not.toContain("raw-signing-secret");
    expect(JSON.stringify(result)).not.toContain("source-token");
    expect(JSON.stringify(result)).not.toContain("https://example.test/webhook-secret");

    await store.close();
  });

  it("previews Feishu card destination templates without signing fields", async () => {
    const { store, service } = await createService();
    const destination = await service.createDestination({
      name: "Ops Feishu",
      kind: "feishu",
      config: {
        webhookUrl: "https://open.feishu.cn/webhook/secret-url",
        signSecret: "feishu-sign-secret",
        template: {
          mode: "feishu_card",
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
                  content: "{{event.message}}\nsource={{source.name}}",
                },
              },
            ],
          },
        },
      },
    });

    const result = await service.previewDestination({ id: destination.id });

    expect(result.renderedPayload).toEqual({
      msg_type: "interactive",
      card: {
        header: {
          title: {
            tag: "plain_text",
            content: "[info] Vane destination test",
          },
        },
        elements: [
          {
            tag: "div",
            text: {
              tag: "lark_md",
              content: "This is a test alert generated from Vane Console.\nsource=Vane preview",
            },
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain("https://open.feishu.cn/webhook/secret-url");
    expect(JSON.stringify(result)).not.toContain("feishu-sign-secret");
    expect(result.renderedPayload).not.toHaveProperty("timestamp");
    expect(result.renderedPayload).not.toHaveProperty("sign");

    await store.close();
  });

  it("returns template diagnostics when draft preview rendering fails", async () => {
    const { store, service } = await createService();
    const result = await service.previewDestinationDraft({
      name: "Ops Feishu",
      kind: "feishu",
      config: {
        webhookUrl: "https://open.feishu.cn/webhook/secret-url",
        template: {
          mode: "feishu_card",
          card: {
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: "{{raw.secret}}",
                },
              },
            ],
          },
        },
      },
    });

    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        path: "template.card.elements.0.text.content",
        variable: "raw.secret",
        message: "Destination template contains unknown variable: raw.secret",
      },
    ]);
    expect(result.renderedPayload).toEqual({
      templateError: {
        diagnostics: [
          {
            severity: "error",
            path: "template.card.elements.0.text.content",
            variable: "raw.secret",
            message: "Destination template contains unknown variable: raw.secret",
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain("https://open.feishu.cn/webhook/secret-url");

    await store.close();
  });

  it("previews draft destination templates before saving config", async () => {
    const { store, service } = await createService();

    const result = await service.previewDestinationDraft({
      name: "Unsaved webhook",
      kind: "generic_webhook",
      config: {
        url: "https://relay.example.test/draft-secret",
        template: { mode: "text", text: "{{event.title}} from {{source.name}}" },
      },
    });

    expect(result.destination).toEqual({
      id: "preview-destination",
      name: "Unsaved webhook",
      kind: "generic_webhook",
      enabled: true,
    });
    expect(result.renderedPayload).toMatchObject({
      message: "Vane destination test from Vane preview",
    });
    expect((await service.listConfiguration()).destinations).toEqual([]);
    expect(result).not.toHaveProperty("config");
    expect(JSON.stringify(result)).not.toContain("https://relay.example.test/draft-secret");

    await store.close();
  });

  it("updates destination metadata and template patches without clearing server-side secrets", async () => {
    const { store, service } = await createService();
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
        method: "PATCH",
        headers: {
          Authorization: "Bearer relay-secret",
          "X-Team": "sre",
        },
        template: { mode: "text", text: "{{event.title}}" },
      },
    });

    const preview = await service.previewDestinationUpdate({
      id: destination.id,
      name: "Renamed webhook",
      config: {
        headers: {
          "X-Team": "platform",
        },
        template: { mode: "text", text: "{{event.title}} from {{destination.name}}" },
      },
    });
    const updated = await service.updateDestination({
      id: destination.id,
      name: "Renamed webhook",
      config: {
        headers: {
          "X-Team": "platform",
        },
        template: { mode: "text", text: "{{event.title}} from {{destination.name}}" },
      },
    });

    expect(preview.destination).toEqual({
      id: destination.id,
      name: "Renamed webhook",
      kind: "generic_webhook",
      enabled: true,
    });
    expect(preview.renderedPayload).toMatchObject({
      message: "Vane destination test from Renamed webhook",
    });
    expect(JSON.stringify(preview)).not.toContain("https://example.test/webhook-secret");
    expect(JSON.stringify(preview)).not.toContain("Bearer relay-secret");
    expect(updated.name).toBe("Renamed webhook");
    expect((await store.destinations.get(destination.id))?.config).toEqual({
      url: "https://example.test/webhook-secret",
      method: "PATCH",
      headers: {
        Authorization: "Bearer relay-secret",
        "X-Team": "platform",
      },
      template: { mode: "text", text: "{{event.title}} from {{destination.name}}" },
    });

    await store.close();
  });

  it("rejects destination kind changes that do not provide compatible config", async () => {
    const { store, service } = await createService();
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
      },
    });

    await expect(
      service.updateDestination({
        id: destination.id,
        kind: "slack",
      }),
    ).rejects.toThrow("Invalid input");
    expect(await store.destinations.get(destination.id)).toMatchObject({
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
        method: "POST",
      },
    });

    await store.close();
  });

  it("updates app settings through the configuration service", async () => {
    const { store, service } = await createService();

    expect((await service.listConfiguration()).settings.rawPayloadRetentionDays).toBe(30);

    const settings = await service.updateAppSettings({
      rawPayloadRetentionDays: 7,
    });

    expect(settings.rawPayloadRetentionDays).toBe(7);
    expect((await service.listConfiguration()).settings.rawPayloadRetentionDays).toBe(7);

    await store.close();
  });

  it("exports portable TOML without plaintext destination secrets by default", async () => {
    const { store, service } = await createService();
    const source = await service.createSource({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    const destination = await service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
    });
    await service.createRoute({
      name: "Critical route",
      rule: {
        sourceIds: [source.source.id],
        severities: ["critical"],
      },
      destinationIds: [destination.id],
    });

    const toml = await service.exportToml({
      now: () => now,
    });

    expect(toml).toContain("[settings]");
    expect(toml).toContain("raw_payload_retention_days = 30");
    expect(toml).toContain("[[sources]]");
    expect(toml).toContain("[[destinations]]");
    expect(toml).toContain("[[routes]]");
    expect(toml).not.toContain("https://hooks.slack.com/services/secret");
    expect(toml).toContain("VANE_DEST_");
    expect(toml).toContain("webhookUrl");
    expect(parseToml(toml)).toMatchObject({
      settings: {
        schema_version: "vane.config.v1",
        raw_payload_retention_days: 30,
      },
    });
    expect(toml).not.toContain("vane_src_test_token");
    expect(toml).not.toContain(hashSourceToken("vane_src_test_token"));

    await store.close();
  });

  it("round-trips sources, routes, destinations, and settings through TOML", async () => {
    const first = await createService();
    const source = await first.service.createSource({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    const destination = await first.service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
      secretRefs: {
        webhookUrl: {
          env: "SLACK_WEBHOOK_URL",
        },
      },
    });
    await first.service.createRoute({
      name: "Critical route",
      rule: {
        sourceIds: [source.source.id],
        severities: ["critical"],
        labels: [{ key: "service", operator: "equals", value: "api" }],
      },
      destinationIds: [destination.id],
    });
    await first.service.updateAppSettings({ rawPayloadRetentionDays: 7 });

    const toml = await first.service.exportToml({
      now: () => now,
    });
    const second = await createService();
    const result = await second.service.importToml(toml, {
      env: {
        SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/imported",
      },
    });

    expect(result.generatedSourceTokens).toEqual([
      {
        sourceId: source.source.id,
        sourceName: "Grafana prod",
        token: "vane_src_test_token",
      },
    ]);
    expect(await second.store.settings.get()).toEqual({
      rawPayloadRetentionDays: 7,
    });
    expect(await second.store.sources.get(source.source.id)).toMatchObject({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    expect(await second.store.destinations.get(destination.id)).toMatchObject({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/imported",
      },
      secretRefs: {
        webhookUrl: {
          env: "SLACK_WEBHOOK_URL",
        },
      },
    });
    expect(await second.store.routes.list()).toEqual([
      expect.objectContaining({
        name: "Critical route",
        rule: expect.objectContaining({
          sourceIds: [source.source.id],
          severities: ["critical"],
          labels: [{ key: "service", operator: "equals", value: "api" }],
        }),
        destinationIds: [destination.id],
      }),
    ]);

    await first.store.close();
    await second.store.close();
  });

  it("rejects plaintext destination secret exports", async () => {
    const { store, service } = await createService();

    await service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
    });

    await expect(
      service.exportToml({
        includeSecrets: true,
        now: () => now,
      }),
    ).rejects.toThrow("Plaintext secret export is not supported");

    await store.close();
  });

  it("exports nested destination header secrets as environment references", async () => {
    const { store, service } = await createService();

    await service.createDestination({
      name: "Relay with auth",
      kind: "generic_webhook",
      config: {
        url: "https://relay.example.test/vane",
        headers: {
          Authorization: "Bearer relay-secret",
          "X-Team": "sre",
        },
      },
    });

    const toml = await service.exportToml({
      now: () => now,
    });

    expect(toml).not.toContain("https://relay.example.test/vane");
    expect(toml).not.toContain("Bearer relay-secret");
    expect(toml).toContain('X-Team = "sre"');
    expect(toml).toContain("headers.Authorization");
    expect(toml).toContain("VANE_DEST_");

    await store.close();
  });

  it("exports source config and Feishu signing secrets without plaintext secret values", async () => {
    const { store, service } = await createService();

    await service.createSource({
      name: "Signed upstream",
      provider: "generic",
      config: {
        signingSecret: "source-signing-secret",
        team: "sre",
      },
    });
    await service.createDestination({
      name: "Feishu SRE",
      kind: "feishu",
      config: {
        webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/secret",
        signSecret: "feishu-signing-secret",
      },
    });

    const toml = await service.exportToml({
      now: () => now,
    });

    expect(toml).not.toContain("source-signing-secret");
    expect(toml).not.toContain("https://open.feishu.cn/open-apis/bot/v2/hook/secret");
    expect(toml).not.toContain("feishu-signing-secret");
    expect(toml).toContain('team = "sre"');
    expect(toml).toContain("[sources.secret_refs.signingSecret]");
    expect(toml).toContain("VANE_SOURCE_");
    expect(toml).toContain("signSecret");
    expect(toml).toContain("VANE_DEST_");

    await store.close();
  });

  it("imports portable TOML and resolves destination secret references from env", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[sources]]",
      'id = "source-imported"',
      'name = "Imported source"',
      'provider = "generic"',
      "enabled = true",
      "",
      "[[destinations]]",
      'id = "destination-imported"',
      'name = "Imported Slack"',
      'kind = "slack"',
      "enabled = true",
      "",
      "[destinations.secret_refs.webhookUrl]",
      'env = "SLACK_WEBHOOK_URL"',
      "",
      "[[routes]]",
      'id = "route-imported"',
      'name = "Imported critical route"',
      "enabled = true",
      'destination_ids = ["destination-imported"]',
      "",
      "[routes.rule]",
      'source_ids = ["source-imported"]',
      'severities = ["critical"]',
      "",
    ].join("\n");

    const result = await service.importToml(toml, {
      env: {
        SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/imported",
      },
    });

    expect(result.generatedSourceTokens).toEqual([
      {
        sourceId: "source-imported",
        sourceName: "Imported source",
        token: "vane_src_test_token",
      },
    ]);
    expect(await store.sources.get("source-imported")).toMatchObject({
      name: "Imported source",
      provider: "generic",
      tokenHash: hashSourceToken("vane_src_test_token"),
    });
    expect(await store.destinations.get("destination-imported")).toMatchObject({
      name: "Imported Slack",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/imported",
      },
      secretRefs: {
        webhookUrl: {
          env: "SLACK_WEBHOOK_URL",
        },
      },
    });
    expect(await store.routes.get("route-imported")).toMatchObject({
      name: "Imported critical route",
      destinationIds: ["destination-imported"],
      rule: {
        sourceIds: ["source-imported"],
        severities: ["critical"],
      },
    });
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(14);

    await store.close();
  });

  it("imports portable TOML and resolves source secret references from env", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[sources]]",
      'id = "source-signed"',
      'name = "Signed source"',
      'provider = "generic"',
      "enabled = true",
      "",
      "[sources.config]",
      'team = "sre"',
      "",
      "[sources.secret_refs.signingSecret]",
      'env = "SOURCE_SIGNING_SECRET"',
      "",
    ].join("\n");

    await service.importToml(toml, {
      env: {
        SOURCE_SIGNING_SECRET: "provider-shared-secret",
      },
    });

    expect(await store.sources.get("source-signed")).toMatchObject({
      name: "Signed source",
      provider: "generic",
      config: {
        team: "sre",
        signingSecret: "provider-shared-secret",
      },
    });

    await store.close();
  });

  it("imports nested destination header secret references from env", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[destinations]]",
      'id = "destination-relay"',
      'name = "Relay with auth"',
      'kind = "generic_webhook"',
      "enabled = true",
      "",
      "[destinations.config.headers]",
      'X-Team = "sre"',
      "",
      "[destinations.secret_refs.url]",
      'env = "RELAY_URL"',
      "",
      '[destinations.secret_refs."headers.Authorization"]',
      'env = "RELAY_AUTH"',
      "",
    ].join("\n");

    await service.importToml(toml, {
      env: {
        RELAY_URL: "https://relay.example.test/vane",
        RELAY_AUTH: "Bearer relay-secret",
      },
    });

    expect(await store.destinations.get("destination-relay")).toMatchObject({
      name: "Relay with auth",
      kind: "generic_webhook",
      config: {
        url: "https://relay.example.test/vane",
        method: "POST",
        headers: {
          Authorization: "Bearer relay-secret",
          "X-Team": "sre",
        },
      },
      secretRefs: {
        url: {
          env: "RELAY_URL",
        },
        "headers.Authorization": {
          env: "RELAY_AUTH",
        },
      },
    });

    await store.close();
  });

  it("rejects imported destination configs that fail adapter validation before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[sources]]",
      'id = "source-imported"',
      'name = "Imported source"',
      'provider = "generic"',
      "enabled = true",
      "",
      "[[destinations]]",
      'id = "destination-broken"',
      'name = "Broken Slack"',
      'kind = "slack"',
      "enabled = true",
      "",
      "[destinations.config]",
      'webhookUrl = "not a url"',
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow("Invalid URL");
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);
    expect(await store.sources.list()).toEqual([]);
    expect(await store.destinations.list()).toEqual([]);

    await store.close();
  });

  it("rejects imported routes without destinations before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[routes]]",
      'id = "route-without-destinations"',
      'name = "Broken route"',
      "enabled = true",
      "destination_ids = []",
      "",
      "[routes.rule]",
      'severities = ["critical"]',
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow("Too small");
    expect(await store.routes.list()).toEqual([]);
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects portable TOML that claims to include plaintext secrets", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = true",
      "raw_payload_retention_days = 14",
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow("Invalid input");
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects invalid TOML before changing stored configuration", async () => {
    const { store, service } = await createService();

    await expect(service.importToml("[settings")).rejects.toThrow("Invalid TOML document");
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);
    expect(await store.sources.list()).toEqual([]);

    await store.close();
  });

  it("rejects unknown TOML keys before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "unexpected = true",
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow("Unrecognized key");
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects unknown providers and destination kinds before changing stored configuration", async () => {
    const { store, service } = await createService();
    const unknownProviderToml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[sources]]",
      'id = "source-unknown"',
      'name = "Unknown"',
      'provider = "pagerduty"',
      "enabled = true",
      "",
    ].join("\n");
    const unknownDestinationToml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[destinations]]",
      'id = "destination-unknown"',
      'name = "Unknown"',
      'kind = "sms"',
      "enabled = true",
      "",
    ].join("\n");

    await expect(service.importToml(unknownProviderToml)).rejects.toThrow("Invalid option");
    await expect(service.importToml(unknownDestinationToml)).rejects.toThrow("Invalid option");
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);
    expect(await store.sources.list()).toEqual([]);
    expect(await store.destinations.list()).toEqual([]);

    await store.close();
  });

  it("rejects missing environment variables for secret references before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[destinations]]",
      'id = "destination-slack"',
      'name = "Slack SRE"',
      'kind = "slack"',
      "enabled = true",
      "",
      "[destinations.secret_refs.webhookUrl]",
      'env = "SLACK_WEBHOOK_URL"',
      "",
    ].join("\n");

    await expect(service.importToml(toml, { env: {} })).rejects.toThrow(
      "Missing environment variable for destination secret: SLACK_WEBHOOK_URL",
    );
    expect(await store.destinations.list()).toEqual([]);
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects missing source secret environment variables before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[sources]]",
      'id = "source-signed"',
      'name = "Signed source"',
      'provider = "generic"',
      "enabled = true",
      "",
      "[sources.secret_refs.signingSecret]",
      'env = "SOURCE_SIGNING_SECRET"',
      "",
    ].join("\n");

    await expect(service.importToml(toml, { env: {} })).rejects.toThrow(
      "Missing environment variable for source secret: SOURCE_SIGNING_SECRET",
    );
    expect(await store.sources.list()).toEqual([]);
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects route configuration that references unknown destinations", async () => {
    const { store, service } = await createService();
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = await service.createRoute({
      name: "Known destination route",
      destinationIds: [destination.id],
    });

    await expect(
      service.createRoute({
        name: "Broken route",
        destinationIds: ["destination-missing"],
      }),
    ).rejects.toThrow("Unknown destination IDs: destination-missing");
    await expect(
      service.updateRoute({
        id: route.id,
        destinationIds: [destination.id, "destination-missing"],
      }),
    ).rejects.toThrow("Unknown destination IDs: destination-missing");
    expect((await store.routes.get(route.id))?.destinationIds).toEqual([destination.id]);

    await store.close();
  });

  it("rejects route configuration with duplicate destinations", async () => {
    const { store, service } = await createService();
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });

    await expect(
      service.createRoute({
        name: "Duplicate destination route",
        destinationIds: [destination.id, destination.id],
      }),
    ).rejects.toThrow("Route destination IDs must be unique");
    expect(await store.routes.list()).toEqual([]);

    await store.close();
  });

  it("deletes source references without widening route matching", async () => {
    const { store, service } = await createService();
    const grafana = await service.createSource({
      name: "Grafana prod",
      provider: "grafana",
    });
    const signoz = await service.createSource({
      name: "SigNoz prod",
      provider: "signoz",
    });
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const directRoute = await service.createRoute({
      name: "Grafana only",
      rule: {
        sourceIds: [grafana.source.id],
      },
      destinationIds: [destination.id],
    });
    const sharedRoute = await service.createRoute({
      name: "Grafana and SigNoz",
      rule: {
        sourceIds: [grafana.source.id, signoz.source.id],
      },
      destinationIds: [destination.id],
    });
    const catchAllRoute = await service.createRoute({
      name: "Catch all",
      destinationIds: [destination.id],
    });

    await service.deleteSource({ id: grafana.source.id });

    expect(await store.sources.get(grafana.source.id)).toBeNull();
    expect(await store.routes.get(directRoute.id)).toBeNull();
    expect(await store.routes.get(sharedRoute.id)).toMatchObject({
      rule: expect.objectContaining({
        sourceIds: [signoz.source.id],
      }),
    });
    expect(await store.routes.get(catchAllRoute.id)).toMatchObject({
      rule: expect.objectContaining({
        sourceIds: [],
      }),
    });

    await store.close();
  });

  it("deletes destination references and drops routes with no remaining targets", async () => {
    const { store, service } = await createService();
    const primary = await service.createDestination({
      name: "Primary webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/primary",
      },
    });
    const audit = await service.createDestination({
      name: "Audit webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/audit",
      },
    });
    const directRoute = await service.createRoute({
      name: "Primary only",
      destinationIds: [primary.id],
    });
    const sharedRoute = await service.createRoute({
      name: "Primary and audit",
      destinationIds: [primary.id, audit.id],
    });

    await service.deleteDestination({ id: primary.id });

    expect(await store.destinations.get(primary.id)).toBeNull();
    expect(await store.routes.get(directRoute.id)).toBeNull();
    expect(await store.routes.get(sharedRoute.id)).toMatchObject({
      destinationIds: [audit.id],
    });

    await store.close();
  });

  it("rejects route configuration that references unknown sources", async () => {
    const { store, service } = await createService();
    const source = await service.createSource({
      name: "Grafana prod",
      provider: "grafana",
    });
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = await service.createRoute({
      name: "Known source route",
      rule: {
        sourceIds: [source.source.id],
      },
      destinationIds: [destination.id],
    });

    await expect(
      service.createRoute({
        name: "Broken route",
        rule: {
          sourceIds: ["source-missing"],
        },
        destinationIds: [destination.id],
      }),
    ).rejects.toThrow("Unknown source IDs: source-missing");
    await expect(
      service.updateRoute({
        id: route.id,
        rule: {
          sourceIds: [source.source.id, "source-missing"],
        },
      }),
    ).rejects.toThrow("Unknown source IDs: source-missing");
    expect((await store.routes.get(route.id))?.rule.sourceIds).toEqual([source.source.id]);

    await store.close();
  });

  it("rejects imported routes with unknown destinations before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[routes]]",
      'id = "route-missing-destination"',
      'name = "Broken route"',
      "enabled = true",
      'destination_ids = ["destination-missing"]',
      "",
      "[routes.rule]",
      'severities = ["critical"]',
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow(
      "Unknown destination IDs: destination-missing",
    );
    expect(await store.routes.list()).toEqual([]);
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects imported routes with unknown sources before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[destinations]]",
      'id = "destination-imported"',
      'name = "Imported webhook"',
      'kind = "generic_webhook"',
      "enabled = true",
      "",
      "[destinations.config]",
      'url = "https://example.test/webhook"',
      "",
      "[[routes]]",
      'id = "route-missing-source"',
      'name = "Broken route"',
      "enabled = true",
      'destination_ids = ["destination-imported"]',
      "",
      "[routes.rule]",
      'source_ids = ["source-missing"]',
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow("Unknown source IDs: source-missing");
    expect(await store.destinations.list()).toEqual([]);
    expect(await store.routes.list()).toEqual([]);
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("rejects imported routes with duplicate destinations before changing stored configuration", async () => {
    const { store, service } = await createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "",
      "[[destinations]]",
      'id = "destination-imported"',
      'name = "Imported webhook"',
      'kind = "generic_webhook"',
      "enabled = true",
      "",
      "[destinations.config]",
      'url = "https://example.test/webhook"',
      "",
      "[[routes]]",
      'id = "route-duplicate-destination"',
      'name = "Broken route"',
      "enabled = true",
      'destination_ids = ["destination-imported", "destination-imported"]',
      "",
      "[routes.rule]",
      'severities = ["critical"]',
      "",
    ].join("\n");

    await expect(service.importToml(toml)).rejects.toThrow("Route destination IDs must be unique");
    expect(await store.destinations.list()).toEqual([]);
    expect(await store.routes.list()).toEqual([]);
    expect((await store.settings.get()).rawPayloadRetentionDays).toBe(30);

    await store.close();
  });

  it("creates and updates routes through route schemas", async () => {
    const { store, service } = await createService();
    const source = await service.createSource({
      name: "Grafana prod",
      provider: "grafana",
    });
    const destination = await service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const auditDestination = await service.createDestination({
      name: "Audit email",
      kind: "email",
      config: {
        endpointUrl: "https://mail.example.test/send",
        to: ["audit@example.test"],
        from: "vane@example.test",
      },
    });

    const route = await service.createRoute({
      name: "Critical alerts",
      rule: {
        sourceIds: [source.source.id],
        severities: ["critical"],
        statuses: ["firing"],
        labels: [{ key: "service", operator: "equals", value: "checkout" }],
        titleContains: ["LatencyHigh"],
        messageContains: ["timeout"],
      },
      destinationIds: [destination.id, auditDestination.id],
    });
    const updated = await service.updateRoute({
      id: route.id,
      enabled: false,
      rule: {
        statuses: ["resolved"],
      },
    });

    expect(route.destinationIds).toEqual([destination.id, auditDestination.id]);
    expect(route.rule).toMatchObject({
      sourceIds: [source.source.id],
      severities: ["critical"],
      statuses: ["firing"],
      labels: [{ key: "service", operator: "equals", value: "checkout" }],
      titleContains: ["LatencyHigh"],
      messageContains: ["timeout"],
    });
    expect(route.rule.severities).toEqual(["critical"]);
    expect(updated.enabled).toBe(false);
    expect(updated.rule).toMatchObject({
      statuses: ["resolved"],
    });
    expect((await service.listConfiguration()).routes).toHaveLength(1);

    await store.close();
  });
});
