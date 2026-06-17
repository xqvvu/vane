import { createDefaultDestinationRegistry } from "@vane/destinations";
import { createDefaultProviderRegistry } from "@vane/providers";
import { afterEach, describe, expect, it, vi } from "vitest";

import { openSqliteStore, type SqliteStore } from "#/infra/sqlite/store.ts";
import { WebhookIntakeService } from "#/server/intake/intake.service.ts";
import {
  createApplicationContainer,
  disposeApplicationContainer,
  getApplicationContainer,
  type ApplicationContainerOptions,
} from "#/server/runtime/container.ts";

describe("application container", () => {
  let store: SqliteStore | undefined;

  afterEach(() => {
    disposeApplicationContainer();
    store?.close();
    store = undefined;
    vi.restoreAllMocks();
  });

  it("caches the default container in the ESM module until disposed", () => {
    const first = getApplicationContainer();
    const second = getApplicationContainer();

    expect(first).toBe(second);

    disposeApplicationContainer();

    const third = getApplicationContainer();

    expect(third).not.toBe(first);
  });

  it("caches long-lived dependencies and creates services through explicit factories", () => {
    const openStore = vi.fn<() => SqliteStore>(() => {
      store = openSqliteStore({
        databasePath: ":memory:",
      });

      return store;
    });
    const createProviderRegistry = vi.fn<typeof createDefaultProviderRegistry>(
      createDefaultProviderRegistry,
    );
    const createDestinationRegistry = vi.fn<typeof createDefaultDestinationRegistry>(
      createDefaultDestinationRegistry,
    );
    const createWorkerRunner: NonNullable<ApplicationContainerOptions["createWorkerRunner"]> =
      vi.fn<NonNullable<ApplicationContainerOptions["createWorkerRunner"]>>(() => ({
        runNow: async () => null,
        getHealth: () => ({
          state: "idle",
          lastStartedAt: null,
          lastFinishedAt: null,
          lastError: null,
          lastRun: null,
        }),
        stop: () => {},
      }));
    const container = createApplicationContainer({
      openStore,
      createProviderRegistry,
      createDestinationRegistry,
      createWorkerRunner,
      workerIntervalMs: 1234,
      workerBatchSize: 7,
    });

    expect(container.getSqliteStore()).toBe(container.getSqliteStore());
    expect(container.getProviderRegistry()).toBe(container.getProviderRegistry());
    expect(container.getDestinationRegistry()).toBe(container.getDestinationRegistry());
    expect(openStore).toHaveBeenCalledTimes(1);
    expect(createProviderRegistry).toHaveBeenCalledTimes(1);
    expect(createDestinationRegistry).toHaveBeenCalledTimes(1);

    const firstSourceService = container.createSourceService();
    const secondSourceService = container.createSourceService();
    const webhookIntakeService = container.createWebhookIntakeService();

    expect(firstSourceService).not.toBe(secondSourceService);
    expect(webhookIntakeService).toBeInstanceOf(WebhookIntakeService);

    expect(container.ensureDeliveryWorkerRunner()).toBe(container.ensureDeliveryWorkerRunner());
    expect(createWorkerRunner).toHaveBeenCalledTimes(1);
    expect(createWorkerRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        intervalMs: 1234,
        limit: 7,
        worker: expect.any(Object),
      }),
    );
  });

  it("disposes opened long-lived dependencies", () => {
    let openedStoreClose: ReturnType<typeof vi.fn<() => void>> | undefined;
    const openStore = vi.fn<() => SqliteStore>(() => {
      const nextStore = openSqliteStore({
        databasePath: ":memory:",
      });
      openedStoreClose = vi.spyOn(nextStore, "close");

      return nextStore;
    });
    const authDatabaseClose = vi.fn<() => void>();
    const authDatabase = { close: authDatabaseClose };
    const runner = {
      runNow: async () => null,
      getHealth: () => ({
        state: "idle" as const,
        lastStartedAt: null,
        lastFinishedAt: null,
        lastError: null,
        lastRun: null,
      }),
      stop: vi.fn<() => void>(),
    };
    const container = createApplicationContainer({
      openStore,
      createAuthDatabase: () => authDatabase as never,
      createAuth: () =>
        ({
          handler: async () => new Response(null),
          api: {
            getSession: async () => null,
          },
        }) as never,
      createWorkerRunner: () => runner,
    });

    container.getSqliteStore();
    container.getAuth();

    container.dispose();
    container.dispose();

    expect(runner.stop).toHaveBeenCalledTimes(1);
    expect(openedStoreClose).toHaveBeenCalledTimes(1);
    expect(authDatabaseClose).toHaveBeenCalledTimes(1);
  });

  it("clears resource references before reporting dispose errors", () => {
    const sqliteCloseError = new Error("sqlite close failed");
    const authCloseError = new Error("auth close failed");
    const sqliteStoreClose = vi.fn<() => void>(() => {
      throw sqliteCloseError;
    });
    const sqliteStore = {
      close: sqliteStoreClose,
    } as unknown as SqliteStore;
    const authDatabaseClose = vi.fn<() => void>(() => {
      throw authCloseError;
    });
    const authDatabase = { close: authDatabaseClose };
    const runner = {
      runNow: async () => null,
      getHealth: () => ({
        state: "idle" as const,
        lastStartedAt: null,
        lastFinishedAt: null,
        lastError: null,
        lastRun: null,
      }),
      stop: vi.fn<() => void>(),
    };
    const container = createApplicationContainer({
      openStore: () => sqliteStore,
      createAuthDatabase: () => authDatabase as never,
      createAuth: () =>
        ({
          handler: async () => new Response(null),
          api: {
            getSession: async () => null,
          },
        }) as never,
      createWorkerRunner: () => runner,
    });

    container.getSqliteStore();
    container.getAuth();

    expect(() => container.dispose()).toThrow(AggregateError);
    expect(() => container.dispose()).not.toThrow();
    expect(runner.stop).toHaveBeenCalledTimes(1);
    expect(sqliteStoreClose).toHaveBeenCalledTimes(1);
    expect(authDatabaseClose).toHaveBeenCalledTimes(1);
  });
});
