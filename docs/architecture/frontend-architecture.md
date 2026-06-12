# 前端架构（TanStack Start Console）

本文档定义 Vane console 的前端分层规则。目标不是抽象地描述 React 项目，而是为当前
TanStack Start 单体应用提供可执行的迁移方向：**route-first + feature modules + server
function boundary + query cache + shadcn primitives**。

适用范围：`apps/console/src/`。产品范围、领域语言和 MVP 约束以
`docs/prd/self-hosted-alert-hub-mvp.md` 为准；后端依赖组装以
`docs/architecture/application-container.md` 为准；SQLite 持久化边界以
`docs/architecture/sqlite-store.md` 为准。

---

## 1. 当前状态与迁移目标

`apps/console/src/routes/index.tsx` 当前是待拆分的 dashboard mega-route。它同时承担了根
URL、dashboard session 检查、配置与历史数据加载、Sources / Routes / Destinations 表单、
Events / Deliveries 表格、详情面板、TOML 导入导出、worker 操作、复制 webhook URL、状态
提示等职责。这个文件可以作为迁移前的功能清单，但不能继续作为新增前端代码的组织范例。

迁移后的 console 应保持 TanStack Start 的 route-first 形状：

1. `routes` 决定 URL、layout、search params、loader、beforeLoad 和薄渲染入口。
2. `features` 按业务对象纵切 Sources、Routes、Destinations、Events、Deliveries。
3. `application` 是 server function 与服务端 use case 边界。
4. `integrations` 封装 TanStack Query、TanStack Router、Better Auth 的项目适配。
5. `components/ui` 只保留 shadcn primitives，不知道 Vane 的领域。
6. `infra` 是 SQLite 与 server-only 基础设施，前端代码不可导入。

---

## 2. 目录职责

推荐目标结构：

```txt
apps/console/src/
  routes/
    __root.tsx
    login.tsx
    _dashboard.tsx
    _dashboard.index.tsx
    _dashboard.sources.tsx
    _dashboard.routes.tsx
    _dashboard.destinations.tsx
    _dashboard.events.tsx
    _dashboard.events.$eventId.tsx
    _dashboard.deliveries.tsx
    _dashboard.deliveries.$deliveryId.tsx
    api/
  app/
    shell/
      dashboard-shell.tsx
      dashboard-sidebar.tsx
      dashboard-header.tsx
      dashboard-user-menu.tsx
  features/
    sources/
      model.ts
      queries.ts
      mutations.ts
      source-form.tsx
      sources-table.tsx
    routes/
      model.ts
      queries.ts
      mutations.ts
      route-form.tsx
      routes-table.tsx
    destinations/
    events/
    deliveries/
  components/
    ui/
  integrations/
    tanstack-query/
    tanstack-router/
    better-auth/
  application/
  infra/
```

### `routes`

`routes` 是 URL 和路由生命周期层，只负责：

- 定义 URL 层级、index/detail route、dashboard layout route。
- 用 `validateSearch` 校验 URL search params，再把它们转成 feature query 所需的 typed
  filters、pagination、selected tab 等输入。
- 用 `loaderDeps` 明确 loader 依赖哪些 search params 或 route params。
- 用 `loader` 预取 route 级数据，但只通过 feature 暴露的 `queryOptions` 或 server
  functions 间接取数。
- 用 `beforeLoad` 做导航体验相关的 guard，例如未登录时提前跳到 `/login`。
- 渲染薄入口：把 loader/search/params 交给 feature screen 或 app shell，不在 route 文件里写
  大型表单、表格、详情面板和业务状态机。

`routes` 不直接导入 `#/infra/*`、`#/application/runtime/container.ts`、SQLite store、仓储、
worker、secret helper 或任何 server-only 基础设施。route 文件可以导入 server functions 和
feature 的 `queryOptions`，但不能越过这些边界去读持久化层。

### `features`

`features` 按 Vane 的产品对象纵切。MVP 第一批 feature 是：

- `features/sources`：Source summary/detail DTO、source query keys、list/detail
  `queryOptions`、create/update/disable/rotate-token mutations、Source 表单、Sources 表格、
  webhook URL 展示与复制 UI。
- `features/routes`：Route rule form model、query/mutation、规则摘要、启停、Routes 表格与
  表单。这里的 Routes 指 Vane 的告警路由规则，不是 TanStack Router 文件路由。
- `features/destinations`：Destination form model、preview/test mutations、secret-safe
  config DTO、Destinations 表格、测试结果与预览 UI。
- `features/events`：Events filters、query keys、列表/详情 query、normalized fields 展示、
  raw debug data 的脱敏展示、route match 表格。
- `features/deliveries`：Deliveries filters、列表/详情 query、retry/run worker mutations、
  attempts 表格、状态 badge、失败信息展示。

每个 feature 可以拥有自己的 `model.ts`、`queries.ts`、`mutations.ts`、UI 组件和测试。feature
层可以组合 shadcn primitives、TanStack Form、TanStack Table、TanStack Query hooks，也可以调
server functions；但它不能导入 `infra`、SQLite store、application container 或 server-only
runtime。需要服务端数据时，feature 通过自己的 query/mutation 文件集中调用 server functions。

