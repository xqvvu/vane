import "@tanstack/react-start/server-only";
import { randomBytes } from "node:crypto";

import {
  DestinationKindSchema,
  JsonObjectSchema,
  RouteDefinitionSchema,
  SourceProviderSchema,
  redactText,
} from "@vane/core";
import type {
  DestinationKind,
  DestinationSummary,
  JsonObject,
  JsonValue,
  NormalizedEvent,
  RouteDefinition,
  SourceSummary,
} from "@vane/core";
import type { DestinationRegistry, DestinationSendContext } from "@vane/destinations";
import { z } from "zod";

import {
  createPortableConfiguration,
  parsePortableConfigurationToml,
  resolveDestinationSecretRefs,
  resolveSourceSecretRefs,
  serializePortableConfigurationToml,
  type ExportConfigurationOptions,
  type ImportedConfigurationResult,
  type ImportConfigurationOptions,
} from "#/application/portability/config-portability.ts";
import { hashSourceToken } from "#/application/services/intake.ts";
import type { SqliteStore } from "#/infra/sqlite/store.ts";

export const CreateSourceCommandSchema = z.object({
  name: z.string().trim().min(1),
  provider: SourceProviderSchema,
  enabled: z.boolean().default(true),
  config: JsonObjectSchema.default({}),
});

export const UpdateSourceCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  provider: SourceProviderSchema.optional(),
  enabled: z.boolean().optional(),
  config: JsonObjectSchema.optional(),
});

export const RotateSourceTokenCommandSchema = z.object({
  id: z.string().min(1),
});

export const CreateDestinationCommandSchema = z.object({
  name: z.string().trim().min(1),
  kind: DestinationKindSchema,
  enabled: z.boolean().default(true),
  config: JsonObjectSchema.default({}),
  secretRefs: JsonObjectSchema.default({}),
});

export const UpdateDestinationCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  kind: DestinationKindSchema.optional(),
  enabled: z.boolean().optional(),
  config: JsonObjectSchema.optional(),
  secretRefs: JsonObjectSchema.optional(),
});

export const TestDestinationCommandSchema = z.object({
  id: z.string().min(1),
});

export const PreviewDestinationCommandSchema = z.object({
  id: z.string().min(1),
});

export const PreviewDestinationDraftCommandSchema = z.object({
  name: z.string().trim().min(1),
  kind: DestinationKindSchema,
  config: JsonObjectSchema.default({}),
});

export const PreviewDestinationUpdateCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  config: JsonObjectSchema.default({}),
});

export const ExportConfigurationCommandSchema = z
  .object({
    includeSecrets: z.literal(false).optional(),
  })
  .default({});

export const ImportConfigurationCommandSchema = z.object({
  toml: z.string().min(1),
});

export const UpdateAppSettingsCommandSchema = z.object({
  rawPayloadRetentionDays: z.number().int().min(0).max(3650),
});

export const CreateRouteCommandSchema = z.object({
  name: z.string().trim().min(1),
  enabled: z.boolean().default(true),
  rule: RouteDefinitionSchema.shape.rule.optional(),
  destinationIds: RouteDefinitionSchema.shape.destinationIds,
});

export const UpdateRouteCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  enabled: z.boolean().optional(),
  rule: RouteDefinitionSchema.shape.rule.optional(),
  destinationIds: RouteDefinitionSchema.shape.destinationIds.optional(),
});

export type CreateSourceCommand = z.input<typeof CreateSourceCommandSchema>;
export type UpdateSourceCommand = z.input<typeof UpdateSourceCommandSchema>;
export type RotateSourceTokenCommand = z.input<typeof RotateSourceTokenCommandSchema>;
export type CreateDestinationCommand = z.input<typeof CreateDestinationCommandSchema>;
export type UpdateDestinationCommand = z.input<typeof UpdateDestinationCommandSchema>;
export type TestDestinationCommand = z.input<typeof TestDestinationCommandSchema>;
export type PreviewDestinationCommand = z.input<typeof PreviewDestinationCommandSchema>;
export type PreviewDestinationDraftCommand = z.input<typeof PreviewDestinationDraftCommandSchema>;
export type PreviewDestinationUpdateCommand = z.input<typeof PreviewDestinationUpdateCommandSchema>;
export type ExportConfigurationCommand = z.input<typeof ExportConfigurationCommandSchema>;
export type ImportConfigurationCommand = z.input<typeof ImportConfigurationCommandSchema>;
export type UpdateAppSettingsCommand = z.input<typeof UpdateAppSettingsCommandSchema>;
export type CreateRouteCommand = z.input<typeof CreateRouteCommandSchema>;
export type UpdateRouteCommand = z.input<typeof UpdateRouteCommandSchema>;

