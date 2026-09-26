# oRPC API 层（contract / router / handler）

本文档定义 Vane 在当前 TanStack Start 单体应用中的客户端 ↔ 服务端调用方式。

结论先说：**Vane 不做前后端分离**。console 仍然是 TanStack Start 全栈应用，路由、SSR、
server entry、SQLite、worker 都在同一个进程、同一个部署单元里。变化只在“浏览器如何调用
服务端能力”这一层：原来的 TanStack Start server function（`createServerFn`）换成 **oRPC
contract + router**，让契约集中在一处、类型端到端推导，并顺带得到一个可生成的 OpenAPI 面。

适用范围：`packages/api`、`apps/console/src/{lib,server/orpc,routes/api}`。产品范围以
`docs/prd/self-hosted-alert-hub-mvp.md` 为准；后端分层与服务/repository 职责见
`docs/architecture/application-container.md`；导入边界见
`docs/architecture/tanstack-start-import-boundaries.md`。

---

## 1. 为什么是 oRPC

server function 能跑通全栈调用，但契约是“按文件散落”的：每个 `*.functions.ts` 自己声明
input validator 和返回类型，客户端靠 `useServerFn` 绑定，跨文件复用 DTO 只能靠约定。

oRPC 把契约变成一等公民：

- **一份 contract 定义整个 API 形状**（namespace、input、output、error code），放在
  `packages/api`，client 与 server 都从同一处推导类型。
- **implementer 必须实现 contract 的全部分支**，router 少写或多写一个 procedure 会在类型层
  报错，契约不会悄悄漂移。
- **同一套 router 可以挂不同 protocol**：浏览器走 RPC protocol，外部调用方走 OpenAPI，
  不需要维护两份定义。
- **TanStack Query 集成是官方的**：`orpc.<ns>.<proc>.queryOptions()` / `mutationOptions()`
  直接产出可用的 query options，feature 层不用自己包一层。

代价是要维护一个 workspace 包和一层 protocol 知识。以 Vane 的 procedure 数量（9 个 namespace）
和长期维护目标看，这个代价是划算的。

## 2. 分层与数据流

```txt
packages/api                     契约层（env-neutral，无 server-only 代码）
  src/contract/*                 按能力一个文件：oc 定义 input/output/error
  src/schemas/*                  该能力独有的 output DTO
  src/errors/*                   跨能力共享的 error map（dashboardAuth、notFound）
  src/client.ts                  RPCClient 类型（RouterContractClient）

apps/console/src/server/orpc     实现层（server-only）
  os.ts                          implement(contract).use(requestId())，全 console 共用
  router.ts                      根 router：os.router({ auth, sources, ... })
  features/<capability>/router.ts  每个 procedure 一行：取 service、调用、返回 DTO
  middlewares/*.ts                requestId、requireDashboard
  handler.ts                     RPCHandler（/api/rpc）与 OpenAPIHandler（/api/openapi）

apps/console/src/lib/orpc.ts     同构客户端入口（isomorphic）
  server: createRouterClient(router)  直接进程内调用，不经过 HTTP
  client: RPCLink('/api/rpc') + createORPCClient
  export const orpc = createTanstackQueryUtils(rpcClient)

apps/console/src/features/*/api  feature 边界（client-safe）
  *.queries.ts / *.mutations.ts  只依赖 #/lib/orpc，不 import #/server/*
```

一次 dashboard 请求的完整路径：

```txt
route loader / 组件
  -> feature api（orpc.sources.list.queryOptions(...)）
     -> SSR 阶段：#/lib/orpc 的 server 分支 createRouterClient，进程内直调 router
     -> 浏览器阶段：RPCLink POST /api/rpc/sources/list
        -> routes/api/rpc/$.ts（server handler）
           -> rpcHandler.handle(request, { prefix: "/api/rpc" })
              -> middleware 链：requestId -> requireDashboard
                 -> procedure handler
                    -> context.dashboardRequest.container.createSourceService()
                       -> SourceService -> SQLite repository
```

