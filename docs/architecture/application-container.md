# 应用容器与请求上下文（`apps/console/src/server/runtime`）

本文档定义 Vane 在 TanStack Start 单体应用中的后端依赖组装方式。当前代码采用朴素分层：server function / API route 作为入口，service 承载业务逻辑，SQLite repository 承载持久化。`server/runtime` 只放跨能力的运行时组装与请求上下文。

Vane 的 MVP 约束不变：单进程、SQLite-first、server-only 后端运行时；不引入 NestJS 风格 decorator IoC，也不引入第三方 DI 容器。

---

## 1. 设计原则

1. **默认运行时只存在于 `apps/console`。** `@vane/core`、`@vane/providers`、`@vane/destinations` 只暴露共享 schema、provider parser、destination sender 和 registry，不依赖 console 的运行时。
2. **业务运行时的长期依赖放在 application container。** SQLite store、provider registry、destination registry、Better Auth database、Better Auth instance、delivery worker runner 由 `server/runtime/container.ts` 懒加载并缓存。LogTape 这类应用级 instrumentation 由 server entry 初始化，不放入 container。
3. **请求级信息放在 request context。** dashboard session/current user、request id、headers、当前请求时间等每次请求不同的数据只在 `server/runtime/request-context.ts` 创建的 context 中存在，不能塞进全局 container。
4. **入口层保持薄。** server functions 和 API routes 只做输入校验、建立 context、从 container 获取 service、调用业务方法、映射 safe DTO。
5. **service 显式可注入。** `SourceService`、`DestinationService`、`RouteService`、`AppSettingsService`、`ConfigPortabilityService`、`WebhookIntakeService`、`DeliveryWorker` 都通过构造函数接收依赖；测试可以不经过默认 container。

---

## 2. Application Container

`apps/console/src/server/runtime/container.ts` 是默认 server-only wiring object。它直接 import Better Auth、env、SQLite connection/store 和默认 registry，因此保留 `import "@tanstack/react-start/server-only";`。

默认 container 使用 ESM module cache 做懒加载：第一次调用 `getApplicationContainer()` 时创建，后续在同一个 server module 实例内复用。不要把 container 挂到 `globalThis`。如果开发模式 HMR 或测试需要释放默认实例，调用 `disposeApplicationContainer()`；它会停止 delivery worker runner，并关闭已打开的 SQLite store / Better Auth database。

| 依赖                   | 生命周期                | 说明                                                                                                                                                                                                                                        |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SqliteStore`          | 默认 container 内懒加载 | 默认使用 `env.VANE_DATABASE_PATH`，应用显式 migrations。承载 Sources、Routes、Destinations、Events、Deliveries、Settings 等仓储。                                                                                                           |
| `ProviderRegistry`     | 默认 container 内懒加载 | 默认来自 `createDefaultProviderRegistry()`，用于把 Source payload 解析为 normalized Event。                                                                                                                                                 |
| `DestinationRegistry`  | 默认 container 内懒加载 | 默认来自 `createDefaultDestinationRegistry()`，用于校验 Destination config、preview 和 send。                                                                                                                                               |
| Better Auth database   | 默认 container 内懒加载 | 使用与 SQLite store 同一套 Kysely-first connection/migration 入口。Better Auth 拥有 auth 表读写，Vane 不把 auth 表包装成业务 repository。                                                                                                   |
| `VaneAuth`             | 默认 container 内懒加载 | Better Auth server runtime，通过 Kysely SQLite adapter 配置连接数据库，包含 HTTP handler 与 `api.getSession(...)`。                                                                                                                         |
| `DeliveryWorkerRunner` | 默认 container 内单例   | 由 `DeliveryWorker` + store + destination registry + env worker 配置组装，维持 MVP 的 in-process SQLite-backed delivery worker。                                                                                                            |
| service factory        | 每次调用新建            | `createSourceService()`、`createDestinationService()`、`createRouteService()`、`createAppSettingsService()`、`createConfigPortabilityService()`、`createWebhookIntakeService()`、`createDeliveryWorker()` 返回显式注入依赖的 service 实例。 |

当前目录形状：

```txt
apps/console/src/server/
  runtime/
    container.ts                 # 默认 server-only wiring object，缓存长期依赖
    request-context.ts           # 每次请求创建 dashboard/webhook context
    dashboard-session.ts         # DashboardSession 与 dashboard auth 错误类型
    delivery-worker-runner.ts    # 进程内 worker interval runner
    logging.ts                   # server-only LogTape 配置与 AsyncLocalStorage
    log-safety.ts                # env-neutral 日志字段与 Error 脱敏
    store.ts                     # 兼容窄 accessor，委托 application container
  functions/
    auth.functions.ts
    configuration.functions.ts
    i18n.functions.ts
    operations.functions.ts
  configuration/
    app-settings.service.ts
    app-settings.service.types.ts
    config-portability.service.ts
    config-portability.service.types.ts
    config-portability.ts
  sources/source.service.ts
  destinations/destination.service.ts
  routes/route.service.ts
  intake/
    intake.service.ts
    webhook-request.ts
  deliveries/
    delivery-worker.service.ts
    delivery-execution.ts