### `app/shell`

`app/shell` 承担 dashboard 的稳定应用外壳：

- dashboard layout。
- sidebar / primary nav。
- header / breadcrumb / page actions slot。
- user menu 与 session summary。
- 全局 loading、error、empty shell 状态。

shell 可以知道“这是 Vane console 的 dashboard”，可以展示 Sources、Routes、Destinations、
Events、Deliveries 导航项，但不实现这些 feature 的表单、表格、loader 和 mutations。
`routes/_dashboard.tsx` 应主要挂载 shell、执行 dashboard UX guard，并渲染子路由 outlet。

### `components/ui`

`components/ui` 只存放 shadcn primitives 和项目从 shadcn registry 接管的原子组件，例如
`Button`、`Field`、`Input`、`NativeSelect`、`Table`、`Badge`、`Skeleton`、`Alert`、`Tabs`、
`Dialog`、`Sheet`、`Drawer`。

这一层必须保持领域无知：

- 不出现 Source、Destination、Delivery、Event、Route 等 Vane 领域词。
- 不调用 server functions、TanStack Query hooks、TanStack Router hooks。
- 不放业务 badge、业务表格、业务空状态或业务 form model。
- 不读取 auth session、SQLite、env、secret 或 raw payload。

领域 UI 属于 `features/*` 或 `app/shell`。例如 `DeliveryStateBadge` 应在
`features/deliveries`，不是 `components/ui`。

### `integrations`

`integrations` 是第三方库的项目适配层：

- `integrations/tanstack-query`：创建 QueryClient、默认 `staleTime` / retry / error 策略、
  query key helper、SSR hydration 约定。
- `integrations/tanstack-router`：router context 类型、route context helper、搜索参数序列化或
  route guard helper。
- `integrations/better-auth`：auth client、session 查询适配、登录/退出客户端边界。

这里放“Vane 如何使用某个库”的 glue code，不放 Sources/Routes/Destinations 的领域逻辑，也不
直接读写 SQLite。库升级或 API 变化优先在 `integrations` 消化，feature 层只使用稳定的项目级
helper。

### `application`

`application` 是服务端应用边界，继续承接已有文档里的职责：

- TanStack Start server functions。
- server use cases / services，例如 configuration、intake、operations、delivery worker。
- application container 与 request context。
- dashboard auth、webhook request context、TOML portability 等服务端编排。

server functions 是浏览器进入服务端业务能力的默认边界。它们负责 schema validation、认证、
建立 request context、调用 use case、返回 secret-safe DTO。新增 dashboard 数据读写不要绕过
server functions 直接从 client/route loader 访问 store。

### `infra`

`infra` 是 server-only 基础设施。当前主要是 SQLite：

- SQLite connection、migrations、repositories、store。
- filesystem、database handle、migration internals。
- 未来若有 server-only transport、secret storage，也属于这里。

`infra` 不为前端提供导入面。任何出现在 client bundle、route loader serialized data、query
data 或 feature UI 中的数据，都必须先经过 `application` 投影成安全 DTO。

---

## 3. Loader、Server Functions 与 Query Cache

Vane console 的数据流固定为：

```txt
route validateSearch/params
  -> feature queryOptions
  -> TanStack Query cache
  -> application server function
  -> service/use case
  -> infra SQLite / provider registry / destination registry
```

route loader 的职责是把 URL 状态转成 query 输入，并通过 QueryClient
`ensureQueryData(queryOptions(...))` 预取需要的数据。loader 不直接读
`openSqliteStore()`、`getApplicationContainer()`、repositories、worker runner 或任何
server-only infra 模块。

查询规则：

- 每个 feature 维护自己的 query key factory，key 必须是数组、可序列化，并包含影响结果的
  filters、pagination、id 等变量。
- 列表与详情拆成不同 query key，例如 `["events", "list", filters]` 与
  `["events", "detail", eventId]`。
- route loader 使用 feature `queryOptions` 保持 SSR/预取/客户端 hook 同源。
- mutation 成功后由 feature mutation 做定向 invalidation，不在 route 文件里散落
  `router.invalidate()` 作为主要刷新机制。
- 非缓存型一次性动作，例如复制文本、打开详情面板本地状态，可以留在组件本地；改变服务端状态
  的动作必须走 mutation/server function。

server function 规则：

- 所有输入用 schema 校验。
- 每个 dashboard server function 都重新建立 dashboard request context 并验证 session/角色。
- 每个 webhook API route 都用 Source token 或 provider secret 认证，不依赖 dashboard session。
- 返回值是 client-safe DTO，不返回 repository row、raw secret config、database object 或
  service 实例。

---

## 4. Dashboard 授权边界

dashboard route 的 `beforeLoad` 可以存在，但它只是 UX guard：提前发现没有 session 的用户，
减少页面闪烁，并把用户导航到 `/login`。

真实授权必须发生在服务端边界内：

- dashboard server functions 内调用 dashboard request context，确认 Better Auth session 与
  owner/admin 权限。
