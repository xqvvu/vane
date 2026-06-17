import {
  CreateDestinationCommandSchema,
  PreviewDestinationDraftCommandSchema,
  PreviewDestinationCommandSchema,
  PreviewDestinationUpdateCommandSchema,
  TestDestinationCommandSchema,
  UpdateDestinationCommandSchema,
  type CreateDestinationCommand,
  type DestinationSummary,
  type JsonObject,
  type JsonValue,
  type PreviewDestinationDraftCommand,
  type PreviewDestinationCommand,
  type PreviewDestinationUpdateCommand,
  type SourceSummary,
  type TestDestinationCommand,
  type UpdateDestinationCommand,
} from "@vane/core";
import type {
  DestinationCatalogItem,
  DestinationRegistry,
  DestinationSendContext,
} from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store.ts";
import {
  createTestNormalizedEvent,
  mergeJsonObjects,
  parseDestinationConfig,
  redactNullableText,
} from "#/server/configuration/configuration-support.ts";

export interface DestinationServiceOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  destinationSendContext?: DestinationSendContext;
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

export class DestinationService {
  private readonly store: SqliteStore;
  private readonly destinations: DestinationRegistry;
  private readonly destinationSendContext?: DestinationSendContext;

  constructor(options: DestinationServiceOptions) {
    this.store = options.store;
    this.destinations = options.destinations;
    this.destinationSendContext = options.destinationSendContext;
  }

  listDestinationCatalog(): DestinationCatalogItem[] {
    return this.destinations.toCatalog();
  }

  createDestination(command: CreateDestinationCommand): DestinationSummary {
    const input = CreateDestinationCommandSchema.parse(command);

    return this.store.destinations.create({
      name: input.name,
      kind: input.kind,
      enabled: input.enabled,
      config: parseDestinationConfig(this.destinations, input.kind, input.config),
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
      config: config && kind ? parseDestinationConfig(this.destinations, kind, config) : config,
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
      success: result.ok,
      statusCode: result.statusCode,
      responseBody: redactNullableText(result.responseBody),
      error: redactNullableText(result.ok ? null : result.errorMessage),
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
    const config = parseDestinationConfig(this.destinations, input.kind, input.config);
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

    const config = parseDestinationConfig(
      this.destinations,
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