关键点：**service、repository、worker 的组织方式没有变**。oRPC 只替换了“入口层”的实现方式，
`server/<capability>/*.service.ts` 与 `infra/sqlite/repositories/<module>/` 完全沿用既有约定。

## 3. 契约层（`packages/api`）

契约包只放 env-neutral 的内容：Zod schema、`oc` 契约定义、error map、以及供客户端使用的
类型。它不 import `node:*`、SQLite、`better-auth`、console 的 `#/server/*`，因此可以被浏览器
bundle 安全引用。

一个能力的契约长这样：

```ts
// packages/api/src/contract/sources.ts
export const sources = {
  list: oc.meta(openapi({ method: "GET" })).errors(dashboardAuth.error).output(SourceListOutputSchema),

  create: oc
    .meta(openapi({ method: "POST" }))
    .input(CreateSourceCommandSchema)
    .errors(dashboardAuth.error)
    .output(SourceTokenOutputSchema),
};
```

约定：

- **namespace 按业务能力划分**，不按 HTTP method 或文件名划分。当前为 `auth`、`destinations`、
  `health`、`i18n`、`operations`、`portability`、`routes`、`settings`、`sources`。
- **input / output 一律带 schema**。command schema 直接复用 `@vane/core` 中既有的
  `CreateSourceCommandSchema` 等定义，不在契约层复制。
- **只在契约层声明 error code**。dashboard 面统一 `.errors(dashboardAuth.error)`，声明
  `UNAUTHORIZED` / `FORBIDDEN`；客户端的错误处理因此可以只认这几个 code。
- **`openapi({ method })` 只影响 OpenAPI 面**。RPC protocol 固定用 POST，method 元数据是给
  `/api/openapi` 用的；因此浏览器侧永远发 POST，用 GET 探测 `/api/rpc/*` 返回 404 是预期行为。
- **output 必须是 safe DTO**。契约是类型层的“返回什么”，不要在 output schema 里放 token hash、
  destination secret、raw sensitive payload。

`src/schemas/*` 放当前能力独有的 output DTO；能被多个能力复用的 schema 仍然回到 `@vane/core`。

## 4. 实现层（`apps/console/src/server/orpc`）

### 4.1 共享 implementer

`os.ts` 是整个 console 唯一的 implementer：

```ts
export const os = implement(contract).use(requestId());
```

- `implement(contract)` 把契约绑定成可实现对象，`os.sources.list` 这样的路径由契约形状推导，
  procedure 名字写错即类型错误。
- `requestId()` 挂在根上，所有 procedure 都拿到 `context.requestId`，并回写 `x-request-id`。
  同一个请求（浏览器 `/api/rpc` 或进程内 `createRouterClient`）拿到的是同一个 id，和 HTTP
  访问日志里的 request id 一致。
- **不要在 `os` 上挂全局 auth middleware**。鉴权按 procedure 显式声明，见 4.3。

### 4.2 根 router 与 feature router

`router.ts` 只做组合，一个 namespace 一行：

```ts
export const router = os.router({
  auth: authRouter,
  sources: sourcesRouter,
  // ...
});
```

`features/<capability>/router.ts` 是薄适配层，一个 procedure 一行，职责是“取依赖、调用 service、
返回业务方法的结果”，不做编排：

```ts
export const sourcesRouter = os.sources.router({
  list: os.sources.list.use(requireDashboard()).handler(async ({ context }) =>
    (await context.dashboardRequest!.container.createSourceService()).listSources(),
  ),
});
```

约束：

- **handler 里不写业务逻辑**。校验、鉴权、取 service、调用、返回，仅此而已。真正的规则在
  `*.service.ts`。
- **handler 里不直接碰 SQLite、filesystem 或 env**。要走 `container.create*Service()`。
- **能力长大了再拆**。单个 `router.ts` 变大时，把一个 procedure 一个文件地拆到
  `features/<capability>/procedures/`，而不是提前铺目录。