- 触碰 user-owned data、runtime config、Source/Destination/Route/Event/Delivery 的 API route
  必须在 handler 内鉴权。
- webhook intake API route 用 Source token 或 provider secret 鉴权，不能因为 dashboard
  `beforeLoad` 已经保护了 UI 就跳过服务端认证。

原因很简单：`beforeLoad` 保护的是浏览器导航体验，不保护 server function URL、API route、
脚本调用、过期 hydration data 或绕过 UI 的请求。

---

## 5. 敏感数据投影规则

以下内容永远不能进入 client DTO、route loader data、TanStack Query data、route context、
client component props、TOML 默认导出或浏览器日志：

- Source token 原文。
- `tokenHash`。
- provider signing secret。
- Destination webhook URL 中的 secret 部分。
- Destination signing secret、access token、password、private key。
- raw sensitive config。
- Better Auth secret、session token、password hash。
- SQLite database handle、filesystem path、migration/runtime internals。
- 未脱敏的 raw headers 与 raw payload 中的常见敏感字段。

可以进入客户端的是明确投影后的安全信息：

- Source/Destination/Route summary。
- 是否已配置 secret 的布尔状态或 `masked` 标记。
- 新建或轮换 Source token 后的一次性 token notice。该 notice 只在用户明确触发的响应中展示，
  不写入 query cache，不放进 loader data，不通过长期可重放的 route data 传递。
- normalized Event fields、Delivery state、attempt metadata。
- 脱敏后的 raw debug view，且只在 detail/debug UI 中展示。

测试应覆盖“server function 返回值不包含 token hash、destination secret、raw sensitive
config”这类边界。

---

## 6. UI 组合规则

Vane 是重复使用的 SRE 运维工具，前端默认选择密集、冷静、可扫描的界面：

- 列表页优先表格、过滤器、分页、行操作、详情页或 drawer。
- Sources、Routes、Destinations 的启停、删除、测试、轮换 token 等动作必须显式且可复核。
- Events、Deliveries 优先展示 normalized fields、状态、时间、失败原因、attempts 和 route
  match 信息。
- 表单行为由 TanStack Form 管理；shadcn `FieldGroup`、`Field`、`FieldLabel`、
  `FieldDescription`、`FieldSet`、`FieldLegend` 管结构与可访问性。
- 表格行为由 TanStack Table 管理；shadcn `Table`、`Button`、`Input`、`DropdownMenu`、
  `Checkbox`、`Badge`、`Skeleton`、`Empty` 管视觉结构。
- 不为 dashboard 做 marketing hero、大卡片堆叠或装饰性图表。首页可以是 operational summary，
  但应由 feature 数据投影组成，而不是把所有业务 UI 塞回 `index.tsx`。

---

## 7. 从 `index.tsx` 拆分的顺序

建议按风险从低到高迁移：

1. 抽出 `app/shell`：把 dashboard layout、导航、header、user menu 从 root index route 移走。
2. 抽出纯展示组件：将 `StateBadge`、`DeliveryStateBadge`、`JsonBlock` 等移动到对应
   feature，不改变数据流。
3. 抽出 form model 与 UI：把当前 `routes/-source-form.ts`、`-destination-form.ts`、
   `-route-form.ts` 迁移到 `features/*`，让 route 文件只引用 feature screen。
4. 建立 feature `queries.ts` 与 `mutations.ts`：把 `listConfigurationFn`、`listOperationsFn`、
   detail、preview、test、retry 等调用集中到 feature query/mutation 层。
5. 把根 dashboard 拆成 file routes：Sources、Routes、Destinations、Events、Deliveries
   拥有各自 URL、search validation、loaderDeps、loader 和 screen。
6. 将 loader 改为 Query cache 预取：route loader 只调用 feature `queryOptions`，组件用同一组
   query options 读取缓存。
7. 为敏感数据边界补测试：尤其是 Source token rotation、Destination config、Event raw debug
   data、Delivery detail。

每一步都应保持现有业务行为不变。迁移完成后，`routes/index.tsx` 应只剩 dashboard index 的薄
入口，或者被 `_dashboard.index.tsx` 取代。

---

## 8. 守护性测试与检查

前端架构迁移至少需要这些测试或静态检查方向：

- route search params 的 schema validation：非法 severity/status/deliveryState 不进入 query。
- route loader 使用 feature `queryOptions`，不直接导入 `infra`、store、container。
- dashboard server functions 与 API routes 在服务端重新鉴权。
- feature query data 不包含 Source token、`tokenHash`、Destination secret、raw sensitive
  config。
- shadcn primitives 保持领域无知；业务 badge/table/form 不放进 `components/ui`。
- Events/Deliveries 的过滤、分页、详情 query key 包含影响结果的变量。
- mutation 成功后定向 invalidation，而不是依赖整页 reload。

这些检查是为了让后续迁移可以小步推进，同时保住 Vane 最重要的产品质量：用户能信任它收到
了什么、如何归一化、为何路由、发给了哪里、失败后如何重试，并且 secrets 没有被前端泄漏。
