import { describe, expect, it } from "vitest";

import {
  VaneTomlDocumentSchema,
  vaneConfigurationToTomlDocument,
  vaneTomlDocumentToConfiguration,
  type VaneConfiguration,
} from "#/config.ts";

const portableConfig: VaneConfiguration = {
  settings: {
    schemaVersion: "vane.config.v1",
    exportedAt: "2026-06-09T08:00:00.000Z",
    includeSecrets: false,
    rawPayloadRetentionDays: 14,
  },
  sources: [
    {
      id: "source-grafana",
      name: "Grafana prod",
      provider: "grafana",
      enabled: true,
      config: {
        team: "sre",
      },
      secretRefs: {},
    },
  ],
  destinations: [
    {
      id: "destination-slack",
      name: "Slack SRE",
      kind: "slack",
      enabled: true,
      config: {},
      secretRefs: {
        webhookUrl: {
          env: "SLACK_WEBHOOK_URL",
        },
      },
    },
  ],
  routes: [
    {
      id: "route-critical",
      name: "Critical alerts",
      enabled: true,
      rule: {
        sourceIds: ["source-grafana"],
        severities: ["critical"],
        statuses: ["firing"],
        labels: [{ key: "service", operator: "equals", value: "api" }],
        titleContains: ["Latency"],
        messageContains: ["timeout"],
      },
      destinationIds: ["destination-slack"],
    },
  ],
};

describe("Vane portable configuration", () => {
  it("maps portable config to TOML document keys and back", () => {
    const document = vaneConfigurationToTomlDocument(portableConfig);

    expect(document).toMatchObject({
      settings: {
        schema_version: "vane.config.v1",
        include_secrets: false,
        raw_payload_retention_days: 14,
      },
      routes: [
        {
          destination_ids: ["destination-slack"],
          rule: {
            source_ids: ["source-grafana"],
            title_contains: ["Latency"],
            message_contains: ["timeout"],
          },
        },
      ],
    });
    expect(vaneTomlDocumentToConfiguration(document)).toEqual(portableConfig);
  });

  it("rejects unknown TOML document keys", () => {
    expect(() =>
      vaneTomlDocumentToConfiguration({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
          unknown: true,
        },
      }),
    ).toThrow("Unrecognized key");
  });

  it("rejects unknown provider, destination kind, route rule, and invalid secret refs", () => {
    expect(() =>
      VaneTomlDocumentSchema.parse({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
        },
        sources: [
          {
            id: "source-unknown",
            name: "Unknown",
            provider: "pagerduty",
            enabled: true,
          },
        ],
      }),
    ).toThrow("Invalid option");

    expect(() =>
      VaneTomlDocumentSchema.parse({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
        },
        destinations: [
          {
            id: "destination-unknown",
            name: "Unknown",
            kind: "sms",
            enabled: true,
          },
        ],
      }),
    ).toThrow("Invalid option");

    expect(() =>
      VaneTomlDocumentSchema.parse({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
        },
        routes: [
          {
            id: "route-unknown-rule",
            name: "Unknown route rule",
            enabled: true,
            destination_ids: ["destination-slack"],
            rule: {
              fingerprint_equals: ["alert-1"],
            },
          },
        ],
      }),
    ).toThrow("Unrecognized key");

    expect(() =>
      VaneTomlDocumentSchema.parse({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
        },
        destinations: [
          {
            id: "destination-invalid-ref",
            name: "Invalid ref",
            kind: "slack",
            enabled: true,
            secret_refs: {
              webhookUrl: {
                env: "not valid",
              },
            },
          },
        ],
      }),
    ).toThrow("Secret environment references must be valid env names");

    expect(() =>
      VaneTomlDocumentSchema.parse({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
        },
        destinations: [
          {
            id: "destination-unsafe-ref",
            name: "Unsafe ref",
            kind: "slack",
            enabled: true,
            secret_refs: {
              "__proto__.polluted": {
                env: "SLACK_WEBHOOK_URL",
              },
            },
          },
        ],
      }),
    ).toThrow("Secret reference paths must not use prototype-polluting keys");

    expect(() =>
      VaneTomlDocumentSchema.parse({
        settings: {
          schema_version: "vane.config.v1",
          include_secrets: false,
          raw_payload_retention_days: 14,
        },
        sources: [
          {
            id: "source-unsafe-ref",
            name: "Unsafe source ref",
            provider: "generic",
            enabled: true,
            secret_refs: {
              "__proto__.polluted": {
                env: "SOURCE_SECRET",
              },
            },
          },
        ],
      }),
    ).toThrow("Secret reference paths must not use prototype-polluting keys");
  });
});
