# TanStack Start 导入边界规范

本文档记录 Vane console 当前的 client/server 导入边界。历史上这里曾是一份 `application/` 目录拆分设计稿；当前代码已经收敛为 `server/` + `infra/sqlite/repositories/` + `@vane/core` 共享契约，旧设计稿不再作为执行依据。

适用范围：`apps/console/src`。产品范围以 `docs/prd/self-hosted-alert-hub-mvp.md` 为准；后端依赖组装以 `docs/architecture/application-container.md` 为准；朴素分层决策见 `docs/adr/0004-console-plain-layered-structure.md`。

---

## 1. 核心规则

1. **默认不加 import-protection marker。** 普通 `.ts` / `.tsx` 文件默认保持 environment-neutral。
2. **只在模块自身直接触碰环境专属 API 时加 marker。** Server 侧包括 `node:*`、SQLite driver、filesystem、`process.env` / secret config、Better Auth server runtime；client 侧包括 `window`、`document`、`navigator`、`localStorage`、DOM。
3. **不因为目录名或转手 import 加 marker。** 一个模块只是概念上属于服务端，或只是 import 了另一个 server module，不自动加 `server-only`。TanStack Start build 会在 marked module 或 `node:*` 进入 client-safe import chain 时失败。
4. **共享契约放在 `@vane/core` 或 feature `model/*`。** Command schema、DTO、查询过滤器、表单值、展示模型和纯函数应保持 env-neutral。
5. **server function 是 RPC boundary。** `*.functions.ts` 可以被 route、feature query/mutation 和 client-safe code 导入；其中的 handler 只在服务端执行。

---

## 2. 当前目录分类

| 文件内容 | 位置 | import protection |
| --- | --- | --- |
| 共享 schema、command type、DTO、route rule、operation projection | `packages/core/src/<module>/` | 不加；必须 env-neutral |
| feature query/mutation/form/search/view model | `apps/console/src/features/*/{api,model}` | 不加；不得导入 `#/server/*` implementation 或 `#/infra/*` |
| route file、loader、layout、薄页面入口 | `apps/console/src/routes/*` | 不加；loader 通过 feature queryOptions 取数 |
| server function RPC 定义 | `apps/console/src/server/functions/*.functions.ts` | 通常不加 |
| server function middleware | `apps/console/src/middlewares/*.middleware.ts` | 通常不加；server callback 内可调用 runtime |
| per-capability service | `apps/console/src/server/<capability>/*.service.ts` | 仅当自身直接触碰 env-specific API 时才加 |
| service option/result 类型 | `apps/console/src/server/<capability>/*.service.types.ts` | 不加；必须保持 env-neutral 或只 import type |
| application container | `apps/console/src/server/runtime/container.ts` | 加；直接 import Better Auth、env、SQLite |
| request context | `apps/console/src/server/runtime/request-context.ts` | 当前不加；直接使用 TanStack server headers 和 container accessor，只能从 server path 调用 |
| dashboard session/auth 错误类型 | `apps/console/src/server/runtime/dashboard-session.ts` | 不加；纯后端类型/错误 |
| SQLite connection/migration/context | `apps/console/src/infra/sqlite/{connection,migrate,context}.ts` | 直接触碰 driver/Node API 的模块加 |
| SQLite Kysely schema types | `apps/console/src/infra/sqlite/schema.ts` | 不加；纯类型 |
| SQLite repository/store/codecs/errors/types | `apps/console/src/infra/sqlite/**` | 默认不加；但前端仍不得导入 `#/infra/*` |
| Better Auth server config / owner bootstrap | `apps/console/src/lib/*auth*.ts` | 直接触碰 Better Auth/env/secret/server plugin 时加 |
| browser-only implementation | `*.client.ts(x)` 或 `client-only` | 直接使用浏览器 API 时加 |

判断标准：shared by default，server/client only by direct dependency。如果只是因为同文件混了共享 schema/type 和 server implementation 才需要 marker，应拆文件，把共享部分移到 `@vane/core` 或 feature `model/*`。

---

## 3. Server Function 导入规则

`*.functions.ts` 是浏览器进入服务端能力的默认 RPC 门面。静态 imports 可以包括：

- `@tanstack/react-start`。
- `@vane/core` command schema / DTO / enum schema。
- `#/middlewares/*` function middleware。
- 只在 `.handler(...)` 内调用的窄 `#/server/runtime/*` accessor，例如 `getApplicationContainer()` 或 `requireDashboardRequestContext()`。

