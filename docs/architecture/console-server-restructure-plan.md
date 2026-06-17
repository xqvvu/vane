# Console 服务端重构迁移计划

> 后续简化：`docs/adr/0004-console-plain-layered-structure.md` 在本计划之后将 `contracts/` 折入
> `@vane/core`、移除 `ConfigurationService` 门面、并把文件改名为 `*.service.ts` / `*.repository.ts`。
> 本文记录的是 0003 阶段的迁移过程，最终结构以 0004 为准。

本文档是 `docs/adr/0003-console-server-capability-architecture.md` 的落地执行清单。决策依据以
该 ADR 为准；本文只描述**怎么一步步迁、每步改什么文件、怎么验证、在哪里断开提交**。

适用范围：`apps/console/src/`。前端分层规则仍以
`docs/architecture/frontend-architecture.md` 为准，容器与 request context 以
`docs/architecture/application-container.md` 为准，SQLite 边界以
`docs/architecture/sqlite-store.md` 为准。

> 执行状态（2026-06-17）：五步均已落地，行为不变，`pnpm --filter @vane/console test`
> （36 文件 / 163 用例）、`pnpm --filter @vane/providers test`（6 文件 / 19 用例）、
> `pnpm --filter @vane/console build`、lint、fmt:check 全部通过。执行时按计划允许的
> 「子目录粒度可微调」做了两处调整：(1) 配置能力集群统一放在 `server/configuration/`
> （含 source/destination/route/app-settings 服务与 portability），`sources`/`destinations`/
> `routes` 顶层目录承载各自的 capability service 文件；(2) 所有 `*.functions.ts` 与 middleware
> 暂统一放在 `server/functions/`（含 `operations.functions.ts`），未按能力拆分 server function
> 文件——这与 ADR「functions 可后续再按能力拆」一致。

原则：**每一步行为不变（behavior-preserving），独立通过测试，独立提交，随时可停。**
每步结束都跑：

```sh
pnpm --filter @vane/console test
pnpm --filter @vane/providers test
```

并确认 `frontend-boundaries.test.ts` 仍绿。

---

## 0. 目标结构

```txt
apps/console/src/
  contracts/                    # 唯一共享缝：client-safe、env-neutral、纯类型/schema
    source.contract.ts
    destination.contract.ts
    route.contract.ts
    configuration.contract.ts   # 由 application/contracts/configuration-commands.ts 拆/迁而来
    operations.contract.ts      # 收归当前 features/operations/model 里的跨边界 DTO
    auth.contract.ts            # DashboardSession + 两个 Error + GetDashboardSession
    worker.contract.ts          # worker health/run result 投影（如需共享）
  server/                       # 原 application/，server-only
    runtime/                    # container, request-context, dashboard-auth(impl), worker-runner
    sources/                    # source-service.ts + source.functions.ts
    destinations/               # destination-service.ts + destination.functions.ts
    routes/                     # route-service.ts + route.functions.ts
    deliveries/                 # delivery-service, delivery-execution, delivery-worker, operations.functions
    intake/                     # webhook-intake + webhook-request (http)
    config/                     # config-portability + configuration 聚合 fn + app-settings-service
    functions/                  # 跨能力或鉴权类 fn：auth.functions, i18n.functions, dashboard-context.middleware
  features/                     # 不变：client 的 ui/api/model
  infra/                        # 不变：sqlite
```

> 子目录粒度可在执行中微调（例如 `app-settings` 是否独立于 `config`），但顶层
> `contracts/ | server/ | features/ | infra/` 四分法固定。

---

## 1. 拆分 `ConfigurationService`（最高收益，先做）

**现状**：`apps/console/src/application/services/configuration.ts`（约 570 行）单类承载
Source / Destination / Route / AppSettings / TOML 导入导出。

**目标**：按能力拆为多个服务，保留聚合门面，调用方零改动。

步骤：

1. 新建领域服务（暂仍放在 `application/services/`，本步不动目录）：
   - `source-service.ts` ← `createSource` / `updateSource` / `rotateSourceToken` /
     Source 相关 `listConfiguration` 片段所需读取。
   - `destination-service.ts` ← `createDestination` / `updateDestination` /
     `testDestination` / `previewDestination` / `previewDestinationDraft` /
     `previewDestinationUpdate` / `listDestinationCatalog`。
   - `route-service.ts` ← `createRoute` / `updateRoute`。
   - `app-settings-service.ts` ← `updateAppSettings` / settings 读取。
   - `config-portability-service.ts`（或沿用现有 `application/portability/config-portability.ts`）
     ← `exportToml*` / `importToml*` / `listConfiguration` 聚合快照组装。
