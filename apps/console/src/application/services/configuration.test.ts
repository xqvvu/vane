import { createDefaultDestinationRegistry } from "@vane/destinations";
import { parse as parseToml } from "smol-toml";
import { describe, expect, it } from "vitest";

import { ConfigurationService } from "#/application/services/configuration.ts";
import { hashSourceToken } from "#/application/services/intake.ts";
import { openSqliteStore } from "#/infra/sqlite/store.ts";

const now = "2026-06-09T08:00:00.000Z";

function createStore() {
  return openSqliteStore({
    databasePath: ":memory:",
    now: () => now,
  });
}

function createService(store = createStore()) {
  return {
    store,
    service: new ConfigurationService({
      store,
      destinations: createDefaultDestinationRegistry(),
      generateSourceToken: () => "vane_src_test_token",
    }),
  };
}

function createServiceWithDestinationFetch(
  fetch: NonNullable<
    ConstructorParameters<typeof ConfigurationService>[0]["destinationSendContext"]
  >["fetch"],
) {
  const store = createStore();

  return {
    store,
    service: new ConfigurationService({
      store,
      destinations: createDefaultDestinationRegistry(),
      generateSourceToken: () => "vane_src_test_token",
      destinationSendContext: {
        fetch,
      },
    }),
  };
}