### 4.3 middleware

两个 middleware，都在 `server/orpc/middlewares/`：

- `request-id.ts`：用 `middlewares/request-logging.middleware.ts` 的 `resolveRequestId()` 解析
  request id（复用请求中间件已归一化的 `x-request-id` / `x-correlation-id`），写入
  `context.requestId` 与 `x-request-id` 响应头。挂在根 `os` 上。
- `require-dashboard.ts`：从 `context.reqHeaders` 解析 dashboard session，成功时把
  `dashboardRequest`（含 `container`）注入 context，失败时把 `DashboardAuthError` /
  `DashboardAuthorizationError` 映射成 oRPC 的 `UNAUTHORIZED` / `FORBIDDEN`。

`requireDashboard()` **按 procedure 挂**，不挂在 router 或根 `os` 上：

```ts
list: os.sources.list.use(requireDashboard()).handler(...)
```

原因：auth、i18n、health 这些 public procedure 不能继承 dashboard 的 error map，而 oRPC 的
error map 是随中间件链声明的。per-procedure 挂载让“这个 procedure 要不要登录”在契约里就能
一眼读出（看它是否声明了 `dashboardAuth.error`），`server-orpc-auth.test.ts` 正是按这个不变量
做全量断言的。

middleware 从 `context.reqHeaders` 取 header，而不是直接调用 `getRequestHeaders()`：
浏览器请求由 `RequestHeadersHandlerPlugin` 注入 header bag，进程内调用由 `#/lib/orpc.ts` 显式传入。
两种 transport 因此共享同一段鉴权代码。context 类型通过 `declare module "@orpc/server"` 扩展
`DefaultInitialContext` 收窄（见 `middlewares/*.ts` 与 `apps/console/src/rpc.d.ts`）。

### 4.4 handler 与路由挂载

`handler.ts` 导出两个 handler，共用同一个 router：

| handler | 路由 | protocol | 用途 |
| ------- | ---- | -------- | ---- |
| `rpcHandler`（`RPCHandler`） | `/api/rpc/*` | oRPC RPC | 浏览器客户端 `RPCLink`；dashboard 的主通道 |
| `openAPIHandler`（`OpenAPIHandler`） | `/api/openapi/*` | OpenAPI | 外部调用方、`/spec.json`、`/docs` 参考页 |

两个 handler 都额外挂了 `CORSHandlerPlugin`、`RequestHeadersHandlerPlugin`、
`ResponseHeadersHandlerPlugin`，并用 `onError` 记录 `[oRPC Error]`。

路由文件是标准的 TanStack Start server route，把 HTTP method 全部转给 handler：

```ts
// apps/console/src/routes/api/rpc/$.ts
export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      GET: async ({ request }) => await handleRpc(request),
      POST: async ({ request }) => await handleRpc(request),
      // PUT / DELETE / PATCH 同理
    },
  },
});
```

`handle(request, { prefix })` 返回 `{ matched, response }`；未匹配时返回 404。前缀必须与挂载点
一致，否则 path 解析错位。

**RPC 与 OpenAPI 两个 protocol 不能混用**：`RPCLink` 发的是 `{"json": ...}` envelope，只有 RPC
codec 能解；`OpenAPIHandler` 按 HTTP method + path 匹配。所以 dashboard 走 `/api/rpc`，参考页走
`/api/openapi`，两者共享同一份 router，OpenAPI 文档描述的就是实际提供的能力。

**webhook intake 不在 oRPC 面上。** `/api/sources/$sourceId/webhook` 仍是一个普通 server route：
它面向第三方监控系统，鉴权靠 Source token，payload 形状由 provider parser 决定，和 dashboard
session 是两条不同的鉴权路径。把它塞进 oRPC 只会让契约承载两种无关的认证模型。

