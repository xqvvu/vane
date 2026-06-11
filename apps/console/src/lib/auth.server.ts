import "@tanstack/react-start/server-only";
import { getApplicationContainer } from "#/application/runtime/container.server.ts";

export const auth = getApplicationContainer().getAuth();
