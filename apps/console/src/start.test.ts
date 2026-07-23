import { csrfSymbol } from "@tanstack/react-start";
import { describe, expect, it } from "vitest";

import { requestLoggingMiddleware } from "#/middlewares/request-logging.middleware";
import { startInstance } from "#/start";

describe("TanStack Start configuration", () => {
  it("keeps request logging outside the CSRF middleware", async () => {
    const options = await startInstance.getOptions();

    expect(options.requestMiddleware).toHaveLength(2);
    expect(options.requestMiddleware?.[0]).toBe(requestLoggingMiddleware);
    expect(options.requestMiddleware?.[1]).toSatisfy(
      (middleware: object) => csrfSymbol in middleware,
    );
  });
});
