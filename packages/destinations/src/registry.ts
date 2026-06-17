import { DestinationKindSchema, type DestinationKind } from "@vane/core";

import { emailAdapter } from "#/email/index.ts";
import { feishuAdapter } from "#/feishu/index.ts";
import { genericWebhookAdapter } from "#/generic-webhook/index.ts";
import { slackAdapter } from "#/slack/index.ts";
import type {
  DestinationAdapter,
  DestinationCatalogItem,
  DestinationSendContext,
  DestinationSendInput,
  DestinationSendResult,
  DestinationSender,
} from "#/types.ts";
import { DestinationCatalogItemSchema, DestinationManifestSchema } from "#/types.ts";

export interface DestinationRegistryAuditResult {
  warnings: string[];
}

export interface DestinationRegistryAuditOptions {
  messageKeys?: ReadonlySet<string>;
}

export class DestinationRegistry {
  private readonly adapters = new Map<DestinationKind, DestinationAdapter>();

  register(adapter: DestinationAdapter): void {
    const manifest = DestinationManifestSchema.parse(adapter.manifest);

    if (this.adapters.has(manifest.kind)) {
      throw new Error(`Destination adapter already registered: ${manifest.kind}`);
    }

    this.adapters.set(manifest.kind, adapter);
  }

  get(kind: DestinationKind): DestinationAdapter {
    const adapter = this.adapters.get(kind);

    if (!adapter) {
      throw new Error(`Unknown destination adapter: ${kind}`);
    }

    return adapter;
  }

  parseConfig(kind: DestinationKind, config: unknown): unknown {
    return this.get(kind).configSchema.parse(config);
  }

  send(
    kind: DestinationKind,
    input: DestinationSendInput<unknown>,
    context?: DestinationSendContext,
  ): Promise<DestinationSendResult> {
    return this.get(kind).send(input, context);
  }

  preview(kind: DestinationKind, input: DestinationSendInput<unknown>) {
    return this.get(kind).preview(input);
  }

  toCatalog(): DestinationCatalogItem[] {
    return this.list().map((adapter) =>
      DestinationCatalogItemSchema.parse({
        kind: adapter.manifest.kind,
        configVersion: adapter.manifest.configVersion,
        lifecycle: adapter.manifest.lifecycle,
        displayNameKey: adapter.manifest.displayNameKey,
        descriptionKey: adapter.manifest.descriptionKey,
        iconName: adapter.manifest.iconName,
        configFields: adapter.manifest.configFields,
        capabilities: adapter.manifest.capabilities,
      }),
    );
  }

  audit(options: DestinationRegistryAuditOptions = {}): DestinationRegistryAuditResult {
    const warnings: string[] = [];
    const registeredKinds = new Set(this.adapters.keys());
    const enumKinds = new Set(DestinationKindSchema.options);

    for (const kind of enumKinds) {
      if (!registeredKinds.has(kind)) {
        warnings.push(`Destination kind is missing from registry: ${kind}`);
      }
    }

    for (const kind of registeredKinds) {
      if (!enumKinds.has(kind)) {
        warnings.push(`Destination registry contains kind outside core enum: ${kind}`);
      }

      const adapter = this.get(kind);
      const sensitivePaths = new Set(
        adapter.manifest.configFields.filter((field) => field.sensitive).map((field) => field.path),
      );
      const secretPaths = new Set(adapter.manifest.secretFields.map((field) => field.path));

      for (const path of sensitivePaths) {
        if (!secretPaths.has(path)) {
          warnings.push(`Destination ${kind} marks sensitive config without secret field: ${path}`);
        }
      }

      if (adapter.manifest.lifecycle.status === "deprecated") {
        const replacement = adapter.manifest.lifecycle.replacementKind;

        if (!replacement && !adapter.manifest.lifecycle.messageKey) {
          warnings.push(`Deprecated destination ${kind} must declare a replacement or message key`);
        }
      }

      this.auditMessageKey(warnings, options.messageKeys, kind, adapter.manifest.displayNameKey);
      this.auditMessageKey(warnings, options.messageKeys, kind, adapter.manifest.descriptionKey);
      this.auditMessageKey(
        warnings,
        options.messageKeys,
        kind,
        adapter.manifest.lifecycle.messageKey,
      );

      for (const field of adapter.manifest.configFields) {
        this.auditMessageKey(warnings, options.messageKeys, kind, field.labelKey);
        this.auditMessageKey(warnings, options.messageKeys, kind, field.descriptionKey);
        this.auditMessageKey(warnings, options.messageKeys, kind, field.placeholderKey);

        if (field.type === "select") {
          for (const option of field.options) {
            this.auditMessageKey(warnings, options.messageKeys, kind, option.labelKey);
          }
        }
      }

      for (const field of adapter.manifest.secretFields) {
        this.auditMessageKey(warnings, options.messageKeys, kind, field.labelKey);
      }
    }

    const catalog = this.toCatalog();

    for (const item of catalog) {
      const unsafe = item as unknown as Record<string, unknown>;

      if ("secretFields" in unsafe || "configSchema" in unsafe || "send" in unsafe) {
        warnings.push(`Destination catalog item leaks runtime internals: ${item.kind}`);
      }
    }

    return { warnings };
  }

  list(): DestinationAdapter[] {
    return [...this.adapters.values()];
  }

  private auditMessageKey(
    warnings: string[],
    messageKeys: ReadonlySet<string> | undefined,
    kind: DestinationKind,
    key: string | undefined,
  ): void {
    if (messageKeys && key && !messageKeys.has(key)) {
      warnings.push(`Destination ${kind} references missing i18n key: ${key}`);
    }
  }
}

export function createDefaultDestinationRegistry(): DestinationRegistry {
  const registry = new DestinationRegistry();
  registry.register(genericWebhookAdapter);
  registry.register(feishuAdapter);
  registry.register(slackAdapter);
  registry.register(emailAdapter);
  return registry;
}

export type {
  DestinationAdapter,
  DestinationCatalogItem,
  DestinationSendContext,
  DestinationSendInput,
  DestinationSendResult,
  DestinationSender,
};