禁止或需要极谨慎的静态 imports：

- 不导入 `#/infra/*`。
- 不导入 server capability service implementation，例如 `#/server/sources/source.service.ts`。
- 不导入 `#/lib/auth.server.ts`、Better Auth server config、SQLite driver、filesystem 或 `node:*`。
- 不在 module 初始化阶段调用 runtime/container、打开数据库、读取 secret 或创建 service。

当前允许 `auth.functions.ts` 静态 import `getApplicationContainer()` 和 `requireDashboardRequestContext()`，因为它只在 handler 内调用它们，并依赖 TanStack Start 的 server function boundary 与 import protection 验证不会把 runtime implementation 打入浏览器 bundle。public session probe 必须捕获 auth error 并返回 nullable state。

Private dashboard server functions 应优先使用 `requireDashboardContextMiddleware`：

```ts
export const createSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateSourceCommandSchema)
  .handler(async ({ data, context }) => {
    return (await context.dashboardRequest.container.createSourceService()).createSource(data);
  });
```

---

## 4. Route / Feature 导入规则

Route files 只拥有 URL concern：

- route path/layout。
- `validateSearch` / `loaderDeps`。
- `loader` 预取 feature `queryOptions`。
- `beforeLoad` 的 UX guard。
- 渲染 feature page 或 shell。

Route、feature UI、feature model、feature api 不得直接导入：

- `#/infra/*`。
- `#/server/runtime/container.ts`。
- `#/server/*/*.service.ts`。
- SQLite repository/store/driver。
- env secret、Better Auth server runtime、filesystem。

Feature 的 `api/*.queries.ts` / `api/*.mutations.ts` 可以导入 `#/server/functions/*.functions.ts`，并封装 query key、queryOptions、mutation 和 invalidation。UI 组件优先导入 feature api，不散落 server function 调用。

---

## 5. 共享契约

跨 client/server 的 command schema、input validator、DTO 和投影类型放在 `@vane/core`：

- `packages/core/src/configuration/configuration-commands.ts`：Source/Destination/Route/Settings/TOML import/export command schema。
- `packages/core/src/operations/operations.ts`：Events/Deliveries list/detail DTO、worker health/run result projection。
- 既有 Source、Destination、Route、Delivery、Event schema 分别放在 `packages/core/src/<module>/`。

`@vane/core` 必须保持 env-neutral，不得导入：

- `node:*`。
- `#/server/*` 或 `#/infra/*`。
- TanStack Start import-protected modules。
- `.server` / `.client` modules。

仅后端消费的类型不需要放进 core。例如 dashboard session 类型和 dashboard auth 错误在 `apps/console/src/server/runtime/dashboard-session.ts`。

---

## 6. Dashboard Auth 与 Webhook Auth

Dashboard auth 和 webhook auth 是两条边界：

- Dashboard server functions 使用 Better Auth session，通过 `requireDashboardRequestContext()` 检查 owner/admin。
- Public auth probes 可以直接调用 request context 并捕获认证错误。
- Webhook API routes 使用 Source token 或 Vane 侧额外共享密钥；它们不读取 browser dashboard session。

`server/runtime/dashboard-auth.ts` 已删除。session 类型和错误类在 `dashboard-session.ts`，鉴权逻辑在 `request-context.ts`。

---

## 7. 验收标准

变更 server function、route loader、feature query、service 或 repository 后，至少确认：

- `@vane/core` 和 feature `model/*` 没有导入 `#/server/*`、`#/infra/*`、`node:*`、`.server` / `.client` 模块。
- route loader 没有直接打开 SQLite、访问 container 或读取 secret。
- dashboard server function 有服务端 auth check。
- webhook API route 不依赖 dashboard session。
- server function 返回 safe DTO，不返回 row、token hash、destination secret、raw sensitive config 或 database handle。
- 相关 package-scoped `fmt:check`、`lint`、`test` 通过；触碰 import boundary 时跑 `pnpm --filter @vane/console build`。

---

## 参考

- TanStack Start Import Protection: <https://tanstack.com/start/latest/docs/framework/react/guide/import-protection>
- TanStack Start Code Execution Patterns: <https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns>
- TanStack Start Server Functions: <https://tanstack.com/start/latest/docs/framework/react/guide/server-functions>
