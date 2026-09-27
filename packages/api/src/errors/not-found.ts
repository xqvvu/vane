/**
 * Shared NOT_FOUND error definition.
 *
 * `end` is the plain HTTP path used by non-oRPC handlers such as webhook intake
 * and the server-function fallback; `error` declares the typed oRPC error map
 * key so contracts and implementers agree on one message.
 */
export const notFound = {
  end(res: {
    statusCode: number;
    setHeader(name: string, value: string): void;
    end(body?: string): void;
  }) {
    const data = JSON.stringify({
      code: "NOT_FOUND",
      message: "the route not found",
    });
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(data);
  },

  error: {
    NOT_FOUND: {
      message: "the resource was not found",
    },
  },
};
