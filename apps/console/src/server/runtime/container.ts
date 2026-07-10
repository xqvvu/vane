import "@tanstack/react-start/server-only";
import { getLogger } from "@logtape/logtape";
import { betterAuth } from "better-auth";

import { createDefaultDestinationRegistry, type DestinationRegistry } from "@vane/destinations";
import { createDefaultProviderRegistry, type ProviderRegistry } from "@vane/providers";

import { env } from "#/env.ts";
import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate";
import type { VaneSqliteKysely } from "#/infra/sqlite/schema.ts";
import { openSqliteStore, type SqliteStore } from "#/infra/sqlite/store.ts";
import { requireBetterAuthBaseUrl, requireBetterAuthSecret } from "#/lib/auth-config.ts";
import { createBaseBetterAuthOptions } from "#/lib/auth-options.ts";
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
import { EventReplayService } from "#/server/operations/event-replay.service.ts";
import type { EventReplayServiceOptions } from "#/server/operations/event-replay.service.types.ts";
import { RouteService } from "#/server/routes/route.service.ts";
import type { DashboardSession } from "#/server/runtime/dashboard-session.ts";
import {
  createDeliveryWorkerRunner,
  type DeliveryWorkerRunner,
  type DeliveryWorkerRunnerOptions,
} from "#/server/runtime/delivery-worker-runner.ts";
import { safeErrorProperties } from "#/server/runtime/log-safety.ts";
import { SourceService } from "#/server/sources/source.service.ts";
import type { SourceServiceOptions } from "#/server/sources/source.service.types.ts";

const deliveryWorkerLogger = getLogger(["vane", "worker", "delivery"]);

export interface VaneAuth {
  handler(request: Request): Promise<Response>;
  api: {
    getSession(input: { headers: HeadersInit }): Promise<DashboardSession | null>;
  };
}

export interface ApplicationContainer {
  getSqliteStore(): Promise<SqliteStore>;
  getProviderRegistry(): ProviderRegistry;
  getDestinationRegistry(): DestinationRegistry;
  createSourceService(
    options?: Partial<Omit<SourceServiceOptions, "store">>,
  ): Promise<SourceService>;
  createDestinationService(
    options?: Partial<Omit<DestinationServiceOptions, "store" | "destinations">>,
  ): Promise<DestinationService>;
  createRouteService(): Promise<RouteService>;
  createAppSettingsService(): Promise<AppSettingsService>;
  createConfigPortabilityService(
    options?: Partial<
      Omit<ConfigPortabilityServiceOptions, "store" | "providers" | "destinations">
    >,
  ): Promise<ConfigPortabilityService>;
  createWebhookIntakeService(
    options?: Partial<Omit<WebhookIntakeServiceOptions, "store" | "providers">>,
  ): Promise<WebhookIntakeService>;
  createDeliveryWorker(
    options?: Partial<Omit<DeliveryWorkerOptions, "store" | "destinations">>,
  ): Promise<DeliveryWorker>;
  createEventReplayService(
    options?: Partial<Omit<EventReplayServiceOptions, "store">>,
  ): Promise<EventReplayService>;
  ensureDeliveryWorkerRunner(): Promise<DeliveryWorkerRunner>;
  getBetterAuthDatabase(): Promise<VaneSqliteKysely>;
  hasRegisteredUsers(): Promise<boolean>;
  getAuth(): Promise<VaneAuth>;
  dispose(): Promise<void>;
}

export interface ApplicationContainerOptions {
  openStore?: () => Promise<SqliteStore>;
  createProviderRegistry?: () => ProviderRegistry;
  createDestinationRegistry?: () => DestinationRegistry;
  createAuthDatabase?: () => Promise<VaneSqliteKysely>;
  createAuth?: (input: { db: VaneSqliteKysely }) => VaneAuth;
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
  void container?.dispose();
}

