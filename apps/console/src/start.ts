import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { requestLoggingMiddleware } from "#/middlewares/request-logging.middleware";

const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware, csrfMiddleware],
}));