2. 各服务通过构造函数显式接收依赖（`store` / `providers` / `destinations` /
   `generateSourceToken` 等），与现有 `ConfigurationServiceOptions` 对齐。
3. 把 `ConfigurationService` 改为**聚合门面**：内部持有上述服务实例，原有公开方法逐个委托。
   `container.ts` 的 `createConfigurationService()` 与所有 `*.functions.ts` 保持不变。
4. 迁移测试：`configuration.test.ts`（1356 行）按能力拆成
   `source-service.test.ts` / `destination-service.test.ts` / `route-service.test.ts` /
   `app-settings-service.test.ts` / `config-portability.test.ts`；保留少量门面级集成断言。

**验证**：两个 test filter 全绿；`createConfigurationService().createSource(...)` 等行为与拆分前一致。

**提交边界**：本步一个 commit（或按服务再分多个），不触碰目录结构与 import 路径别名。

---

## 2. 抽出 `contracts/auth.contract.ts`，消除 dashboard-auth 循环 dynamic import

**现状**：`application/runtime/dashboard-auth.ts` 同时定义契约与实现；
`application/runtime/request-context.ts` 静态 import 该文件取契约，于是 `dashboard-auth.ts`
只能 dynamic import 回 `request-context.ts`（见下）。

```36:44:apps/console/src/application/runtime/dashboard-auth.ts
export async function requireDashboardSession() {
  const { requireDashboardRequestContext } =
    await import("#/application/runtime/request-context.ts");
```

步骤：

1. 新建 `apps/console/src/contracts/auth.contract.ts`，迁入 **纯契约**：
   `DashboardSession`、`DashboardAuthError`、`DashboardAuthorizationError`、
   `GetDashboardSession`。该文件不得 import 任何 server-only/runtime 模块。
2. `dashboard-auth.ts` 与 `request-context.ts` 改为从 `#/contracts/auth.contract.ts` 取契约。
3. 由于循环已断开，把 `dashboard-auth.ts` 内对 `request-context.ts` 的
   `await import(...)` 改回**普通 static import**。
4. 同样检查 `container.ts` 对 `DashboardSession` 的 `import type`，改指向 contract 文件。
5. `auth.functions.ts`、`dashboard-context.middleware.ts` 里的 dynamic import **保留**——
   它们是 client-importable 边界文件，dynamic import 是合法的 bundle 隔离手段，不在本步范围。

**验证**：两个 test filter 全绿；确认 `dashboard-auth.ts` 中不再有以"打破循环"为目的的
`await import`。

**提交边界**：本步一个 commit。

---

## 3. 统一 `operations` 契约，消除前后端 DTO 重复

**现状**：`features/operations/model/operation-types.ts` 显式声明 `EventListItem`、
`DeliveryListItem`、`WorkerHealthSnapshot` 等；而 `operations.functions.ts` 的返回形状由
infra store（`store.history.listEvents` 等）推断，二者各写一份，存在漂移风险。

步骤：

1. 新建 `apps/console/src/contracts/operations.contract.ts`，作为这些投影 DTO 的**单一定义**。
2. infra store 的对应返回类型与 server function 返回，引用该契约（或由契约约束）。
3. `features/operations/model/operation-types.ts` 改为从 contract 复用，不再重复声明跨边界形状；
   feature 内纯 UI 派生类型（filter view model 等）仍可留在 model。
4. 同步检查 `features/deliveries`、`features/events` 是否存在同类重复声明，一并收归。

**验证**：两个 test filter 全绿；`operations.functions` 返回类型与 contract 一致（可加一个
类型层断言或 `satisfies`）。

**提交边界**：本步一个 commit。

---

## 4. 物理重组目录：`application/` → `server/`，按能力重排，提升 contracts 到顶层

这是**纯移动 + 改 import 别名**的一步，放在逻辑拆分之后做，风险最低。

文件级映射（迁移后路径）：

