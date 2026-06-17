import { getApplicationContainer } from "#/server/runtime/container.ts";

export function getSqliteStore() {
  return getApplicationContainer().getSqliteStore();
}

export function createDefaultDeliveryWorkerDependencies() {
  return {
    store: getApplicationContainer().getSqliteStore(),
    destinations: getApplicationContainer().getDestinationRegistry(),
  };
}

export function ensureDeliveryWorkerRunner() {
  return getApplicationContainer().ensureDeliveryWorkerRunner();
}
