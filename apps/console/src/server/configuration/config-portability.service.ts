import "@tanstack/react-start/server-only";
import {
  ExportConfigurationCommandSchema,
  ImportConfigurationCommandSchema,
  type ExportConfigurationCommand,
  type ImportConfigurationCommand,
} from "@vane/core";
import type { ProviderCatalogItem } from "@vane/providers";

import type {
  ConfigPortabilityServiceOptions,
  ConfigurationSnapshot,
} from "#/server/configuration/config-portability.service.types.ts";
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

export class ConfigPortabilityService {
  private readonly store: ConfigPortabilityServiceOptions["store"];
  private readonly providers: ConfigPortabilityServiceOptions["providers"];
  private readonly destinations: ConfigPortabilityServiceOptions["destinations"];
  private readonly generateSourceToken: () => string;

  constructor(options: ConfigPortabilityServiceOptions) {
    this.store = options.store;
    this.providers = options.providers;
    this.destinations = options.destinations;
    this.generateSourceToken = options.generateSourceToken ?? defaultGenerateSourceToken;
  }

  async listConfiguration(): Promise<ConfigurationSnapshot> {
    return {
      settings: await this.store.settings.get(),
      sources: await this.store.sources.list(),
      destinations: await this.store.destinations.list(),
      routes: await this.store.routes.list(),
    };
  }

  listProviderCatalog(): ProviderCatalogItem[] {
    return this.providers?.toCatalog() ?? [];
  }

  async exportToml(options: ExportConfigurationOptions = {}): Promise<string> {
    const sourceSummaries = await this.store.sources.list();
    const sources = (
      await Promise.all(sourceSummaries.map((source) => this.store.sources.get(source.id)))
    ).filter((source): source is NonNullable<typeof source> => source !== null);
    const destinationSummaries = await this.store.destinations.list();
    const destinations = (
      await Promise.all(
        destinationSummaries.map((destination) => this.store.destinations.get(destination.id)),
      )
    ).filter((destination): destination is NonNullable<typeof destination> => destination !== null);
    const routes = await this.store.routes.list();

    return serializePortableConfigurationToml(
      createPortableConfiguration(
        {
          sources,
          destinations,
          routes,
          settings: await this.store.settings.get(),
        },
        options,
      ),
    );
  }

  async exportTomlFromCommand(command: ExportConfigurationCommand = {}): Promise<string> {
    const input = ExportConfigurationCommandSchema.parse(command) ?? {};

    return this.exportToml({
      includeSecrets: input.includeSecrets ?? false,
    });
  }

  async importTomlFromCommand(
    command: ImportConfigurationCommand,
  ): Promise<ImportedConfigurationResult> {
    const input = ImportConfigurationCommandSchema.parse(command);

    return this.importToml(input.toml, {
      env: process.env,
    });
  }

  async importToml(
    toml: string,
    options: ImportConfigurationOptions = {},
  ): Promise<ImportedConfigurationResult> {
    const portable = parsePortableConfigurationToml(toml);
    const generatedSourceTokens: ImportedConfigurationResult["generatedSourceTokens"] = [];

    await this.store.transaction(async (tx) => {
      await tx.settings.update({
        rawPayloadRetentionDays: portable.settings.rawPayloadRetentionDays,
      });

      for (const source of portable.sources.map((entry) =>
        resolveSourceSecretRefs(entry, options),
      )) {
        const existing = await tx.sources.get(source.id);

        if (existing) {
          await tx.sources.update(source.id, {
            name: source.name,
            provider: source.provider,
            enabled: source.enabled,
            config: source.config,
          });
          continue;
        }

        const token = this.generateSourceToken();
        await tx.sources.create({
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
        const existing = await tx.destinations.get(destination.id);
        const config = parseDestinationConfig(
          this.destinations,
          destination.kind,
          destination.config,
        );

        if (existing) {
          await tx.destinations.update(destination.id, {
            name: destination.name,
            kind: destination.kind,
            enabled: destination.enabled,
            config,
            secretRefs: destination.secretRefs,
          });
          continue;
        }

        await tx.destinations.create({
          id: destination.id,
          name: destination.name,
          kind: destination.kind,
          enabled: destination.enabled,
          config,
          secretRefs: destination.secretRefs,
        });
      }

      for (const route of portable.routes) {
        const existing = await tx.routes.get(route.id);

        await requireExistingSourceIds(route.rule.sourceIds, tx.sources);
        await requireExistingDestinationIds(route.destinationIds, tx.destinations);

        if (existing) {
          await tx.routes.update(route.id, {
            name: route.name,
            enabled: route.enabled,
            rule: route.rule,
            destinationIds: route.destinationIds,
          });
          continue;
        }

        await tx.routes.create({
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