```

Middleware 位于 `apps/console/src/middlewares`：`request-logging.middleware.ts` 是在 `start.ts` 注册的全局 request middleware；`dashboard-context.middleware.ts` 是 client-importable 的 function middleware，内部 server callback 调用 `requireDashboardRequestContext()`。自定义 `start.ts` 同时显式注册 TanStack Start CSRF middleware，不能用 request logging 替换 CSRF。

---

## 3. Request Context

`apps/console/src/server/runtime/request-context.ts` 每次请求创建，不缓存到全局对象。它负责请求级信息：

| 字段                                | 说明                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `container`                         | 当前请求使用的 application container。默认是进程级 container，测试可传入 fake container。                                             |
| `headers` / `headersRecord`         | 当前请求 headers。server functions 默认从 `getRequestHeaders()` 读取；API routes 从 `Request` 读取。                                  |
| `requestId`                         | 全局 request middleware 校验 `x-request-id` / `x-correlation-id`，缺失或无效时生成 UUID；直接构造 context 的测试调用可以保持 `null`。 |
| `now`                               | 当前请求时间的 ISO 字符串，可在测试中注入 clock。                                                                                     |
| `dashboardSession` / `currentUser`  | 仅 dashboard context 拥有，来自 Better Auth session，并要求 `owner` 或 `admin`。                                                      |
| `sourceToken` / `hasProviderSecret` | 仅 webhook context 拥有，来自 Source token 或额外共享密钥 header。                                                                    |

Dashboard context 与 webhook context 是两条不同认证边界：

- Dashboard server functions 使用 `requireDashboardContextMiddleware` 注入 `context.dashboardRequest`。该 middleware 内部调用 `requireDashboardRequestContext()`，使用 Better Auth session，并拒绝非 owner/admin 用户。
- Public auth probes（如 `getDashboardSessionFn`）不能使用会提前抛错的 dashboard middleware；它们可以在 handler 内直接调用 `requireDashboardRequestContext()`，捕获 auth error 后返回 `null`。
- Webhook API route 调用 `createWebhookRequestContext()`，只读取 Source token / 额外共享密钥，不读取 dashboard session。上游监控系统不需要也不应该拥有浏览器 session。

`server/runtime/dashboard-auth.ts` 已删除。session 类型和 auth error 在 `dashboard-session.ts`，实际鉴权逻辑在 `request-context.ts`。

LogTape request context 与 dashboard/webhook auth context 不是同一个对象。前者通过
`AsyncLocalStorage` 只传播 `requestId` 等安全关联字段；后者持有认证所需 headers/token 信息。不要把
`headersRecord`、`sourceToken` 或 session token 复制到日志 context。

---

## 4. 入口如何获取依赖

### Server Functions

Dashboard server functions 的固定形状：

```ts
export const createSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateSourceCommandSchema)
  .handler(async ({ data, context }) => {
    return (await context.dashboardRequest.container.createSourceService()).createSource(data);
  });
