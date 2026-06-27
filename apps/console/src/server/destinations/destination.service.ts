import { z } from "zod";

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
  type PreviewDestinationDraftCommand,
  type PreviewDestinationCommand,
  type PreviewDestinationUpdateCommand,
  type SourceSummary,
  type TestDestinationCommand,
  type UpdateDestinationCommand,
} from "@vane/core";
import { redactHeaders, redactJsonValue } from "@vane/core";
import type { DestinationCatalogItem } from "@vane/destinations";
import {
  createTemplateContext,
  isTemplateValidationError,
  templateErrorPayload,
} from "@vane/destinations";
import type { TemplateDiagnostic } from "@vane/destinations";

import {
  createTestNormalizedEvent,
  mergeJsonObjects,
  parseDestinationConfig,
  redactNullableText,
} from "#/server/configuration/configuration-support.ts";
import type {
  DestinationPreviewResult,
  DestinationPreviewSample,
  DestinationServiceOptions,
  DestinationTestResult,
} from "#/server/destinations/destination.service.types.ts";

export class DestinationService {
  private readonly store: DestinationServiceOptions["store"];
  private readonly destinations: DestinationServiceOptions["destinations"];
  private readonly destinationSendContext: DestinationServiceOptions["destinationSendContext"];

  constructor(options: DestinationServiceOptions) {
    this.store = options.store;
    this.destinations = options.destinations;
    this.destinationSendContext = options.destinationSendContext;
  }

  listDestinationCatalog(): DestinationCatalogItem[] {
    return this.destinations.toCatalog();
  }

  async createDestination(command: CreateDestinationCommand): Promise<DestinationSummary> {
    const input = CreateDestinationCommandSchema.parse(command);

    return this.store.destinations.create({
      name: input.name,
      kind: input.kind,
      enabled: input.enabled,
      config: parseDestinationConfig(this.destinations, input.kind, input.config),
      secretRefs: input.secretRefs,
    });
  }

  async updateDestination(command: UpdateDestinationCommand): Promise<DestinationSummary> {
    const input = UpdateDestinationCommandSchema.parse(command);
    const current = await this.store.destinations.get(input.id);
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
    const destination = await this.store.destinations.get(input.id);

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
    const destination = await this.store.destinations.get(input.id);

    if (!destination) {
      throw new Error(`Destination not found: ${input.id}`);
    }

    const summary: DestinationSummary = {
      id: destination.id,
      name: destination.name,
      kind: destination.kind,
      enabled: destination.enabled,
    };

    return this.previewDestinationConfig(summary, destination.config, input.sampleEventId);
  }

  async previewDestinationDraft(
    command: PreviewDestinationDraftCommand,
  ): Promise<DestinationPreviewResult> {
    const input = PreviewDestinationDraftCommandSchema.parse(command);
    const destination: DestinationSummary = {
      id: "preview-destination",
      name: input.name,
      kind: input.kind,
      enabled: true,
    };
    const templateDiagnostics = templateDiagnosticsFromConfigParseError(() =>
      parseDestinationConfig(this.destinations, input.kind, input.config),
    );

    if (templateDiagnostics) {
      return this.previewDestinationConfig(destination, input.config, input.sampleEventId, {
        diagnostics: templateDiagnostics,
      });
    }

    const config = parseDestinationConfig(this.destinations, input.kind, input.config);

    return this.previewDestinationConfig(destination, config, input.sampleEventId);
  }

  async previewDestinationUpdate(
    command: PreviewDestinationUpdateCommand,
  ): Promise<DestinationPreviewResult> {
    const input = PreviewDestinationUpdateCommandSchema.parse(command);
    const current = await this.store.destinations.get(input.id);

    if (!current) {
      throw new Error(`Destination not found: ${input.id}`);
    }

    const mergedConfig = mergeJsonObjects(current.config, input.config);
    const destination: DestinationSummary = {
      id: current.id,
      name: input.name ?? current.name,
      kind: current.kind,
      enabled: current.enabled,
    };
    const templateDiagnostics = templateDiagnosticsFromConfigParseError(() =>
      parseDestinationConfig(this.destinations, current.kind, mergedConfig),
    );

    if (templateDiagnostics) {
      return this.previewDestinationConfig(destination, mergedConfig, input.sampleEventId, {
        diagnostics: templateDiagnostics,
      });
    }

    const config = parseDestinationConfig(this.destinations, current.kind, mergedConfig);

    return this.previewDestinationConfig(destination, config, input.sampleEventId);
  }

