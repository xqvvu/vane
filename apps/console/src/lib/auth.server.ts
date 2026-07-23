import { getApplicationContainer } from "#/server/runtime/container";

export function getAuth() {
  return getApplicationContainer().getAuth();
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
export declare const auth: Auth;