export interface ConfigurationServiceOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  generateSourceToken?: () => string;
  destinationSendContext?: DestinationSendContext;
}

export interface CreatedSource {
  source: SourceSummary;
  token: string;
}

export interface RotatedSourceToken {
  source: SourceSummary;
  token: string;
}

export interface ConfigurationSnapshot {
  settings: {
    rawPayloadRetentionDays: number;
  };
  sources: SourceSummary[];
  destinations: DestinationSummary[];
  routes: RouteDefinition[];
}

export interface DestinationTestResult {
  destination: DestinationSummary;
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
}

export interface DestinationPreviewResult {
  destination: DestinationSummary;
  renderedPayload: JsonValue;
}

export class ConfigurationService {
  private readonly store: SqliteStore;
  private readonly destinations: DestinationRegistry;
  private readonly generateSourceToken: () => string;
  private readonly destinationSendContext?: DestinationSendContext;

  constructor(options: ConfigurationServiceOptions) {
    this.store = options.store;
    this.destinations = options.destinations;
    this.generateSourceToken = options.generateSourceToken ?? generateSourceToken;
    this.destinationSendContext = options.destinationSendContext;
  }

  listConfiguration(): ConfigurationSnapshot {
    return {
      settings: this.store.settings.get(),
      sources: this.store.sources.list(),
      destinations: this.store.destinations.list(),
      routes: this.store.routes.list(),
    };
  }

  createSource(command: CreateSourceCommand): CreatedSource {
    const input = CreateSourceCommandSchema.parse(command);
    const token = this.generateSourceToken();
    const source = this.store.sources.create({
      name: input.name,
      provider: input.provider,
      enabled: input.enabled,
      config: input.config,
      tokenHash: hashSourceToken(token),
    });

    return { source, token };
  }

  updateSource(command: UpdateSourceCommand): SourceSummary {
    const input = UpdateSourceCommandSchema.parse(command);
    const current = this.store.sources.get(input.id);
    const config =
      current && input.config ? mergeJsonObjects(current.config, input.config) : input.config;

    return this.store.sources.update(input.id, {
      name: input.name,
      provider: input.provider,
      enabled: input.enabled,
      config,
    });
  }

  rotateSourceToken(command: RotateSourceTokenCommand): RotatedSourceToken {
    const input = RotateSourceTokenCommandSchema.parse(command);
    const token = this.generateSourceToken();
    const source = this.store.sources.update(input.id, {
      tokenHash: hashSourceToken(token),
    });

    return { source, token };
  }

  createDestination(command: CreateDestinationCommand): DestinationSummary {
    const input = CreateDestinationCommandSchema.parse(command);

    return this.store.destinations.create({
      name: input.name,
      kind: input.kind,
      enabled: input.enabled,
      config: this.parseDestinationConfig(input.kind, input.config),
      secretRefs: input.secretRefs,
    });
  }

  updateDestination(command: UpdateDestinationCommand): DestinationSummary {
    const input = UpdateDestinationCommandSchema.parse(command);
    const current = this.store.destinations.get(input.id);
    const kind = input.kind ?? current?.kind;
    const config =
      current && (input.config !== undefined || input.kind !== undefined)
        ? mergeJsonObjects(current.config, input.config ?? {})
        : input.config;

    return this.store.destinations.update(input.id, {
      name: input.name,
      kind: input.kind,
      enabled: input.enabled,
      config: config && kind ? this.parseDestinationConfig(kind, config) : config,
      secretRefs: input.secretRefs,
    });
  }

  async testDestination(command: TestDestinationCommand): Promise<DestinationTestResult> {
    const input = TestDestinationCommandSchema.parse(command);
    const destination = this.store.destinations.get(input.id);

    if (!destination) {
      throw new Error(`Destination not found: ${input.id}`);
    }

    const source: SourceSummary = {
      id: "test-source",
      name: "Vane test",
      provider: "generic",
      enabled: true,
    };
    const summary: DestinationSummary = {
      id: destination.id,
      name: destination.name,
      kind: destination.kind,
      enabled: destination.enabled,
    };
    const normalizedEvent = createTestNormalizedEvent();
    const result = await this.destinations.send(
      destination.kind,
      {
        eventId: `test-${Date.now()}`,
        source,
        destination: summary,
        normalizedEvent,
        config: destination.config,
      },
      this.destinationSendContext,
    );

    return {
      destination: summary,
      success: result.success,
      statusCode: result.statusCode,
      responseBody: redactNullableText(result.responseBody),
      error: redactNullableText(result.error),
    };
  }