  private async previewDestinationConfig(
    destination: DestinationSummary,
    config: JsonObject,
    sampleEventId?: string,
    options: { diagnostics?: TemplateDiagnostic[] } = {},
  ): Promise<DestinationPreviewResult> {
    const sample = await this.resolvePreviewSample(sampleEventId);
    const input = {
      eventId: sample.metadata.eventId,
      source: sample.metadata.source,
      destination,
      normalizedEvent: sample.normalizedEvent,
      config,
    };

    const context = createTemplateContext(input);

    if (options.diagnostics && options.diagnostics.length > 0) {
      return {
        destination,
        renderedPayload: templateDiagnosticsPayload(options.diagnostics),
        sample: sample.metadata,
        context,
        normalizedEvent: sample.normalizedEvent,
        diagnostics: options.diagnostics,
        rawPayloadReference: sample.rawPayloadReference,
      };
    }

    try {
      return {
        destination,
        renderedPayload: await this.destinations.preview(destination.kind, input),
        sample: sample.metadata,
        context,
        normalizedEvent: sample.normalizedEvent,
        diagnostics: [],
        rawPayloadReference: sample.rawPayloadReference,
      };
    } catch (error) {
      if (!isTemplateValidationError(error)) {
        throw error;
      }

      return {
        destination,
        renderedPayload: templateErrorPayload(error),
        sample: sample.metadata,
        context,
        normalizedEvent: sample.normalizedEvent,
        diagnostics: error.diagnostics,
        rawPayloadReference: sample.rawPayloadReference,
      };
    }
  }

  private async resolvePreviewSample(sampleEventId?: string) {
    if (!sampleEventId) {
      const source: SourceSummary = {
        id: "preview-source",
        name: "Vane preview",
        provider: "generic",
        enabled: true,
      };
      const metadata: DestinationPreviewSample = {
        kind: "built_in",
        eventId: "preview-event",
        source,
        receivedAt: null,
      };

      return {
        metadata,
        normalizedEvent: createTestNormalizedEvent(),
        rawPayloadReference: null,
      };
    }

    const detail = await this.store.history.getEventDetail(sampleEventId);

    if (!detail) {
      throw new Error(`Preview sample Event not found: ${sampleEventId}`);
    }

    return {
      metadata: {
        kind: "historical_event" as const,
        eventId: detail.event.id,
        source: detail.source,
        receivedAt: detail.event.receivedAt,
      },
      normalizedEvent: detail.event.normalized,
      rawPayloadReference: {
        eventId: detail.event.id,
        payload: redactJsonValue(detail.event.rawPayload),
        headers: redactHeaders(detail.event.rawHeaders),
      },
    };
  }
}

function templateDiagnosticsFromConfigParseError(
  parse: () => JsonObject,
): TemplateDiagnostic[] | null {
  try {
    parse();
    return null;
  } catch (error) {
    if (!isTemplateZodError(error)) {
      throw error;
    }

    return error.issues.map((issue) => ({
      severity: "error",
      path: issue.path.join("."),
      variable: templateVariableFromMessage(issue.message),
      message: issue.message,
    }));
  }
}

function isTemplateZodError(error: unknown): error is z.ZodError {
  return (
    error instanceof z.ZodError &&
    error.issues.length > 0 &&
    error.issues.every((issue) =>
      issue.message.startsWith("Destination template contains unknown variable: "),
    )
  );
}

function templateDiagnosticsPayload(diagnostics: TemplateDiagnostic[]): JsonObject {
  return {
    templateError: {
      diagnostics: diagnostics.map((diagnostic) => ({
        severity: diagnostic.severity,
        path: diagnostic.path ?? null,
        variable: diagnostic.variable ?? null,
        message: diagnostic.message,
      })),
    },
  };
}

function templateVariableFromMessage(message: string): string | undefined {
  return message.replace("Destination template contains unknown variable: ", "") || undefined;
}
