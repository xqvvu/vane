import { getApplicationContainer } from "#/application/runtime/container.ts";

export const auth = getApplicationContainer().getAuth();