export function createApplicationContainer(
  options: ApplicationContainerOptions = {},
): ApplicationContainer {
  let sqliteStore: SqliteStore | undefined;
  let sqliteStorePromise: Promise<SqliteStore> | undefined;
  let providers: ProviderRegistry | undefined;
  let destinations: DestinationRegistry | undefined;
  let authDatabase: VaneSqliteKysely | undefined;
  let authDatabasePromise: Promise<VaneSqliteKysely> | undefined;
  let auth: VaneAuth | undefined;
  let authPromise: Promise<VaneAuth> | undefined;
  let runner: DeliveryWorkerRunner | undefined;
  let runnerPromise: Promise<DeliveryWorkerRunner> | undefined;

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
  const onWorkerError = options.onWorkerError ?? logWorkerError;

  const container: ApplicationContainer = {
    async getSqliteStore() {
      const store = await getOrOpenSqliteStore();
      void container.ensureDeliveryWorkerRunner();

      return store;
    },

    getProviderRegistry() {
      providers ??= createProviderRegistry();

      return providers;
    },

    getDestinationRegistry() {
      destinations ??= createDestinationRegistry();

      return destinations;
    },

    async createSourceService(serviceOptions = {}) {
      return new SourceService({
        store: await container.getSqliteStore(),
        ...serviceOptions,
      });
    },

    async createDestinationService(serviceOptions = {}) {
      return new DestinationService({
        store: await container.getSqliteStore(),
        destinations: container.getDestinationRegistry(),
        ...serviceOptions,
      });
    },

    async createRouteService() {
      return new RouteService({ store: await container.getSqliteStore() });
    },

    async createAppSettingsService() {
      return new AppSettingsService({ store: await container.getSqliteStore() });
    },

    async createConfigPortabilityService(serviceOptions = {}) {
      return new ConfigPortabilityService({
        store: await container.getSqliteStore(),
        providers: container.getProviderRegistry(),
        destinations: container.getDestinationRegistry(),
        ...serviceOptions,
      });
    },

    async createWebhookIntakeService(serviceOptions = {}) {
      return new WebhookIntakeService({
        store: await container.getSqliteStore(),
        providers: container.getProviderRegistry(),
        ...serviceOptions,
      });
    },

    async createDeliveryWorker(workerOptions = {}) {
      return new DeliveryWorker({
        store: await getOrOpenSqliteStore(),
        destinations: container.getDestinationRegistry(),
        staleRunningTimeoutMs: workerStaleRunningMs,
        ...workerOptions,
      });
    },

    async createEventReplayService(serviceOptions = {}) {
      return new EventReplayService({
        store: await container.getSqliteStore(),
        ...serviceOptions,
      });
    },

    ensureDeliveryWorkerRunner() {
      runnerPromise ??= (async () => {
        runner ??= createWorkerRunner({
          worker: await container.createDeliveryWorker(),
          intervalMs: workerIntervalMs,
          limit: workerBatchSize,
          onRunComplete: onWorkerRunComplete,
          onError: onWorkerError,
        });

        return runner;
      })();

      return runnerPromise;
    },

    async getBetterAuthDatabase() {
      authDatabase ??= await getOrCreateAuthDatabase();

      return authDatabase;
    },

    async hasRegisteredUsers() {
      return hasRegisteredUsers(await container.getBetterAuthDatabase());
    },

    getAuth() {
      authPromise ??= (async () => {
        auth ??= createAuth({
          db: await container.getBetterAuthDatabase(),
        });

        return auth;
      })();

      return authPromise;
    },

    async dispose() {
      const currentRunner = runner;
      const currentSqliteStore = sqliteStore;
      const currentAuthDatabase = authDatabase;
      const errors: unknown[] = [];

      runner = undefined;
      runnerPromise = undefined;
      sqliteStore = undefined;
      sqliteStorePromise = undefined;
      providers = undefined;
      destinations = undefined;
      authDatabase = undefined;
      authDatabasePromise = undefined;
      auth = undefined;
      authPromise = undefined;

      tryDispose(() => currentRunner?.stop(), errors);
      await tryDisposeAsync(() => currentSqliteStore?.close(), errors);
      await tryDisposeAsync(() => currentAuthDatabase?.destroy(), errors);

      if (errors.length === 1) {
        throw errors[0];
      }

      if (errors.length > 1) {
        throw new AggregateError(errors, "Failed to dispose application container");
      }
    },
  };

  async function getOrOpenSqliteStore(): Promise<SqliteStore> {
    sqliteStorePromise ??= openStore().then((store) => {
      sqliteStore = store;
      return store;
    });

    return sqliteStorePromise;
  }

  async function getOrCreateAuthDatabase(): Promise<VaneSqliteKysely> {
    authDatabasePromise ??= createAuthDatabase().then((db) => {
      authDatabase = db;
      return db;
    });

    return authDatabasePromise;
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

async function tryDisposeAsync(
  dispose: () => Promise<void> | void | undefined,
  errors: unknown[],
): Promise<void> {
  try {
    await dispose();
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

  const properties = {
    claimed: result.claimed,
    reclaimed: result.reclaimed,
    succeeded: result.succeeded,
    failed: result.failed,
    retrying: result.retrying,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
  };

  if (result.failed > 0) {
    deliveryWorkerLogger.warn(
      "Delivery worker completed with {failed} failed and {retrying} retrying",
      properties,
    );
  } else {
    deliveryWorkerLogger.info(
      "Delivery worker completed with {succeeded} succeeded and {retrying} retrying",
      properties,
    );
  }
}

function logWorkerError(error: unknown): void {
  deliveryWorkerLogger.error("Delivery worker run failed", safeErrorProperties(error));
}

async function createDefaultBetterAuthDatabase(): Promise<VaneSqliteKysely> {
  const db = createSqliteDatabase({
    databasePath: env.VANE_DATABASE_PATH,
  });

  await migrateSqliteDatabase(db);

  return db;
}

function createDefaultAuth(input: { db: VaneSqliteKysely }): VaneAuth {
  return betterAuth({
    ...createBaseBetterAuthOptions(),
    baseURL: requireBetterAuthBaseUrl(env.BETTER_AUTH_URL ?? env.SERVER_URL, process.env, {
      allowedHosts: env.BETTER_AUTH_ALLOWED_HOSTS,
    }),
    database: {
      db: input.db,
      type: "sqlite",
      casing: "snake",
    },
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
    databaseHooks: {
      user: {
        create: {
          before: async (user) =>
            assignOwnerRoleBeforeUserCreate(user, {
              hasRegisteredUsers: () => hasRegisteredUsers(input.db),
            }),
        },
      },
    },
    secret: requireBetterAuthSecret(env.BETTER_AUTH_SECRET),
  }) as VaneAuth;
}
