import "@tanstack/react-start/server-only";
import { createDefaultDestinationRegistry, type DestinationRegistry } from "@vane/destinations";
import { createDefaultProviderRegistry, type ProviderRegistry } from "@vane/providers";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import type { DashboardSession } from "#/application/runtime/dashboard-auth.ts";
import {
  createDeliveryWorkerRunner,
  type DeliveryWorkerRunner,
  type DeliveryWorkerRunnerOptions,
} from "#/application/runtime/delivery-worker-runner.ts";
import {
  ConfigurationService,
  type ConfigurationServiceOptions,
} from "#/application/services/configuration.ts";
import {
  DeliveryWorker,
  type DeliveryWorkerOptions,
  type DeliveryWorkerRunResult,
} from "#/application/services/delivery-worker.ts";
import {
  WebhookIntakeService,
  type WebhookIntakeServiceOptions,
} from "#/application/services/intake.ts";
import { env } from "#/env.ts";
import { createSqliteDatabase, type SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import { openSqliteStore, type SqliteStore } from "#/infra/sqlite/store.ts";
import { requireBetterAuthBaseUrl, requireBetterAuthSecret } from "#/lib/auth-config.ts";
import { assignOwnerRoleBeforeUserCreate, hasRegisteredUsers } from "#/lib/auth-owner-bootstrap.ts";

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
  createConfigurationService(
    options?: Partial<Omit<ConfigurationServiceOptions, "store" | "providers" | "destinations">>,
  ): ConfigurationService;
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

    createConfigurationService(serviceOptions = {}) {
      return new ConfigurationService({
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
