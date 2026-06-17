import {
  CreateSourceCommandSchema,
  RotateSourceTokenCommandSchema,
  UpdateSourceCommandSchema,
  type CreateSourceCommand,
  type RotateSourceTokenCommand,
  type SourceSummary,
  type UpdateSourceCommand,
} from "@vane/core";

import type { SqliteStore } from "#/infra/sqlite/store.ts";
import {
  generateSourceToken as defaultGenerateSourceToken,
  mergeJsonObjects,
} from "#/server/configuration/configuration-support.ts";
import { hashSourceToken } from "#/server/intake/intake.service.ts";

export interface SourceServiceOptions {
  store: SqliteStore;
  generateSourceToken?: () => string;
}

export interface CreatedSource {
  source: SourceSummary;
  token: string;
}

export interface RotatedSourceToken {
  source: SourceSummary;
  token: string;
}

export class SourceService {
  private readonly store: SqliteStore;
  private readonly generateSourceToken: () => string;

  constructor(options: SourceServiceOptions) {
    this.store = options.store;
    this.generateSourceToken = options.generateSourceToken ?? defaultGenerateSourceToken;
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
}
