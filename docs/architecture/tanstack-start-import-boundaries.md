# TanStack Start 导入边界重构设计

本文档设计一次小步重构：把 Vane console 中过度耦合的 server-only 文件拆成更清晰的
共享契约、RPC 门面和服务端执行层。目标不是削弱安全边界，而是让文件组织更贴近
TanStack Start 的运行模型，减少因为导入链被 import protection 拦截而导致的重构阻力。

适用范围：`apps/console/src`。不改变产品行为、不改变认证模型、不改变 SQLite-first 单进程
架构。

---

## 当前落地状态

截至 2026-06-16，第一批低风险重构已经落地：

- 新增 `apps/console/src/application/contracts/configuration-commands.ts`，承载
  configuration server functions 与 `ConfigurationService` 共同使用的 command schemas 和
  command types。
- `application/functions/configuration.functions.ts` 改为静态导入 shared contract，不再为了
  validator schema 静态导入 server-only service implementation。
- `application/services/configuration.ts` 继续保持 server-only，只负责业务实现，并从 shared
  contract 导入 validators/types。
- `application/functions/auth.functions.ts` 不再静态导入 application runtime；公共 auth 探测
  server functions 在 handler 内动态导入 `container.ts` 或 `request-context.ts`。
- 具体导入错误交给 TanStack Start import protection 在编译期暴露；仓库只保留现有
  `frontend-boundaries.test.ts` 的大边界守护，不额外维护一套静态 import 解析器。
- `AGENTS.md` 已记录这条规范，后续新增 server function contract 时按相同模式组织。

---

## 1. 背景

TanStack Start 里有三类不同的代码：

1. **共享代码。** 普通 `.ts` / `.tsx` 文件默认可以被服务端和客户端导入。这里适合放 schema、
   DTO、纯函数、格式化 helper、表单 model、query key 输入类型等。
2. **RPC 门面。** `*.functions.ts` 通过 `createServerFn` 定义 server function。它可以被
   route loader、feature api、client component 间接导入；handler 内部逻辑只在服务端执行，
   客户端构建会得到 RPC stub。
3. **执行环境专属代码。** 触碰 SQLite、filesystem、Node API、server env、secrets、Better Auth
   server adapter、request headers 或浏览器 API 的模块，需要 import protection。

现在仓库里 `server-only` 使用偏宽。一些文件既导出可共享的 schema/type，又包含
server-only 实现。例如：

- `application/services/configuration.ts` 同时导出 command schemas、command types 和
  `ConfigurationService`，并且文件顶部标记 `server-only`。
- `application/functions/configuration.functions.ts` 为了使用 validator schema，静态导入
  `application/services/configuration.ts`。
- `application/functions/auth.functions.ts` 静态导入 application container 和 request context。

这些代码当前能工作，但会让后续组织 feature、query、form model 或 server function 时变得紧：
一个本来纯共享的 schema 只要和 service implementation 放在同一个 server-only 文件里，就会拖累
导入链。

---

## 2. 目标

1. **共享优先。** 输入 schema、DTO 类型、表单值、查询过滤器、展示模型、纯业务规则等默认保持
   environment-neutral。只有导入了环境特定 API 或转手导入环境特定模块，才声明 server-only /
   client-only。
2. **server function 保持薄入口。** `*.functions.ts` 只静态导入 TanStack Start、
   middleware 和共享契约；服务端执行依赖在 handler 或 server middleware 内获得。
3. **import protection 按依赖触发。** SQLite、container、request context、auth server、
   worker、secret resolution、Node API、filesystem 和浏览器 API 继续使用 import protection。
4. **依赖编译期 import protection。** 不额外维护一套复杂静态 import 解析器；如果
   client-safe 入口误导入 server-only/client-only 模块，TanStack Start 构建应直接报错。
5. **分阶段可回滚。** 每一步保持行为不变，优先移动契约，再调整导入，再收敛 marker。

---

## 3. 非目标

- 不把 SQLite store、application container 或 request context 暴露给 route/feature/UI。
- 不把 dashboard auth 和 webhook auth 合并。
- 不引入新的 DI 容器、全局 client state、REST management API 或独立 worker 服务。
- 不为了减少 `server-only` 数量而移除真正需要保护的模块。
- 不在这次重构里改变 Sources、Routes、Destinations、Events、Deliveries 的 UI 行为。

---

## 4. 目标分层

推荐把 `application` 内部拆成四类文件：

