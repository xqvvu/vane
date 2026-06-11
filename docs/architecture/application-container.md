# 应用容器与请求上下文（`apps/console/src/application`）

本文档定义 Vane 在 TanStack Start 单体应用中的后端依赖组装方式。目标是让
server functions、API routes、Better Auth、SQLite store 和 in-process delivery
worker 都从同一个 server-only composition root 获取默认依赖，同时保持业务服务可以在
测试中用 fake store / fake registry 直接构造。

Vane 的 MVP 约束不变：单进程、SQLite-first、server-only 后端运行时；不引入 NestJS
风格 decorator IoC，也不引入第三方 DI 容器。

---

## 1. 设计原则

1. **composition root 只存在于 `apps/console`。** `@vane/core`、`@vane/providers`、
   `@vane/destinations` 继续只暴露领域类型、provider parser、destination sender 和
   registry，不依赖 console 的运行时。
2. **长期依赖放在 app container。** SQLite store、provider registry、destination
   registry、Better Auth 使用的 SQLite database、delivery worker runner 这类进程级
   对象由 application container 统一创建和缓存。
3. **请求级信息放在 request context。** dashboard session/current user、request id、
   当前请求时间、headers 等每次请求不同的数据只在 request context 中存在，不能塞进全局
   container。
4. **入口层保持薄。** server functions 和 API routes 只做输入校验、建立 context、从
   container 获取 service/use case、调用业务方法、映射响应。
5. **服务仍然显式可注入。** `ConfigurationService`、`WebhookIntakeService`、
   `DeliveryWorker` 等业务服务继续通过构造函数接收 `store`、registry、clock、send
   context；测试可以不经过默认 container。

---

## 2. App Container 负责什么

`apps/console/src/application/runtime/container.server.ts` 是默认运行时的 composition root。它只
在服务端导入，负责组装这些长期依赖：

| 依赖 | 生命周期 | 说明 |
| --- | --- | --- |
| `SqliteStore` | 进程级懒加载 | 默认使用 `env.VANE_DATABASE_PATH`，应用显式 migrations。承载 Sources、Routes、Destinations、Events、Deliveries、settings 等仓储。 |
| `ProviderRegistry` | 进程级懒加载 | 默认来自 `createDefaultProviderRegistry()`，用于把 Source payload 解析为 normalized Event。 |
| `DestinationRegistry` | 进程级懒加载 | 默认来自 `createDefaultDestinationRegistry()`，用于校验 Destination config、preview 和 send。 |
| Better Auth database | 进程级懒加载 | 使用与 SQLite store 同一套连接工厂和 migrations。Better Auth 拥有 auth 表读写，Vane 不把 auth 表包装成业务仓储。 |
| `DeliveryWorkerRunner` | 进程级单例 | 由 `DeliveryWorker` + store + destination registry + env worker 配置组装，维持 MVP 的 in-process SQLite-backed delivery worker。 |
| service factory | 每次调用新建 | `createConfigurationService()`、`createWebhookIntakeService()`、`createDeliveryWorker()` 返回显式注入依赖的服务实例。 |

推荐目录结构：

```txt
apps/console/src/application/
  runtime/
    container.server.ts       # 默认 composition root，缓存长期依赖
    request-context.server.ts # 每次请求创建 dashboard/webhook context
    dashboard-auth.ts         # dashboard session 与角色检查
  functions/
    *.functions.ts            # TanStack Start server functions，入口薄
  services/
    configuration.ts          # 业务服务：Sources/Routes/Destinations/settings
    intake.ts                 # 业务服务：Webhook -> Event -> Deliveries
    delivery-worker.ts        # 业务服务：认领并执行 Deliveries
  portability/
    config-portability.ts     # TOML import/export 与 secret refs
  http/
    webhook-request.ts        # 外部 webhook request 解析

apps/console/src/routes/api/
  auth/$.ts                   # Better Auth HTTP handler
  sources/$sourceId/webhook.ts # 外部 webhook API route
```

示例：

```ts
// server function handler 内部
const context = await requireDashboardRequestContext();
const service = context.container.createConfigurationService();

return service.createSource(data);
```

```ts
// webhook API route 内部
const context = createWebhookRequestContext({ request });
const service = context.container.createWebhookIntakeService();

return service.acceptWebhook({
  sourceId,
  token: context.sourceToken,
  headers: context.headersRecord,
  payload,
  receivedAt: context.now,
});
```

---

## 3. Request Context 负责什么

`apps/console/src/application/runtime/request-context.server.ts` 每次请求创建，不缓存到全局对象。它
负责请求级信息：

