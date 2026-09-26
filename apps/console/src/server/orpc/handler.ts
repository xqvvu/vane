import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import {
  CORSHandlerPlugin,
  RequestHeadersHandlerPlugin,
  ResponseHeadersHandlerPlugin,
} from "@orpc/server/plugins";

import { generateOpenAPISpecs } from "#/server/orpc/openapi";
import { router } from "#/server/orpc/router";

/**
 * RPC-protocol handler used by the browser client (`RPCLink` in
 * `#/lib/orpc.ts`) and exposed on `/api/rpc`.
 *
 * The RPC protocol is what makes `orpc.*.queryOptions()` / `mutationOptions()`
 * work from the client without generating a typed client per procedure.
 */
export const rpcHandler = new RPCHandler(router, {
  plugins: [
    new CORSHandlerPlugin({
      allowHeaders: ["Content-Disposition"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    }),
    new RequestHeadersHandlerPlugin(),
    new ResponseHeadersHandlerPlugin(),
  ],
  interceptors: [
    onError((error) => {
      console.error("[oRPC Error]", error);
    }),
  ],
});

/**
 * OpenAPI handler mounted on a separate prefix.
 *
 * The RPC and OpenAPI protocols are not interchangeable: an `RPCLink` client
 * sends `{"json": ...}` envelopes that only the RPC codec can decode, while
 * `OpenAPIHandler` matches by HTTP method and path. Both handlers share the
 * same router, so the OpenAPI surface documents exactly what the app serves.
 */
export const openAPIHandler = new OpenAPIHandler(router, {
  plugins: [
    new CORSHandlerPlugin({
      allowHeaders: ["Content-Disposition"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    }),
    new RequestHeadersHandlerPlugin(),
    new ResponseHeadersHandlerPlugin(),
    new OpenAPIReferenceHandlerPlugin({
      spec: generateOpenAPISpecs,
      specPath: "/spec.json",
      docsPath: "/docs",
      docsTitle: "Vane API",
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error("[oRPC Error]", error);
    }),
  ],
});