```txt
application/
  contracts/
    configuration-commands.ts     # zod command schemas + command types
    operations-queries.ts         # operations input schemas/types, 如需要
    auth-dtos.ts                  # dashboard session/bootstrap DTO, 如需要
  functions/
    configuration.functions.ts    # client-safe RPC 门面
    operations.functions.ts
    auth.functions.ts
    dashboard-context.middleware.ts
  services/
    configuration.ts              # 当前因 crypto/SQLite/secret refs 保持 server-only
    intake.ts
    delivery-worker.ts
  runtime/
    container.ts                  # server-only composition root
    request-context.ts            # server-only request context
```

数据流保持不变：

```txt
route validateSearch/params
  -> feature queryOptions / mutations
  -> application *.functions.ts
  -> environment-neutral helpers or server services/use cases
  -> infra SQLite / provider registry / destination registry
```

关键变化是：`feature` 和 `*.functions.ts` 能导入 environment-neutral 的 shared contract、
model、helper 或服务模块；不能在静态导入链中引入 import-protected module、`.server` /
`.client` module、`node:*`、`infra/*`、`application/runtime/*` 或 auth server。

---

## 5. 文件分类规则

| 文件内容 | 推荐位置 | import protection |
| --- | --- | --- |
| Zod input schema、command type、filter type、DTO type | `application/contracts/*` 或 feature `model/*` | 不加 |
| query key factory、queryOptions、mutation hook | feature `api/*` | 不加 |
| `createServerFn` RPC 定义 | `application/functions/*.functions.ts` | 不加 |
| server function middleware，且只在 `.server(...)` 内动态导入 runtime | `application/functions/*middleware.ts` | 不加 |
| service/use case implementation | `application/services/*` | 只有导入 env-specific API/module 时才加 |
| application container、request context、dashboard auth | `application/runtime/*` | 加 `server-only` |
| SQLite connection、migration、repository、store | `infra/sqlite/*` | 加 `server-only`，纯错误类/纯类型除外 |
| Better Auth server config / owner bootstrap | `lib/*` 或 `integrations/better-auth/*` | 加 `server-only` |
| browser-only adapter，例如 auth client、CodeMirror impl | `.client.ts(x)` 或 `client-only` | 加 client protection |

判断标准：shared by default，server/client only by dependency。不要因为文件在
`application/services` 这类目录里就自动加 `server-only`；如果删除 import protection 后该文件
仍然会导入 SQLite、Node API、runtime container、request context、secrets 或浏览器 API，它才应该
留在环境专属层。如果只是因为同文件里混了 schema/type 才变得 server-only，就拆文件。

---

## 6. 第一批重构候选

### 6.1 Configuration command contracts

现状：

```txt
configuration.functions.ts
  -> application/services/configuration.ts
       -> server-only
       -> node:crypto
       -> config portability
       -> SqliteStore type
```

目标：

```txt
configuration.functions.ts
  -> application/contracts/configuration-commands.ts
  -> dashboard-context.middleware.ts

application/services/configuration.ts
  -> application/contracts/configuration-commands.ts
  -> server-only implementation dependencies
```

迁移内容：

- 新建 `application/contracts/configuration-commands.ts`。
- 移动这些 schema 和 type：
  - `CreateSourceCommandSchema`
  - `UpdateSourceCommandSchema`
  - `RotateSourceTokenCommandSchema`
  - `CreateDestinationCommandSchema`
  - `UpdateDestinationCommandSchema`
  - `TestDestinationCommandSchema`
  - `PreviewDestinationCommandSchema`
  - `PreviewDestinationDraftCommandSchema`
  - `PreviewDestinationUpdateCommandSchema`
  - `ExportConfigurationCommandSchema`
  - `ImportConfigurationCommandSchema`
  - `UpdateAppSettingsCommandSchema`
  - `CreateRouteCommandSchema`
  - `UpdateRouteCommandSchema`
- `ConfigurationService` 从 contract 文件导入 schema/type。
- `configuration.functions.ts` 从 contract 文件导入 validator。

收益：

- `configuration.functions.ts` 不再静态导入 server-only service implementation。
- command schema 可被 feature form/model 测试复用，而不会拖入 crypto、SQLite、secret 逻辑。
- 后续 Sources/Destinations/Routes 的表单 model 可以和 server function validator 对齐。

### 6.2 Auth server functions 延迟 runtime import

现状：

```ts
import { getApplicationContainer } from "#/application/runtime/container.ts";
import { requireDashboardRequestContext } from "#/application/runtime/request-context.ts";
```

目标：

- `auth.functions.ts` 静态只导入 `createServerFn` 和共享 DTO/schema。
- `getDashboardSessionFn` handler 内动态导入 `request-context.ts`。
- `getAuthBootstrapFn` handler 内动态导入 `container.ts`。

收益：

- `auth.functions.ts` 更像纯 RPC 门面。
- 与 `dashboard-context.middleware.ts` 的模式一致。
- 降低 auth feature query 导入 server-only runtime 的风险。

