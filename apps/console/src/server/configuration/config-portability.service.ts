import "@tanstack/react-start/server-only";
import {
  ExportConfigurationCommandSchema,
  ImportConfigurationCommandSchema,
  type DestinationSummary,
  type ExportConfigurationCommand,
  type ImportConfigurationCommand,
  type RouteDefinition,
  type SourceSummary,
} from "@vane/core";
import type { DestinationRegistry } from "@vane/destinations";
import type { ProviderCatalogItem, ProviderRegistry } from "@vane/providers";

import type { SqliteStore } from "#/infra/sqlite/store.ts";
import {
  createPortableConfiguration,
  parsePortableConfigurationToml,
  resolveDestinationSecretRefs,
  resolveSourceSecretRefs,
  serializePortableConfigurationToml,
  type ExportConfigurationOptions,
  type ImportedConfigurationResult,
  type ImportConfigurationOptions,
} from "#/server/configuration/config-portability.ts";
import {
  generateSourceToken as defaultGenerateSourceToken,
  parseDestinationConfig,
  requireExistingDestinationIds,
  requireExistingSourceIds,
} from "#/server/configuration/configuration-support.ts";
import { hashSourceToken } from "#/server/intake/intake.service.ts";

export interface ConfigPortabilityServiceOptions {
  store: SqliteStore;
  providers?: ProviderRegistry;
  destinations: DestinationRegistry;
  generateSourceToken?: () => string;
}

export interface ConfigurationSnapshot {
  settings: {
    rawPayloadRetentionDays: number;
  };
  sources: SourceSummary[];
  destinations: DestinationSummary[];
  routes: RouteDefinition[];
}

export class ConfigPortabilityService {
  private readonly store: SqliteStore;
  private readonly providers?: ProviderRegistry;
  private readonly destinations: DestinationRegistry;
  private readonly generateSourceToken: () => string;

  constructor(options: ConfigPortabilityServiceOptions) {
    this.store = options.store;
    this.providers = options.providers;
    this.destinations = options.destinations;
    this.generateSourceToken = options.generateSourceToken ?? defaultGenerateSourceToken;
  }

  listConfiguration(): ConfigurationSnapshot {
    return {
      settings: this.store.settings.get(),
      sources: this.store.sources.list(),
      destinations: this.store.destinations.list(),
      routes: this.store.routes.list(),
    };
  }

  listProviderCatalog(): ProviderCatalogItem[] {
    return this.providers?.toCatalog() ?? [];
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
        const config = parseDestinationConfig(
          this.destinations,
          destination.kind,
          destination.config,
        );

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

        requireExistingSourceIds(route.rule.sourceIds, tx.sources);
        requireExistingDestinationIds(route.destinationIds, tx.destinations);

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
}