  async previewDestination(command: PreviewDestinationCommand): Promise<DestinationPreviewResult> {
    const input = PreviewDestinationCommandSchema.parse(command);
    const destination = this.store.destinations.get(input.id);

    if (!destination) {
      throw new Error(`Destination not found: ${input.id}`);
    }

    const summary: DestinationSummary = {
      id: destination.id,
      name: destination.name,
      kind: destination.kind,
      enabled: destination.enabled,
    };

    return this.previewDestinationConfig(summary, destination.config);
  }

  async previewDestinationDraft(
    command: PreviewDestinationDraftCommand,
  ): Promise<DestinationPreviewResult> {
    const input = PreviewDestinationDraftCommandSchema.parse(command);
    const config = this.parseDestinationConfig(input.kind, input.config);
    const destination: DestinationSummary = {
      id: "preview-destination",
      name: input.name,
      kind: input.kind,
      enabled: true,
    };

    return this.previewDestinationConfig(destination, config);
  }

  async previewDestinationUpdate(
    command: PreviewDestinationUpdateCommand,
  ): Promise<DestinationPreviewResult> {
    const input = PreviewDestinationUpdateCommandSchema.parse(command);
    const current = this.store.destinations.get(input.id);

    if (!current) {
      throw new Error(`Destination not found: ${input.id}`);
    }

    const config = this.parseDestinationConfig(
      current.kind,
      mergeJsonObjects(current.config, input.config),
    );
    const destination: DestinationSummary = {
      id: current.id,
      name: input.name ?? current.name,
      kind: current.kind,
      enabled: current.enabled,
    };

    return this.previewDestinationConfig(destination, config);
  }

