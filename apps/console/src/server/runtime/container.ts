import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { createDefaultDestinationRegistry, type DestinationRegistry } from "@vane/destinations";
import { createDefaultProviderRegistry, type ProviderRegistry } from "@vane/providers";

import { env } from "#/env.ts";
import { createSqliteDatabase, type SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import { openSqliteStore, type SqliteStore } from "#/infra/sqlite/store.ts";
import { requireBetterAuthBaseUrl, requireBetterAuthSecret } from "#/lib/auth-config.ts";
import { assignOwnerRoleBeforeUserCreate, hasRegisteredUsers } from "#/lib/auth-owner-bootstrap.ts";
import { AppSettingsService } from "#/server/configuration/app-settings.service.ts";
import { ConfigPortabilityService } from "#/server/configuration/config-portability.service.ts";
import type { ConfigPortabilityServiceOptions } from "#/server/configuration/config-portability.service.types.ts";
import { DeliveryWorker } from "#/server/deliveries/delivery-worker.service.ts";
import type {
  DeliveryWorkerOptions,
  DeliveryWorkerRunResult,
} from "#/server/deliveries/delivery-worker.service.types.ts";
import { DestinationService } from "#/server/destinations/destination.service.ts";
import type { DestinationServiceOptions } from "#/server/destinations/destination.service.types.ts";
import { WebhookIntakeService } from "#/server/intake/intake.service.ts";
import type { WebhookIntakeServiceOptions } from "#/server/intake/intake.service.types.ts";
import { RouteService } from "#/server/routes/route.service.ts";
import type { DashboardSession } from "#/server/runtime/dashboard-session.ts";
import {
  createDeliveryWorkerRunner,
  type DeliveryWorkerRunner,
  type DeliveryWorkerRunnerOptions,
} from "#/server/runtime/delivery-worker-runner.ts";
import { SourceService } from "#/server/sources/source.service.ts";
import type { SourceServiceOptions } from "#/server/sources/source.service.types.ts";

export interface VaneAuth {
  handler(request: Request): Promise<Response>;
  api: {
    getSession(input: { headers: HeadersInit }): Promise<DashboardSession | null>;
  };
}

export interface ApplicationContainer {
  getSqliteStore(): SqliteStore;
  getProviderRegistry(): ProviderRegistry;
  getDestinationRegistry(): DestinationRegistry;
  createSourceService(options?: Partial<Omit<SourceServiceOptions, "store">>): SourceService;
  createDestinationService(
    options?: Partial<Omit<DestinationServiceOptions, "store" | "destinations">>,
  ): DestinationService;
  createRouteService(): RouteService;
  createAppSettingsService(): AppSettingsService;
  createConfigPortabilityService(
    options?: Partial<
      Omit<ConfigPortabilityServiceOptions, "store" | "providers" | "destinations">
    >,
  ): ConfigPortabilityService;
  createWebhookIntakeService(
    options?: Partial<Omit<WebhookIntakeServiceOptions, "store" | "providers">>,
  ): WebhookIntakeService;
  createDeliveryWorker(
    options?: Partial<Omit<DeliveryWorkerOptions, "store" | "destinations">>,
  ): DeliveryWorker;
  ensureDeliveryWorkerRunner(): DeliveryWorkerRunner;
  getBetterAuthDatabase(): SqliteDatabase;
  hasRegisteredUsers(): boolean;
  getAuth(): VaneAuth;
  dispose(): void;
}

export interface ApplicationContainerOptions {
  openStore?: () => SqliteStore;
  createProviderRegistry?: () => ProviderRegistry;
  createDestinationRegistry?: () => DestinationRegistry;
  createAuthDatabase?: () => SqliteDatabase;
  createAuth?: (input: { database: SqliteDatabase }) => VaneAuth;
  createWorkerRunner?: (options: DeliveryWorkerRunnerOptions) => DeliveryWorkerRunner;
  workerIntervalMs?: number;
  workerBatchSize?: number;
  workerStaleRunningMs?: number;
  onWorkerRunComplete?: (result: DeliveryWorkerRunResult) => void;
  onWorkerError?: (error: unknown) => void;
}

let applicationContainer: ApplicationContainer | undefined;

export function getApplicationContainer(): ApplicationContainer {
  applicationContainer ??= createApplicationContainer();

  return applicationContainer;
}

export function disposeApplicationContainer(): void {
  const container = applicationContainer;

  applicationContainer = undefined;
  container?.dispose();
}

export function createApplicationContainer(
  options: ApplicationContainerOptions = {},
): ApplicationContainer {
  let sqliteStore: SqliteStore | undefined;
  let providers: ProviderRegistry | undefined;
  let destinations: DestinationRegistry | undefined;
  let authDatabase: SqliteDatabase | undefined;
  let auth: VaneAuth | undefined;
  let runner: DeliveryWorkerRunner | undefined;

  const openStore =
    options.openStore ??
    (() =>
      openSqliteStore({
        databasePath: env.VANE_DATABASE_PATH,
      }));
  const createProviderRegistry = options.createProviderRegistry ?? createDefaultProviderRegistry;
  const createDestinationRegistry =
    options.createDestinationRegistry ?? createDefaultDestinationRegistry;
  const createAuthDatabase = options.createAuthDatabase ?? createDefaultBetterAuthDatabase;
  const createAuth = options.createAuth ?? createDefaultAuth;
  const createWorkerRunner = options.createWorkerRunner ?? createDeliveryWorkerRunner;
  const workerIntervalMs = options.workerIntervalMs ?? env.VANE_WORKER_INTERVAL_MS;
  const workerBatchSize = options.workerBatchSize ?? env.VANE_WORKER_BATCH_SIZE;
  const workerStaleRunningMs = options.workerStaleRunningMs ?? env.VANE_WORKER_STALE_RUNNING_MS;
  const onWorkerRunComplete = options.onWorkerRunComplete ?? logWorkerRunComplete;
  const onWorkerError =
    options.onWorkerError ??
    ((error) => {
      console.error("Vane delivery worker failed", error);
    });

  const container: ApplicationContainer = {
    getSqliteStore() {
      sqliteStore ??= openStore();
      container.ensureDeliveryWorkerRunner();

      return sqliteStore;
    },

    getProviderRegistry() {
      providers ??= createProviderRegistry();

      return providers;
    },

    getDestinationRegistry() {
      destinations ??= createDestinationRegistry();

      return destinations;
    },

    createSourceService(serviceOptions = {}) {
      return new SourceService({
        store: container.getSqliteStore(),
        ...serviceOptions,
      });
    },

    createDestinationService(serviceOptions = {}) {
      return new DestinationService({
        store: container.getSqliteStore(),
        destinations: container.getDestinationRegistry(),
        ...serviceOptions,
      });
    },

    createRouteService() {
      return new RouteService({ store: container.getSqliteStore() });
    },

    createAppSettingsService() {
      return new AppSettingsService({ store: container.getSqliteStore() });
    },

    createConfigPortabilityService(serviceOptions = {}) {
      return new ConfigPortabilityService({
        store: container.getSqliteStore(),
        providers: container.getProviderRegistry(),
        destinations: container.getDestinationRegistry(),
        ...serviceOptions,
      });
    },

    createWebhookIntakeService(serviceOptions = {}) {
      return new WebhookIntakeService({
        store: container.getSqliteStore(),
        providers: container.getProviderRegistry(),
        ...serviceOptions,
      });
    },

    createDeliveryWorker(workerOptions = {}) {
      return new DeliveryWorker({
        store: getOrOpenSqliteStore(),
        destinations: container.getDestinationRegistry(),
        staleRunningTimeoutMs: workerStaleRunningMs,
        ...workerOptions,
      });
    },

    ensureDeliveryWorkerRunner() {
      runner ??= createWorkerRunner({
        worker: container.createDeliveryWorker(),
        intervalMs: workerIntervalMs,
        limit: workerBatchSize,
        onRunComplete: onWorkerRunComplete,
        onError: onWorkerError,
      });

      return runner;
    },

    getBetterAuthDatabase() {
      authDatabase ??= createAuthDatabase();

      return authDatabase;
    },

    hasRegisteredUsers() {
      return hasRegisteredUsers(container.getBetterAuthDatabase());
    },

    getAuth() {
      auth ??= createAuth({
        database: container.getBetterAuthDatabase(),
      });

      return auth;
    },

    dispose() {
      const currentRunner = runner;
      const currentSqliteStore = sqliteStore;
      const currentAuthDatabase = authDatabase;
      const errors: unknown[] = [];

      runner = undefined;
      sqliteStore = undefined;
      authDatabase = undefined;
      providers = undefined;
      destinations = undefined;
      auth = undefined;

      tryDispose(() => currentRunner?.stop(), errors);
      tryDispose(() => currentSqliteStore?.close(), errors);
      tryDispose(() => currentAuthDatabase?.close(), errors);

      if (errors.length === 1) {
        throw errors[0];
      }

      if (errors.length > 1) {
        throw new AggregateError(errors, "Failed to dispose application container");
      }
    },
  };

  function getOrOpenSqliteStore(): SqliteStore {
    sqliteStore ??= openStore();

    return sqliteStore;
  }

  return container;
}

function tryDispose(dispose: () => void, errors: unknown[]): void {
  try {
    dispose();
  } catch (error) {
    errors.push(error);
  }
}

const hot = (
  import.meta as ImportMeta & {
    hot?: {
      dispose(callback: () => void): void;
    };
  }
).hot;

hot?.dispose(disposeApplicationContainer);

function logWorkerRunComplete(result: DeliveryWorkerRunResult): void {
  if (result.claimed === 0 && result.reclaimed === 0) {
    return;
  }

  console.info("Vane delivery worker completed", {
    claimed: result.claimed,
    reclaimed: result.reclaimed,
    succeeded: result.succeeded,
    failed: result.failed,
    retrying: result.retrying,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
  });
}

function createDefaultBetterAuthDatabase(): SqliteDatabase {
  const database = createSqliteDatabase({
    databasePath: env.VANE_DATABASE_PATH,
  });

  migrateSqliteDatabase(database);

  return database;
}

function createDefaultAuth(input: { database: SqliteDatabase }): VaneAuth {
  return betterAuth({
    baseURL: requireBetterAuthBaseUrl(env.BETTER_AUTH_URL ?? env.SERVER_URL),
    database: input.database,
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
    user: {
      additionalFields: {
        role: {
          type: ["owner", "admin", "member"],
          required: false,
          defaultValue: "member",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) =>
            assignOwnerRoleBeforeUserCreate(user, {
              hasRegisteredUsers: () => hasRegisteredUsers(input.database),
            }),
        },
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    secret: requireBetterAuthSecret(env.BETTER_AUTH_SECRET),
    plugins: [tanstackStartCookies()],
  }) as VaneAuth;
}