## 5. 客户端（`#/lib/orpc`）

`apps/console/src/lib/orpc.ts` 是唯一的客户端入口，用 `createIsomorphicFn()` 给出两个分支：

```ts
const getRpcClient = createIsomorphicFn()
  .server((): RPCClient =>
    createRouterClient(router, {
      context: async () => ({ reqHeaders: getRequestHeaders() }),
    }),
  )
  .client((): RPCClient => {
    const link = new RPCLink({ url: "/api/rpc" });
    return createORPCClient(link);
  });

export const rpcClient: RPCClient = getRpcClient();
export const orpc = createTanstackQueryUtils(rpcClient);
```

要点：

- **SSR 不走 HTTP**。server 分支用 `createRouterClient` 直接进程内调用 router，省掉一次自请求，
  也没有 base URL、cookie 转发的麻烦。但它绕过了 handler 的 `RequestHeadersHandlerPlugin`，
  所以必须显式传 `context.reqHeaders = getRequestHeaders()`——`requireDashboard()` 依赖它。
- **浏览器分支固定 POST**。`RPCLink` 默认使用 POST，`openapi({ method: "GET" })` 的元数据只影响
  OpenAPI 面。
- **feature 层只认 `orpc`**。`orpc.sources.list.queryOptions({ queryKey, input })` 与
  `orpc.sources.create.call(input)` 是 feature `api/*` 的两个基本动作。

`#/lib/orpc.ts` 静态 import `#/server/orpc/router`，而 router 链最终会到 SQLite。这是安全的，
因为 `createIsomorphicFn` 的 server 分支在 build 时被剥离：产物里 client bundle 不含
`better-sqlite3` / `kysely`。这条约束由 console 生产构建把关，属于必须自觉维护的边界——
**不要在 client-safe 代码里出现 feature 的 `#/server/*` 直接导入**，只经由 `#/lib/orpc`。

## 6. feature 层用法

query 侧保留原有的 query key 工厂，只是把执行换成 oRPC：

```ts
export const sourceQueries = {
  list: (filters: SourceFilters) =>
    orpc.sources.list.queryOptions({
      queryKey: sourceKeys.list(filters),
      input: filters,
    }),
};
```

mutation 侧暴露脱离的 procedure 引用，供 hook 直接消费：

```ts
export const sourceMutations = {
  create: orpc.sources.create.call,
  update: orpc.sources.update.call,
};
```

`call` 是绑定在实例上的方法，可以安全地脱离对象传递（不需要 `this`）。UI 调用点因此少了一层
`{ data: ... }` 包装：`await sourceMutations.create(input)`。

查询状态仍然归 TanStack Query，URL 状态仍然归 TanStack Router，表单归 TanStack Form，
这些约定不变。

## 7. 验证方式

- `apps/console/src/server/orpc/server-orpc-auth.test.ts`：断言每个 router 的 procedure 清单与
  契约一致，且 private procedure 都挂了 `requireDashboard()`、public 的都没挂；同时确认 webhook
  路由不在 oRPC 面上。
- `pnpm --filter @vane/console exec tsc --noEmit`：契约与实现是否对齐由类型检查兜底。
- `pnpm --filter @vane/console build`：验证 import protection 仍然成立，client bundle 不含 SQLite。
- 手工验证：登录后访问 dashboard 各页面，确认浏览器发出 `POST /api/rpc/<ns>/<proc>` 且无 console
  报错；`GET /api/openapi/spec.json` 应返回生成的 spec。

## 8. 参考

- oRPC 官方文档：<https://orpc.unnoq.com/>
- TanStack Query 集成：<https://orpc.unnoq.com/docs/integrations/tanstack-query>
- OpenAPI 集成：<https://orpc.unnoq.com/docs/openapi/integrations/implement-contract-first-server>
- 仓库内 `orpc`、`orpc-contract`、`orpc-openapi` skills（`.agents/skills/`）。