  createRoute(command: CreateRouteCommand): RouteDefinition {
    const input = CreateRouteCommandSchema.parse(command);

    this.requireExistingSourceIds(input.rule?.sourceIds ?? []);
    this.requireExistingDestinationIds(input.destinationIds);

    return this.store.routes.create({
      name: input.name,
      enabled: input.enabled,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
  }

  updateRoute(command: UpdateRouteCommand): RouteDefinition {
    const input = UpdateRouteCommandSchema.parse(command);

    if (input.rule) {
      this.requireExistingSourceIds(input.rule.sourceIds);
    }

    if (input.destinationIds) {
      this.requireExistingDestinationIds(input.destinationIds);
    }

    return this.store.routes.update(input.id, {
      name: input.name,
      enabled: input.enabled,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
  }

  updateAppSettings(command: UpdateAppSettingsCommand): ConfigurationSnapshot["settings"] {
    const input = UpdateAppSettingsCommandSchema.parse(command);

    return this.store.settings.update({
      rawPayloadRetentionDays: input.rawPayloadRetentionDays,
    });
  }

  exportToml(options: ExportConfigurationOptions = {}): string {
    const sources = this.store.sources
      .list()
      .map((source) => this.store.sources.get(source.id))
      .filter((source): source is NonNullable<typeof source> => source !== null);
    const destinations = this.store.destinations
      .list()
      .map((destination) => this.store.destinations.get(destination.id))
      .filter(
        (destination): destination is NonNullable<typeof destination> => destination !== null,
      );
    const routes = this.store.routes.list();

    return serializePortableConfigurationToml(
      createPortableConfiguration(
        {
          sources,
          destinations,
          routes,
          settings: this.store.settings.get(),
        },
        options,
      ),
    );
  }

  exportTomlFromCommand(command: ExportConfigurationCommand = {}): string {
    const input = ExportConfigurationCommandSchema.parse(command) ?? {};

    return this.exportToml({
      includeSecrets: input.includeSecrets ?? false,
    });
  }

  importTomlFromCommand(command: ImportConfigurationCommand): ImportedConfigurationResult {
    const input = ImportConfigurationCommandSchema.parse(command);

    return this.importToml(input.toml, {
      env: process.env,
    });
  }

  importToml(toml: string, options: ImportConfigurationOptions = {}): ImportedConfigurationResult {
    const portable = parsePortableConfigurationToml(toml);
    const generatedSourceTokens: ImportedConfigurationResult["generatedSourceTokens"] = [];

    this.store.transaction((tx) => {
      tx.settings.update({
        rawPayloadRetentionDays: portable.settings.rawPayloadRetentionDays,
      });

      for (const source of portable.sources.map((entry) =>
        resolveSourceSecretRefs(entry, options),
      )) {
        const existing = tx.sources.get(source.id);

        if (existing) {
          tx.sources.update(source.id, {
            name: source.name,
            provider: source.provider,
            enabled: source.enabled,
            config: source.config,
          });
          continue;
        }

        const token = this.generateSourceToken();
        tx.sources.create({
          id: source.id,
          name: source.name,
          provider: source.provider,
          enabled: source.enabled,
          config: source.config,
          tokenHash: hashSourceToken(token),
        });
        generatedSourceTokens.push({
          sourceId: source.id,
          sourceName: source.name,
          token,
        });
      }

      for (const destination of portable.destinations.map((entry) =>
        resolveDestinationSecretRefs(entry, options),
      )) {
        const existing = tx.destinations.get(destination.id);
        const config = this.parseDestinationConfig(destination.kind, destination.config);

        if (existing) {
          tx.destinations.update(destination.id, {
            name: destination.name,
            kind: destination.kind,
            enabled: destination.enabled,
            config,
            secretRefs: destination.secretRefs,
          });
          continue;
        }

        tx.destinations.create({
          id: destination.id,
          name: destination.name,
          kind: destination.kind,
          enabled: destination.enabled,
          config,
          secretRefs: destination.secretRefs,
        });
      }

      for (const route of portable.routes) {
        const existing = tx.routes.get(route.id);

        this.requireExistingSourceIds(route.rule.sourceIds, tx.sources);
        this.requireExistingDestinationIds(route.destinationIds, tx.destinations);

        if (existing) {
          tx.routes.update(route.id, {
            name: route.name,
            enabled: route.enabled,
            rule: route.rule,
            destinationIds: route.destinationIds,
          });
          continue;
        }

        tx.routes.create({
          id: route.id,
          name: route.name,
          enabled: route.enabled,
          rule: route.rule,
          destinationIds: route.destinationIds,
        });
      }
    });

    return { generatedSourceTokens };
  }

  private parseDestinationConfig(kind: DestinationKind, config: JsonObject): JsonObject {
    return JsonObjectSchema.parse(this.destinations.get(kind).configSchema.parse(config));
  }

  private requireExistingSourceIds(
    sourceIds: string[],
    sources: Pick<SqliteStore["sources"], "get"> = this.store.sources,
  ): void {
    const missing = [...new Set(sourceIds)].filter((id) => sources.get(id) === null);

    if (missing.length > 0) {
      throw new Error(`Unknown source IDs: ${missing.join(", ")}`);
    }
  }

  private requireExistingDestinationIds(
    destinationIds: string[],
    destinations: Pick<SqliteStore["destinations"], "get"> = this.store.destinations,
  ): void {
    const missing = [...new Set(destinationIds)].filter((id) => destinations.get(id) === null);

    if (missing.length > 0) {
      throw new Error(`Unknown destination IDs: ${missing.join(", ")}`);
    }
  }

  private async previewDestinationConfig(
    destination: DestinationSummary,
    config: JsonObject,
  ): Promise<DestinationPreviewResult> {
    const source: SourceSummary = {
      id: "preview-source",
      name: "Vane preview",
      provider: "generic",
      enabled: true,
    };

    return {
      destination,
      renderedPayload: await this.destinations.preview(destination.kind, {
        eventId: "preview-event",
        source,
        destination,
        normalizedEvent: createTestNormalizedEvent(),
        config,
      }),
    };
  }
}

export function generateSourceToken(): string {
  return `vane_src_${randomBytes(24).toString("base64url")}`;
}

function createTestNormalizedEvent(): NormalizedEvent {
  return {
    title: "Vane destination test",
    message: "This is a test alert generated from Vane Console.",
    severity: "info",
    status: "firing",
    fingerprint: "vane:test-destination",
    labels: {
      source: "vane",
      test: "true",
    },
    occurredAt: new Date().toISOString(),
  };
}

function redactNullableText(value: string | null): string | null {
  return value === null ? null : redactText(value);
}

function mergeJsonObjects(base: JsonObject, patch: JsonObject): JsonObject {
  const output: JsonObject = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    const existing = output[key];

    output[key] =
      isPlainJsonObject(existing) && isPlainJsonObject(value)
        ? mergeJsonObjects(existing, value)
        : value;
  }

  return output;
}

function isPlainJsonObject(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
