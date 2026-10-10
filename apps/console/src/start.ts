import { createStart } from "@tanstack/react-start";

import { csrfMiddleware } from "#/middlewares/csrf.middleware";
import { requestLoggingMiddleware } from "#/middlewares/request-logging.middleware";

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware, csrfMiddleware],
}));
