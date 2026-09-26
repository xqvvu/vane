import { auth } from "./auth";
import { destinations } from "./destinations";
import { health } from "./health";
import { i18n } from "./i18n";
import { operations } from "./operations";
import { portability } from "./portability";
import { routes } from "./routes";
import { settings } from "./settings";
import { sources } from "./sources";

export { auth } from "./auth";
export { destinations } from "./destinations";
export { health } from "./health";
export { i18n } from "./i18n";
export { operations } from "./operations";
export { portability } from "./portability";
export { routes } from "./routes";
export { settings } from "./settings";
export { sources } from "./sources";

/**
 * Root contract: one namespace per business capability.
 *
 * Implementers in `apps/console` mirror this shape exactly through
 * `os.router(...)`, so the router and the contract cannot drift apart.
 */
export const contract = {
  auth,
  destinations,
  health,
  i18n,
  operations,
  portability,
  routes,
  settings,
  sources,
};