| 现有路径 | 目标路径 |
| --- | --- |
| `application/contracts/configuration-commands.ts` | `contracts/configuration.contract.ts`（可按能力再拆 source/destination/route） |
| `application/runtime/container.ts` | `server/runtime/container.ts` |
| `application/runtime/request-context.ts` | `server/runtime/request-context.ts` |
| `application/runtime/dashboard-auth.ts` | `server/runtime/dashboard-auth.ts` |
| `application/runtime/delivery-worker-runner.ts` | `server/runtime/delivery-worker-runner.ts` |
| `application/runtime/store.ts` | `server/runtime/store.ts` |
| `application/services/configuration.ts`（门面） | `server/config/configuration-service.ts` |
| `application/services/source-service.ts`（第 1 步产物） | `server/sources/source-service.ts` |
| `application/services/destination-service.ts` | `server/destinations/destination-service.ts` |
| `application/services/route-service.ts` | `server/routes/route-service.ts` |
| `application/services/app-settings-service.ts` | `server/config/app-settings-service.ts` |
| `application/services/intake.ts` | `server/intake/webhook-intake-service.ts` |
| `application/services/delivery-execution.ts` | `server/deliveries/delivery-execution.ts` |
| `application/services/delivery-worker.ts` | `server/deliveries/delivery-worker.ts` |
| `application/http/webhook-request.ts` | `server/intake/webhook-request.ts` |
| `application/portability/config-portability.ts` | `server/config/config-portability.ts` |
| `application/functions/configuration.functions.ts` | 按能力拆/分发到 `server/{sources,destinations,routes,config}/*.functions.ts` |
| `application/functions/operations.functions.ts` | `server/deliveries/operations.functions.ts` |
| `application/functions/auth.functions.ts` | `server/functions/auth.functions.ts` |
| `application/functions/i18n.functions.ts` | `server/functions/i18n.functions.ts` |
| `application/functions/dashboard-context.middleware.ts` | `server/functions/dashboard-context.middleware.ts` |
| `application/boundaries/frontend-boundaries.test.ts` | `server/boundaries/frontend-boundaries.test.ts`（见第 5 步） |

执行要点：

1. 用编辑器/脚本批量移动文件，并把所有 `#/application/...` import 别名改为
   `#/server/...` 或 `#/contracts/...`。`*.test.ts` 同步移动。
2. `configuration.functions.ts` 可在本步拆分为按能力的 `*.functions.ts`，也可先整体迁入
   `server/config/` 后续再拆——优先保证行为不变。
3. 检查 `routes/`、`features/`、`shell/` 中对 `#/application/contracts/*` 的引用，全部改为
   `#/contracts/*`。
4. 检查 `routes/api/**` 对 webhook intake / request-context 的引用，改为 `#/server/...`。
5. 全局搜索确认无残留 `#/application/` 字样。

**验证**：两个 test filter 全绿；构建/类型检查通过（`pnpm --filter @vane/console` 的 build 或
typecheck 脚本）；手动确认 webhook intake 与 dashboard 登录路径可用（有本地 dev target 时）。

**提交边界**：本步建议一个较大的"move-only"commit，diff 以路径与 import 改动为主，便于 review。

---

## 5. 更新边界守护与文档

1. `frontend-boundaries.test.ts`：
   - `forbiddenImports` 中 `#/application/runtime/container.ts` /
     `#/application/runtime/request-context.ts` 替换为 `#/server/runtime/container.ts` /
     `#/server/runtime/request-context.ts`（或直接禁 `#/server/`）。
   - 第二条用例中 `source.includes("#/application/")` 改为 `#/server/`。
   - 扫描的 client-safe 根集合（`routes`/`features`/`shell`/`components/ui`）不变。
   - 可新增一条：`contracts/*` 不得 import `#/server/`、`#/infra/`、`node:*` 或带 import
     protection 的模块。
   - 可新增一条：`server/*` 不得 import `#/features/`（防反向依赖）。
2. `AGENTS.md`：把"Recommended shape"中的 `application` 行更新为 `server`（server-only，
   按能力组织）与顶层 `contracts`；同步"Server Function Boundary"与"Imports"段中
   `#/application/contracts/*`、`#/application/runtime/*` 的引用。
3. `docs/architecture/frontend-architecture.md`：更新 `application` 小节为 `server` + `contracts`
   （已在该文件追加迁移说明指针）。
4. 本 ADR 与本计划保持为最终事实来源。

**验证**：边界测试覆盖新规则并通过。

**提交边界**：测试与文档可合并为一个 commit，也可拆为"test"与"docs"两个。

---

## 校验清单（每步通用）

- [ ] `pnpm --filter @vane/console test` 通过
- [ ] `pnpm --filter @vane/providers test` 通过
- [ ] `frontend-boundaries.test.ts` 通过
- [ ] 无残留 `#/application/` 引用（仅在第 4 步后要求）
- [ ] server function 调用方未改动行为（第 1–3 步）
- [ ] 敏感数据投影未被削弱：server function 不返回 token hash / destination secret / raw config

## 回滚策略

每步独立提交且行为不变，任意一步出问题可单独 revert 该 commit，不影响前序成果。第 1–3 步即使不
继续做第 4 步的目录搬迁，也已单独带来收益（拆掉上帝服务、去掉循环 dynamic import、消除 DTO
重复）。