### 6.3 Operations input contracts

现状：

- `operations.functions.ts` 里的 list/detail/run worker input schema 都在 functions 文件内部。

这个没有明显泄漏风险，可以暂缓。若后续 Events/Deliveries feature 需要共享过滤器 schema，可再拆到
`application/contracts/operations-queries.ts` 或 feature `operations/model`。

### 6.4 SQLite 纯叶子文件

`infra/sqlite/errors.ts` 和 `infra/sqlite/types.ts` 当前没有 `server-only`，这是合理的。
`infra/sqlite/codecs.ts` 虽然多为纯函数，但属于 SQLite 物理表示 helper，且导入 SQLite 错误类；
可以先不动。不要为了减少 marker 数量而让 `infra/sqlite/*` 成为前端可用接口。

---

## 7. 建议迁移顺序

第一轮只做低风险拆分：

1. 新建 `application/contracts/configuration-commands.ts`，移动 configuration command schemas/types。
2. 更新 `ConfigurationService` 和 `configuration.functions.ts` 的导入。
3. 将 `auth.functions.ts` 的 runtime 静态导入改为 handler 内动态导入。
4. 跑 `pnpm --filter @vane/console test`。
5. 跑 `pnpm --filter @vane/console lint`。

第二轮再收敛边界：

1. 明确禁止 `features/*` 非 `api` 文件导入 `application/functions/*`，并禁止它们导入任何
   environment-specific module。普通 environment-neutral model/helper 可按所有权规则复用。
2. 明确允许 `application/contracts/*` 被 feature/model/api 导入。
3. 依赖 TanStack Start import protection 暴露 `*.functions.ts` 静态导入链里的 env-specific
   误导入，不额外维护自定义静态 import 解析测试。

第三轮再评估 marker 数量：

1. 只检查是否存在“纯 contract 被迫 server-only”的文件。
2. 不把 `infra/sqlite` 的实现模块变成公共共享模块。
3. 如果某个 `server-only` 文件需要给前端复用 type，优先把 type 上移到 contract/core，而不是
   移除 marker。

---

## 8. 风险与应对

| 风险 | 应对 |
| --- | --- |
| 移动 schema 导致 import 路径变更较多 | 第一轮只移动 configuration command schema，测试覆盖后再扩展 |
| contract 文件不小心导入 server-only module | 由 TanStack Start import protection 在 client-safe 调用链进入构建时暴露 |
| server function handler 内动态 import 影响可读性 | 仅对 runtime/service 依赖使用；validator/schema 仍静态导入 |
| 误以为 `beforeLoad` 或 client route guard 能替代服务端鉴权 | 保持 server function middleware/request context 鉴权不变 |
| 为减少 marker 暴露 SQLite 类型给 feature | 通过 `frontend-boundaries.test.ts` 继续禁止 `#/infra/` |

---

## 9. 验收标准

完成第一轮后，应满足：

- `configuration.functions.ts` 不再从 `application/services/configuration.ts` 导入 schema。
- `application/services/configuration.ts` 仍然是 server-only，并继续拥有业务实现。
- `auth.functions.ts` 不再静态导入 `application/runtime/container.ts` 或
  `application/runtime/request-context.ts`。
- 所有 dashboard server functions 仍然在服务端重新建立 dashboard request context 或执行等价鉴权。
- feature UI/model/query 文件仍然不能导入 `infra`、runtime container、request context 或 auth server。
- 测试和 lint 通过。

完成后续轮次后，应满足：

- 新增 command/query/filter schema 默认先放在 contract/model 文件，而不是 service implementation。
- `*.functions.ts` 文件的静态导入链保持 client-safe；误导入由 TanStack Start 编译期保护暴露。
- 真正处理 secret、SQLite、filesystem、Node API 的文件仍然有 import protection。

---

## 10. 推荐决策

建议采用“**共享契约 + 薄 RPC 门面 + server-only 执行层**”作为 Vane TanStack Start 的默认组织
方式。

这不是把 Vane 做成“client/server 不分”的项目，而是把边界放在更准确的位置：

- shared contract 解决组织和复用；
- server function 解决浏览器到服务端的调用；
- server-only execution layer 解决安全和运行时隔离；
- TanStack Start import protection 负责发现环境导入错误，仓库规范负责让组织方式更顺手。

如果这个方向通过评审，第一批代码重构应从 configuration command contracts 和 auth functions
runtime import 收敛开始。

---

## 参考

- TanStack Start Import Protection:
  <https://tanstack.com/start/latest/docs/framework/react/guide/import-protection>
- TanStack Start Code Execution Patterns:
  <https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns>
- TanStack Start Server Functions:
  <https://tanstack.com/start/latest/docs/framework/react/guide/server-functions>