| 字段 | 说明 |
| --- | --- |
| `container` | 当前请求使用的 application container。默认是进程级 container，测试可传入 fake container。 |
| `headers` / `headersRecord` | 当前请求 headers。server functions 默认从 `getRequestHeaders()` 读取；API routes 从 `Request` 读取。 |
| `requestId` | 从 `x-request-id` / `x-correlation-id` 读取；没有时保持 `null`。 |
| `now` | 当前请求时间的 ISO 字符串，可在测试中注入 clock。 |
| `dashboardSession` / `currentUser` | 仅 dashboard context 拥有，来自 Better Auth session，并要求 `owner` 或 `admin`。 |
| `sourceToken` / `hasProviderSecret` | 仅 webhook context 拥有，来自 Source token 或 provider secret header。 |

Dashboard context 与 webhook context 是两条不同认证边界：

- Dashboard server functions 调用 `requireDashboardRequestContext()`，它内部使用
  Better Auth session，并拒绝非 owner/admin 用户。
- Webhook API route 调用 `createWebhookRequestContext()`，只读取 Source token /
  provider secret，不读取 dashboard session。上游监控系统不需要也不应该拥有浏览器
  session。

---

## 4. 入口如何获取依赖

### Server functions

Dashboard server functions 的固定形状：

```ts
export const createSourceFn = createServerFn({ method: "POST" })
  .validator(CreateSourceCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().createSource(data);
  });
```

这个入口只负责 schema validation、dashboard auth、取 service、调用业务方法。Sources、
Routes、Destinations 的配置逻辑留在 `ConfigurationService`。

### API routes

Webhook API route 的固定形状：

```ts
export async function handleSourceWebhookPost(input: {
  sourceId: string;
  request: Request;
}): Promise<Response> {
  const context = createWebhookRequestContext({ request: input.request });

  // 读取和限制 raw JSON payload 后，调用 WebhookIntakeService。
}
```

Webhook intake 认证是 Source token / provider secret；它不会调用
`requireDashboardRequestContext()`，也不会读取 Better Auth session。

### Worker

Delivery worker 是进程级后台循环，默认通过 container 组装：

```ts
const runner = getApplicationContainer().ensureDeliveryWorkerRunner();
```

手动触发 worker（例如 dashboard 的 run-once server function）不直接 `new
DeliveryWorker`，而是：

```ts
const context = await requireDashboardRequestContext();

return context.container.createDeliveryWorker().runOnce({ limit });
```

---

## 5. 禁止暴露到客户端的内容

以下内容只能留在 server-only 模块、SQLite、Better Auth adapter 或服务端响应前的局部变量
里，不能出现在 client components、route loader serialized data、query data 或 server
function 返回值中：

- Source token 原文、`tokenHash`、provider signing secret。
- Destination secret、webhook URL secret、签名密钥、raw sensitive config。
- Better Auth secret、session token、password hash、auth database handle。
- SQLite database handle、filesystem path、migration/runtime internals。
- 未脱敏 raw headers/raw payload 中的敏感字段。

可以返回给客户端的是受控投影，例如 Source/Destination summary、Route definition、Event
normalized fields、Delivery state、脱敏后的 response body 或 raw debug data。

---

## 6. 为什么不使用 decorator IoC

Vane 的后端是 TanStack Start 单体应用，MVP 需要的是清晰的 server-only 组装边界，而不是
框架级对象生命周期管理。Decorator IoC 或第三方 DI 容器会带来几个问题：

- 需要运行时 metadata、decorator 编译约定或额外包，增加自托管部署和调试成本。
- 隐藏构造依赖，反而让 Sources、Routes、Destinations、Events、Deliveries 的服务边界不
  如构造函数参数直观。
- 容易把 request session、request id、locale 等请求级状态错误注册成 singleton。
- 对当前规模过度设计：Vane 只有一个进程、一个 SQLite store、少量 registry 和几个业务
  service factory。

推荐模式是普通 TypeScript object/factory DI：container 负责默认依赖，request context
负责请求级依赖，业务服务保持显式构造函数。这足够支持测试替身、未来扩展 provider /
destination，也不会牺牲 TanStack Start 的 client/server 分离。

---

## 7. 测试守护

应保持这些测试方向：

- container factory 可以用 fake store / fake registry 构造服务，证明业务服务没有写死全局
  singleton。
- dashboard server functions 必须通过 dashboard request context 认证。
- webhook route 不导入也不调用 dashboard request context，Source token / provider secret
  认证路径保持独立。
- client components、route loaders、serialized data 不导入 `*.server.ts` container，也不返回
  token hash、Destination secret、raw sensitive config。
