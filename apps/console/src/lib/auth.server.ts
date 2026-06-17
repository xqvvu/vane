import { getApplicationContainer } from "#/server/runtime/container.ts";

export const auth = getApplicationContainer().getAuth();