describe("configuration service", () => {
  it("creates sources with one-time plaintext tokens and persisted token hashes", () => {
    const { store, service } = createService();

    const created = service.createSource({
      name: "Generic source",
      provider: "generic",
      config: {
        team: "sre",
      },
    });
    const stored = store.sources.get(created.source.id);

    expect(created.source).toMatchObject({
      name: "Generic source",
      provider: "generic",
      enabled: true,
    });
    expect(created.token).toBe("vane_src_test_token");
    expect(stored?.tokenHash).toBe(hashSourceToken("vane_src_test_token"));
    expect(stored?.config).toEqual({ team: "sre" });

    store.close();
  });

  it("rotates source tokens without returning the hash", () => {
    const { store, service } = createService();
    const created = service.createSource({
      name: "Generic source",
      provider: "generic",
    });

    const rotated = service.rotateSourceToken({ id: created.source.id });

    expect(rotated.token).toBe("vane_src_test_token");
    expect(store.sources.get(created.source.id)?.tokenHash).toBe(
      hashSourceToken("vane_src_test_token"),
    );

    store.close();
  });

  it("updates source metadata without exposing or changing the token hash", () => {
    const { store, service } = createService();
    const created = service.createSource({
      name: "Generic source",
      provider: "generic",
      config: {
        signingSecret: "old-secret",
        team: "sre",
      },
    });
    const before = store.sources.get(created.source.id);

    const updated = service.updateSource({
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
    expect(store.sources.get(created.source.id)?.tokenHash).toBe(before?.tokenHash);
    expect(store.sources.get(created.source.id)?.config).toEqual({
      signingSecret: "new-secret",
      team: "sre",
    });

    store.close();
  });

  it("validates destination config through the registered destination sender", () => {
    const { store, service } = createService();

    const destination = service.createDestination({
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
    const stored = store.destinations.get(destination.id);

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

    expect(() =>
      service.createDestination({
        name: "Broken webhook",
        kind: "generic_webhook",
        config: {
          url: "not a url",
        },
      }),
    ).toThrow("Invalid URL");
    expect(() =>
      service.createDestination({
        name: "Broken template webhook",
        kind: "generic_webhook",
        config: {
          url: "https://example.test/webhook",
          messageTemplate: "{{event.title.toUpperCase}}",
        },
      }),
    ).toThrow("Message template contains unknown variables");
    expect(() =>
      service.updateDestination({
        id: destination.id,
        config: {
          messageTemplate: "{{process.env.SECRET}}",
        },
      }),
    ).toThrow("Message template contains unknown variables");

    store.close();
  });

  it("validates email destination config through the registered destination sender", () => {
    const { store, service } = createService();

    const destination = service.createDestination({
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
    const stored = store.destinations.get(destination.id);

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

    expect(() =>
      service.createDestination({
        name: "Broken email",
        kind: "email",
        config: {
          endpointUrl: "https://mail-gateway.example.test/send",
          to: ["not-an-email"],
          from: "vane@example.test",
        },
      }),
    ).toThrow("Invalid email address");

    store.close();
  });

  it("lists configuration without source token hashes or destination secrets", () => {
    const { store, service } = createService();
    const source = service.createSource({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    const destination = service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
      secretRefs: {
        webhookUrl: "SLACK_WEBHOOK_URL",
      },
    });

    const snapshot = service.listConfiguration();

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

    store.close();
  });

  it("tests destinations through registered senders without returning rendered payloads", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const { store, service } = createServiceWithDestinationFetch(async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 202,
        text: async () => "accepted token=downstream-token password: downstream-password",
      };
    });
    const destination = service.createDestination({
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

    store.close();
  });

  it("previews destination templates without sending or returning config", async () => {
    const { store, service } = createService();
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
        messageTemplate: "{{event.title}} from {{source.name}}",
      },
    });

    const result = await service.previewDestination({ id: destination.id });

    expect(result.destination).toEqual(destination);
    expect(result.renderedPayload).toMatchObject({
      eventId: "preview-event",
      message: "Vane destination test from Vane preview",
    });
    expect(result).not.toHaveProperty("config");
    expect(JSON.stringify(result)).not.toContain("https://example.test/webhook");

    const emailDestination = service.createDestination({
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

    store.close();
  });

  it("previews draft destination templates before saving config", async () => {
    const { store, service } = createService();

    const result = await service.previewDestinationDraft({
      name: "Unsaved webhook",
      kind: "generic_webhook",
      config: {
        url: "https://relay.example.test/draft-secret",
        messageTemplate: "{{event.title}} from {{source.name}}",
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
    expect(service.listConfiguration().destinations).toEqual([]);
    expect(result).not.toHaveProperty("config");
    expect(JSON.stringify(result)).not.toContain("https://relay.example.test/draft-secret");

    store.close();
  });

  it("updates destination metadata and template patches without clearing server-side secrets", async () => {
    const { store, service } = createService();
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
        method: "PATCH",
        headers: {
          Authorization: "Bearer relay-secret",
          "X-Team": "sre",
        },
        messageTemplate: "{{event.title}}",
      },
    });

    const preview = await service.previewDestinationUpdate({
      id: destination.id,
      name: "Renamed webhook",
      config: {
        headers: {
          "X-Team": "platform",
        },
        messageTemplate: "{{event.title}} from {{destination.name}}",
      },
    });
    const updated = service.updateDestination({
      id: destination.id,
      name: "Renamed webhook",
      config: {
        headers: {
          "X-Team": "platform",
        },
        messageTemplate: "{{event.title}} from {{destination.name}}",
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
    expect(store.destinations.get(destination.id)?.config).toEqual({
      url: "https://example.test/webhook-secret",
      method: "PATCH",
      headers: {
        Authorization: "Bearer relay-secret",
        "X-Team": "platform",
      },
      messageTemplate: "{{event.title}} from {{destination.name}}",
    });

    store.close();
  });

  it("rejects destination kind changes that do not provide compatible config", () => {
    const { store, service } = createService();
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
      },
    });

    expect(() =>
      service.updateDestination({
        id: destination.id,
        kind: "slack",
      }),
    ).toThrow("Invalid input");
    expect(store.destinations.get(destination.id)).toMatchObject({
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook-secret",
        method: "POST",
      },
    });

    store.close();
  });

  it("updates app settings through the configuration service", () => {
    const { store, service } = createService();

    expect(service.listConfiguration().settings.rawPayloadRetentionDays).toBe(30);

    const settings = service.updateAppSettings({
      rawPayloadRetentionDays: 7,
    });

    expect(settings.rawPayloadRetentionDays).toBe(7);
    expect(service.listConfiguration().settings.rawPayloadRetentionDays).toBe(7);

    store.close();
  });

  it("exports portable TOML without plaintext destination secrets by default", () => {
    const { store, service } = createService();
    const source = service.createSource({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    const destination = service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
    });
    service.createRoute({
      name: "Critical route",
      rule: {
        sourceIds: [source.source.id],
        severities: ["critical"],
      },
      destinationIds: [destination.id],
    });

    const toml = service.exportToml({
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

    store.close();
  });

  it("round-trips sources, routes, destinations, and settings through TOML", () => {
    const first = createService();
    const source = first.service.createSource({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    const destination = first.service.createDestination({
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
    first.service.createRoute({
      name: "Critical route",
      rule: {
        sourceIds: [source.source.id],
        severities: ["critical"],
        labels: [{ key: "service", operator: "equals", value: "api" }],
      },
      destinationIds: [destination.id],
    });
    first.service.updateAppSettings({ rawPayloadRetentionDays: 7 });

    const toml = first.service.exportToml({
      now: () => now,
    });
    const second = createService();
    const result = second.service.importToml(toml, {
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
    expect(second.store.settings.get()).toEqual({
      rawPayloadRetentionDays: 7,
    });
    expect(second.store.sources.get(source.source.id)).toMatchObject({
      name: "Grafana prod",
      provider: "grafana",
      config: {
        team: "sre",
      },
    });
    expect(second.store.destinations.get(destination.id)).toMatchObject({
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
    expect(second.store.routes.list()).toEqual([
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

    first.store.close();
    second.store.close();
  });

  it("rejects plaintext destination secret exports", () => {
    const { store, service } = createService();

    service.createDestination({
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/secret",
      },
    });

    expect(() =>
      service.exportToml({
        includeSecrets: true,
        now: () => now,
      }),
    ).toThrow("Plaintext secret export is not supported");

    store.close();
  });

  it("exports nested destination header secrets as environment references", () => {
    const { store, service } = createService();

    service.createDestination({
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

    const toml = service.exportToml({
      now: () => now,
    });

    expect(toml).not.toContain("https://relay.example.test/vane");
    expect(toml).not.toContain("Bearer relay-secret");
    expect(toml).toContain('X-Team = "sre"');
    expect(toml).toContain("headers.Authorization");
    expect(toml).toContain("VANE_DEST_");

    store.close();
  });

  it("exports source config and Feishu signing secrets without plaintext secret values", () => {
    const { store, service } = createService();

    service.createSource({
      name: "Signed upstream",
      provider: "generic",
      config: {
        signingSecret: "source-signing-secret",
        team: "sre",
      },
    });
    service.createDestination({
      name: "Feishu SRE",
      kind: "feishu",
      config: {
        webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/secret",
        signSecret: "feishu-signing-secret",
      },
    });

    const toml = service.exportToml({
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

    store.close();
  });

  it("imports portable TOML and resolves destination secret references from env", () => {
    const { store, service } = createService();
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

    const result = service.importToml(toml, {
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
    expect(store.sources.get("source-imported")).toMatchObject({
      name: "Imported source",
      provider: "generic",
      tokenHash: hashSourceToken("vane_src_test_token"),
    });
    expect(store.destinations.get("destination-imported")).toMatchObject({
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
    expect(store.routes.get("route-imported")).toMatchObject({
      name: "Imported critical route",
      destinationIds: ["destination-imported"],
      rule: {
        sourceIds: ["source-imported"],
        severities: ["critical"],
      },
    });
    expect(store.settings.get().rawPayloadRetentionDays).toBe(14);

    store.close();
  });

  it("imports portable TOML and resolves source secret references from env", () => {
    const { store, service } = createService();
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

    service.importToml(toml, {
      env: {
        SOURCE_SIGNING_SECRET: "provider-shared-secret",
      },
    });

    expect(store.sources.get("source-signed")).toMatchObject({
      name: "Signed source",
      provider: "generic",
      config: {
        team: "sre",
        signingSecret: "provider-shared-secret",
      },
    });

    store.close();
  });

  it("imports nested destination header secret references from env", () => {
    const { store, service } = createService();
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

    service.importToml(toml, {
      env: {
        RELAY_URL: "https://relay.example.test/vane",
        RELAY_AUTH: "Bearer relay-secret",
      },
    });

    expect(store.destinations.get("destination-relay")).toMatchObject({
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

    store.close();
  });

  it("rejects imported destination configs that fail adapter validation before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml)).toThrow("Invalid URL");
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);
    expect(store.sources.list()).toEqual([]);
    expect(store.destinations.list()).toEqual([]);

    store.close();
  });

  it("rejects imported routes without destinations before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml)).toThrow("Too small");
    expect(store.routes.list()).toEqual([]);
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects portable TOML that claims to include plaintext secrets", () => {
    const { store, service } = createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      'exported_at = "2026-06-09T08:00:00.000Z"',
      "include_secrets = true",
      "raw_payload_retention_days = 14",
      "",
    ].join("\n");

    expect(() => service.importToml(toml)).toThrow("Invalid input");
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects invalid TOML before changing stored configuration", () => {
    const { store, service } = createService();

    expect(() => service.importToml("[settings")).toThrow("Invalid TOML document");
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);
    expect(store.sources.list()).toEqual([]);

    store.close();
  });

  it("rejects unknown TOML keys before changing stored configuration", () => {
    const { store, service } = createService();
    const toml = [
      "[settings]",
      'schema_version = "vane.config.v1"',
      "include_secrets = false",
      "raw_payload_retention_days = 14",
      "unexpected = true",
      "",
    ].join("\n");

    expect(() => service.importToml(toml)).toThrow("Unrecognized key");
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects unknown providers and destination kinds before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(unknownProviderToml)).toThrow("Invalid option");
    expect(() => service.importToml(unknownDestinationToml)).toThrow("Invalid option");
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);
    expect(store.sources.list()).toEqual([]);
    expect(store.destinations.list()).toEqual([]);

    store.close();
  });

  it("rejects missing environment variables for secret references before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml, { env: {} })).toThrow(
      "Missing environment variable for destination secret: SLACK_WEBHOOK_URL",
    );
    expect(store.destinations.list()).toEqual([]);
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects missing source secret environment variables before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml, { env: {} })).toThrow(
      "Missing environment variable for source secret: SOURCE_SIGNING_SECRET",
    );
    expect(store.sources.list()).toEqual([]);
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects route configuration that references unknown destinations", () => {
    const { store, service } = createService();
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = service.createRoute({
      name: "Known destination route",
      destinationIds: [destination.id],
    });

    expect(() =>
      service.createRoute({
        name: "Broken route",
        destinationIds: ["destination-missing"],
      }),
    ).toThrow("Unknown destination IDs: destination-missing");
    expect(() =>
      service.updateRoute({
        id: route.id,
        destinationIds: [destination.id, "destination-missing"],
      }),
    ).toThrow("Unknown destination IDs: destination-missing");
    expect(store.routes.get(route.id)?.destinationIds).toEqual([destination.id]);

    store.close();
  });

  it("rejects route configuration with duplicate destinations", () => {
    const { store, service } = createService();
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });

    expect(() =>
      service.createRoute({
        name: "Duplicate destination route",
        destinationIds: [destination.id, destination.id],
      }),
    ).toThrow("Route destination IDs must be unique");
    expect(store.routes.list()).toEqual([]);

    store.close();
  });

  it("rejects route configuration that references unknown sources", () => {
    const { store, service } = createService();
    const source = service.createSource({
      name: "Grafana prod",
      provider: "grafana",
    });
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = service.createRoute({
      name: "Known source route",
      rule: {
        sourceIds: [source.source.id],
      },
      destinationIds: [destination.id],
    });

    expect(() =>
      service.createRoute({
        name: "Broken route",
        rule: {
          sourceIds: ["source-missing"],
        },
        destinationIds: [destination.id],
      }),
    ).toThrow("Unknown source IDs: source-missing");
    expect(() =>
      service.updateRoute({
        id: route.id,
        rule: {
          sourceIds: [source.source.id, "source-missing"],
        },
      }),
    ).toThrow("Unknown source IDs: source-missing");
    expect(store.routes.get(route.id)?.rule.sourceIds).toEqual([source.source.id]);

    store.close();
  });

  it("rejects imported routes with unknown destinations before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml)).toThrow("Unknown destination IDs: destination-missing");
    expect(store.routes.list()).toEqual([]);
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects imported routes with unknown sources before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml)).toThrow("Unknown source IDs: source-missing");
    expect(store.destinations.list()).toEqual([]);
    expect(store.routes.list()).toEqual([]);
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("rejects imported routes with duplicate destinations before changing stored configuration", () => {
    const { store, service } = createService();
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

    expect(() => service.importToml(toml)).toThrow("Route destination IDs must be unique");
    expect(store.destinations.list()).toEqual([]);
    expect(store.routes.list()).toEqual([]);
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    store.close();
  });

  it("creates and updates routes through route schemas", () => {
    const { store, service } = createService();
    const source = service.createSource({
      name: "Grafana prod",
      provider: "grafana",
    });
    const destination = service.createDestination({
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const auditDestination = service.createDestination({
      name: "Audit email",
      kind: "email",
      config: {
        endpointUrl: "https://mail.example.test/send",
        to: ["audit@example.test"],
        from: "vane@example.test",
      },
    });

    const route = service.createRoute({
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
    const updated = service.updateRoute({
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
    expect(service.listConfiguration().routes).toHaveLength(1);

    store.close();
  });
});