```

这个入口只负责 schema validation、通过 middleware 建立 dashboard context、取 service、调用业务方法。Sources、Routes、Destinations、Settings、配置 portability 分别调用 container 暴露的对应 service factory，不再经过单一 `ConfigurationService` 门面。

`*.functions.ts` 是 RPC boundary 文件。它们可以被 route、feature query/mutation 和 client-safe code 导入。静态 imports 可以包含 TanStack Start、`@vane/core` 契约、server function middleware，以及只在 handler 内调用的窄 runtime accessor；不要在 module 初始化阶段调用 runtime/container。

### API Routes

Webhook API route 的固定形状：

```ts
export async function handleSourceWebhookPost(input: {
  sourceId: string;
  request: Request;
}): Promise<Response> {
  const context = createWebhookRequestContext({ request: input.request });
  const service = await context.container.createWebhookIntakeService();

  // 读取和限制 raw JSON payload 后，调用 WebhookIntakeService。
}
```

Webhook intake 认证是 Source token / 额外共享密钥；它不会调用 `requireDashboardRequestContext()`，也不会读取 Better Auth session。

### Worker

Delivery worker 是进程级后台循环，默认通过 container 组装：

```ts
const runner = await getApplicationContainer().ensureDeliveryWorkerRunner();
```

默认 container dispose 时必须停止该 runner。`container.ts` 在支持 HMR 的运行时中注册 `import.meta.hot.dispose(disposeApplicationContainer)`，避免开发模式热替换后遗留旧 interval 和旧 SQLite 连接。

手动触发 worker（例如 dashboard 的 run-once server function）通过 request container 创建临时 worker：

```ts
const worker = await context.dashboardRequest.container.createDeliveryWorker();

return worker.runOnce({ limit });
```

### Logging Runtime

`apps/console/src/server.ts` 在 server entry 启动时配置一次 LogTape。Logging Runtime 不通过
container 暴露 logger，也不加入 service constructor options。Console 内业务模块直接取得分类 logger；
provider/destination adapter 继续只返回稳定结构化结果，不接收 logger。

详细 category、level、request middleware 和 secret-safe 规则见
`docs/architecture/observability.md`。

---

## 5. 禁止暴露到客户端的内容

以下内容只能留在 server-only 模块、SQLite、Better Auth adapter 或服务端响应前的局部变量里，不能出现在 client components、route loader serialized data、query data 或 server function 返回值中：

- Source token 原文、`tokenHash`、provider signing secret。
- Destination secret、webhook URL secret、签名密钥、raw sensitive config。
- Better Auth secret、session token、password hash、auth database handle。
- SQLite database handle、filesystem path、migration/runtime internals。
- 未脱敏 raw headers/raw payload 中的敏感字段。

可以返回给客户端的是受控投影，例如 Source/Destination summary、Route definition、Event normalized fields、Delivery state、脱敏后的 response body 或 raw debug data。

---

## 6. 为什么不使用 decorator IoC

Vane 的后端是 TanStack Start 单体应用，MVP 需要的是清晰的 server-only 组装边界，而不是框架级对象生命周期管理。Decorator IoC 或第三方 DI 容器会带来几个问题：

- 需要运行时 metadata、decorator 编译约定或额外包，增加自托管部署和调试成本。
- 隐藏构造依赖，反而让 Sources、Routes、Destinations、Events、Deliveries 的 service 边界不如构造函数参数直观。
- 容易把 request session、request id、locale 等请求级状态错误注册成 singleton。
- 对当前规模过度设计：Vane 只有一个进程、一个 SQLite store、少量 registry 和几个 service factory。

推荐模式是普通 TypeScript object/factory：container 负责默认长期依赖，request context 负责请求级依赖，业务 service 保持显式构造函数。这足够支持测试替身、未来扩展 provider / destination，也不会牺牲 TanStack Start 的 client/server 分离。

---

## 7. 测试守护

应保持这些测试方向：

- container factory 可以用 fake store / fake registry 构造 service，证明业务 service 没有写死全局 singleton。
- 默认 container 通过 ESM module cache 复用；调用 `disposeApplicationContainer()` 后必须停 worker、关闭已打开的数据库连接，并允许后续请求重建新 container。
- dashboard server functions 必须通过 `requireDashboardContextMiddleware` 或等价的 dashboard request context 认证。
- webhook route 不导入也不调用 dashboard request context，Source token / 额外共享密钥认证路径保持独立。
- client components、route loaders、serialized data 不导入 server-only container，也不返回 token hash、Destination secret、raw sensitive config。
- 全局 request middleware 必须同时保留 CSRF middleware，并证明并发 request context 不串线。
- 运行日志不包含 raw headers/payload/config/response body、credential 或 raw Error；secret-safe intake → delivery 和 worker callback 测试保持通过。
