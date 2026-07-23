import { getApplicationContainer } from "#/server/runtime/container";

export function getSqliteStore() {
  return getApplicationContainer().getSqliteStore();
}

export async function createDefaultDeliveryWorkerDependencies() {
  return {
    store: await getApplicationContainer().getSqliteStore(),
    destinations: getApplicationContainer().getDestinationRegistry(),
  };
}

export function ensureDeliveryWorkerRunner() {
  return getApplicationContainer().ensureDeliveryWorkerRunner();
}
