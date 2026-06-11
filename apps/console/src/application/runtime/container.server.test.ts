import { createDefaultDestinationRegistry } from "@vane/destinations";
import { createDefaultProviderRegistry } from "@vane/providers";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createApplicationContainer,
  type ApplicationContainerOptions,
} from "#/application/runtime/container.server.ts";
import { WebhookIntakeService } from "#/application/services/intake.ts";
import { openSqliteStore, type SqliteStore } from "#/infra/sqlite/store.ts";

describe("application container", () => {
  let store: SqliteStore | undefined;

  afterEach(() => {
    store?.close();
    store = undefined;
    vi.restoreAllMocks();
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

    const firstConfigurationService = container.createConfigurationService();
    const secondConfigurationService = container.createConfigurationService();
    const webhookIntakeService = container.createWebhookIntakeService();

    expect(firstConfigurationService).not.toBe(secondConfigurationService);
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
});
