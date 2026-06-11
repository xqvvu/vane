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
} from "#/application/services/delivery-worker.ts";
import {
  WebhookIntakeService,
  type WebhookIntakeServiceOptions,
} from "#/application/services/intake.ts";
import { env } from "#/env.ts";
import { createSqliteDatabase, type SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import { openSqliteStore, type SqliteStore } from "#/infra/sqlite/store.ts";
import { requireBetterAuthBaseUrl, requireBetterAuthSecret } from "#/lib/auth-config.server.ts";
import { assignOwnerRoleBeforeUserCreate } from "#/lib/auth-owner-bootstrap.server.ts";

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
    options?: Partial<Omit<ConfigurationServiceOptions, "store" | "destinations">>,
  ): ConfigurationService;
  createWebhookIntakeService(
    options?: Partial<Omit<WebhookIntakeServiceOptions, "store" | "providers">>,
  ): WebhookIntakeService;
  createDeliveryWorker(
    options?: Partial<Omit<DeliveryWorkerOptions, "store" | "destinations">>,
  ): DeliveryWorker;
  ensureDeliveryWorkerRunner(): DeliveryWorkerRunner;
  getBetterAuthDatabase(): SqliteDatabase;
  getAuth(): VaneAuth;
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
  onWorkerError?: (error: unknown) => void;
}

const globalContainer = globalThis as typeof globalThis & {
  __vaneApplicationContainer?: ApplicationContainer;
};

export function getApplicationContainer(): ApplicationContainer {
  globalContainer.__vaneApplicationContainer ??= createApplicationContainer();

  return globalContainer.__vaneApplicationContainer;
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
        ...workerOptions,
      });
    },

    ensureDeliveryWorkerRunner() {
      runner ??= createWorkerRunner({
        worker: container.createDeliveryWorker(),
        intervalMs: workerIntervalMs,
        limit: workerBatchSize,
        onError: onWorkerError,
      });

      return runner;
    },

    getBetterAuthDatabase() {
      authDatabase ??= createAuthDatabase();

      return authDatabase;
    },

    getAuth() {
      auth ??= createAuth({
        database: container.getBetterAuthDatabase(),
      });

      return auth;
    },
  };

  function getOrOpenSqliteStore(): SqliteStore {
    sqliteStore ??= openStore();

    return sqliteStore;
  }

  return container;
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

function hasRegisteredUsers(database: SqliteDatabase): boolean {
  const row = database.prepare('SELECT COUNT(*) AS count FROM "user"').get() as
    | { count: number }
    | undefined;

  return (row?.count ?? 0) > 0;
}
