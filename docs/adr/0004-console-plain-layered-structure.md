# Console 采用朴素分层结构，回退领域/契约层词汇

状态：接受。本 ADR 在 `0003-console-server-capability-architecture.md` 之后，**取代**其中关于"顶层 `contracts/` 目录"和"`ConfigurationService` 聚合门面"的两项决定；保留 0003 的其余结论（顶层运行环境边界优先、`server/` 按能力分目录、dynamic import 只作边界适配、跨边界 DTO 单一定义）。

## 背景

0003 落地后，维护者反馈整套结构"太像领域模型 / 整洁架构 / 六边形架构，看不懂"。复核代码发现：Vane 实际上**并没有**使用领域模型——`packages/core` 只是 Zod schema + 纯函数，`*Service` 是贫血服务，`infra/sqlite/*` 是仓储。真正落地的形状本就是 `route/server function → service → repository` 的朴素分层，只是被一层"能力/契约/门面"的词汇和额外目录包裹，显得比实际复杂。

唯一不可省的"复杂"是 client/server 打包边界：这是 TanStack Start 单体应用的硬约束，不是领域建模带来的。

## 决定

把结构讲成、也整理成维护者熟悉的朴素分层，去掉听起来高级但不增信息的包装。

1. **命名对齐传统分层**：服务端业务逻辑文件统一为 `*.service.ts`（如 `server/sources/source.service.ts`），SQLite 持久化文件统一为 `infra/sqlite/*.repository.ts`（如 `source.repository.ts`）。`*.functions.ts` 保留不变，作为 controller 入口——TanStack Start 的文件路由名是框架固定的，不强行改成 `*.route.ts`。

2. **共享契约折进 `@vane/core`，删除 console 级 `contracts/` 目录**：client 与 server 都要用的 schema 必须 env-neutral。`@vane/core` 本就是共享 schema 的家（`SourceSummary`、`RouteDefinition` 等），因此把 console 的 command schema（`configuration-commands.ts`）和操作 DTO（`operations.ts`）一并放入，与既有 schema 作伴，边界天然安全。只有后端消费的 dashboard session 类型不进共享包，就近放在 `server/runtime/dashboard-session.ts`。0003 设立的顶层 `contracts/` 目录随之删除。

3. **移除 `ConfigurationService` 聚合门面**：0003 为零改动迁移而保留的门面在此收尾移除。container 直接按能力暴露 `createSourceService` / `createDestinationService` / `createRouteService` / `createAppSettingsService` / `createConfigPortabilityService` 工厂，server function 各自调用对应 service，少一层间接。

4. **文档去术语化**：`AGENTS.md` 与 `frontend-architecture.md` 用 controller（server function）/ service / repository + client/server 边界 的朴素语言描述后端，不再使用 "composition root / factory DI / use case / 聚合门面" 等词。明确声明 Vane 不使用领域模型 / 整洁架构 / 六边形架构。

## 不变的部分

- 顶层运行环境边界仍是第一边界，由 `frontend-boundaries.test.ts` 守护；`forbiddenImports` 的目录前缀（`#/server/*`、`#/infra/*` 等）不受文件改名影响。
- `server/` 仍按能力分目录，与 `features/<同名>` 左右对称。
- dynamic import 仍只作边界适配；跨边界 DTO 仍单一定义、共享引用（现在共享点是 `@vane/core`）。

## 迁移

行为不变的小步迁移，每步通过 `pnpm -r test` 与 `pnpm --filter @vane/console build`：

1. 折叠契约：command schema 与 operations DTO 迁入 `@vane/core`，dashboard session 类型迁入 `server/runtime`，删除 `contracts/`。
2. 移除 `ConfigurationService` 门面，container 改为按能力暴露工厂，重接 server function 与测试。
3. 重命名为 `*.service.ts` / `*.repository.ts`，更新全部 import 与边界测试。
4. 重写 `AGENTS.md` / `frontend-architecture.md` 为朴素分层语言，并记录本 ADR。

## 不采用的替代方案

- **保留 0003 的 `contracts/` 目录与门面**：维护者明确反馈这层包装是"看不懂"的来源之一，且门面属于可省的额外间接。
- **真正改成纯 MVC（含 `*.route.ts`）并取消 client/server 边界**：client/server 边界是 TanStack Start 的硬约束，取消它会退回 0003 之前用 dynamic import 压编译错误的老问题；文件路由名也由框架固定，无法改成 `*.route.ts`。
- **引入领域模型 / 整洁 / 六边形**：对 SQLite-first、单进程、自托管的 MVP 属于过度设计，且当前代码本就没有在用。
