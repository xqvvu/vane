import type {
  RequestHeadersHandlerPluginContext,
  ResponseHeadersHandlerPluginContext,
} from "@orpc/server/plugins";

declare module "@orpc/server" {
  /**
   * oRPC injects neither header bag into the context on its own: the request bag
   * comes from `RequestHeadersHandlerPlugin`, the response bag from
   * `ResponseHeadersHandlerPlugin`, and both are registered in
   * `#/server/orpc/handler`. In-process calls through `createRouterClient` skip
   * the handler plugins, so `#/lib/orpc.ts` passes `reqHeaders` explicitly.
   */
  export interface DefaultInitialContext
    extends RequestHeadersHandlerPluginContext, ResponseHeadersHandlerPluginContext {}
}
