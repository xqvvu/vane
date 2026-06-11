# SQLite 存储层（`apps/console/src/infra/sqlite`）

本文档详细说明 Vane 的 SQLite 持久化层：它的分层方式、目录结构，以及每个
interface、type、class、函数的职责与签名。

> 适用范围：`apps/console/src/infra/sqlite/`。跨包共享的领域 schema（如
> `SourceSummary`、`DeliveryJob`、`NormalizedEvent`）定义在 `@vane/core`，本层只负责
> 把它们持久化到 SQLite 并读回。

---

## 1. 概述

这一层是应用的**持久化适配器**：对外暴露一个 `SqliteStore`，内部由 6 个仓储
（repository）组成，每个仓储对应一个聚合（aggregate）。所有 SQL、行（row）映射、
事务、编解码都封死在这一层，外部只看到领域类型和仓储接口。

入口只有一个函数：`openSqliteStore()`。

---

## 2. 设计原则

1. **按聚合纵切，而非按技术种类横切。**
   每个聚合（sources / destinations / routes / intake / deliveries / history）是
   一个独立文件，内部自带：Row 类型、Repository 接口、输入/输出 DTO、行↔领域映射
   函数、仓储类。理解一个聚合只需打开一个文件。

2. **校验只发生在真正的边界。**
   只有"跨越序列化/不可信边界"的数据才用 Zod `.parse()`（JSON 列、enum、写入前的
   领域对象）。纯内部契约（Row、输入 DTO、投影）用手写 TypeScript interface，不做
   运行时校验。详见 [§8 校验与编解码边界](#8-校验与编解码边界)。

3. **`server-only` 是分层护栏，不是技术必需。**
   触碰 SQLite/文件系统的模块标记 `server-only`，防止被打进客户端 bundle。纯
   isomorphic 的东西（错误类、通用 JSON 编解码）不加这个标记。

4. **依赖方向单向、无环。**
   见 [§4 分层与依赖方向](#4-分层与依赖方向)。

---

## 3. 文件结构与职责

| 文件 | 角色 | 主要导出 |
| --- | --- | --- |
| `connection.ts` | 基础设施 | `createSqliteDatabase()`、`CreateSqliteDatabaseOptions`、`SqliteDatabase` |
| `transaction.ts` | 基础设施 | `transaction()`（`better-sqlite3` transaction/savepoint 封装） |
| `migrate.ts` | 基础设施 | `migrateSqliteDatabase()`、`readMigrations()` 等 |
| `migrations/*.sql` | 迁移 | 显式、只前进的 schema 迁移 |
| `types.ts` | 共享叶子 | `IsoDateTimeString`、`Page<T>`（零依赖） |
| `errors.ts` | 共享叶子 | `SqliteError`、`SqliteDataIntegrityError`、`RecordNotFoundError` |
| `codecs.ts` | 共享 | SQLite 物理表示助手（布尔、行 cast） |
| `context.ts` | 共享 | `SqliteRepositoryContext`（依赖注入 + 事务入口） |
| `sources.ts` | 聚合 | Source 的 Row/接口/DTO/映射/类 |
| `destinations.ts` | 聚合 | Destination 同上 |
| `routes.ts` | 聚合 | Route 同上 |
| `intake.ts` | 聚合 | Event 录入 |
| `deliveries.ts` | 聚合 | 投递队列：入队/认领/标记/重试/详情 + 去重 + attempt |
| `history.ts` | 聚合 | 跨聚合只读投影（列表/详情） |
| `store.ts` | 组装根 | `SqliteStore`、`SqliteStoreUnitOfWork`、`openSqliteStore()` |

通用的 schema-JSON 编解码（`encodeJson` / `decodeJson` / `encodeSchemaJson` 等）**不在
本层**，而在 `@vane/core` 的 `json.ts`，因为它们是 isomorphic 的。

Better Auth 的表（`user` / `session` / `account` / `verification`）也放在同一套显式
SQLite migrations 里，但不做成 `SqliteStore` 仓储。认证读写由 Better Auth adapter
拥有；Vane 只共享 `better-sqlite3` 连接工厂和迁移入口，避免把外部库的模型泄漏成业务
聚合接口。

---

## 4. 分层与依赖方向

```
types.ts            （叶子，零依赖）
  ▲
errors.ts / codecs.ts / context.ts   （共享基础）
  ▲
sources / destinations / routes / intake   （独立聚合）
  ▲
deliveries          （依赖 sources/destinations/routes/intake）
  ▲
history             （依赖 sources/intake/deliveries）
  ▲
store.ts            （组装根，依赖全部聚合）
```

- `types.ts` 是最底层叶子，谁都能依赖它、它不依赖任何人。
- `store.ts` 是顶层组装根，依赖所有聚合，没人依赖它（除了测试和外部调用方）。
- 聚合之间只有 `deliveries`、`history` 向下依赖其它聚合，方向单一，无循环。

---

## 5. 公共入口

### `openSqliteStore(options?): SqliteStore`

唯一入口。打开数据库、可选执行迁移、构造仓储集，返回 `SqliteStore`。

```ts
export interface OpenSqliteStoreOptions {
  databasePath?: string;            // 默认 connection.ts 里的 data.sqlite；":memory:" 用于测试
  migrate?: boolean;                // 默认 true
  migrationsDir?: string;           // 默认 migrations/
  now?: () => IsoDateTimeString;    // 时间注入（测试用）
  ids?: Partial<{                   // ID 生成器注入（测试用）
    source: () => string;
    destination: () => string;
    route: () => string;
    event: () => string;
    delivery: () => string;
    attempt: () => string;
  }>;
}
```

`now` 和 `ids` 可注入，是为了让测试得到确定性的时间戳和 ID。

### `interface SqliteStore`

对外的存储句柄。继承 `SqliteStoreUnitOfWork`（即直接挂着 6 个仓储），额外提供
schema 版本读取、关闭、事务。

```ts
export interface SqliteStore extends SqliteStoreUnitOfWork {
  readonly schemaVersion: string | null;
  close(): void;
  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => T): T;
}
```

### `interface SqliteStoreUnitOfWork`

一组仓储的集合（工作单元）。`SqliteStore` 本身和 `transaction()` 回调里拿到的
`tx` 都是这个类型，因此事务内外用的是同一套仓储 API。

```ts
export interface SqliteStoreUnitOfWork {
  readonly sources: SourceRepository;
  readonly destinations: DestinationRepository;
  readonly routes: RouteRepository;
  readonly intake: IntakeRepository;
  readonly deliveries: DeliveryRepository;
  readonly history: HistoryRepository;
  readonly settings: SettingsRepository;
}
```

### `class OpenedSqliteStore implements SqliteStore`

`SqliteStore` 的具体实现。构造时接收 `db` 和 `context`，内部用
`createSqliteRepositories(context)` 建好仓储集。`schemaVersion` 从 `schema_migrations`
账本表读取当前已应用的最高版本。`transaction()` 委托给 `context.runInTransaction`。

### `createSqliteRepositories(context): SqliteRepositorySet`

工厂函数：按依赖顺序实例化仓储类并组装成一个对象。`deliveries` 需要
sources/destinations/routes/intake，`history` 需要 sources/intake/deliveries，所以构造
有先后顺序；`settings` 独立读写 `settings` 表，用于应用级配置。

---

## 6. 共享基础

### 6.1 `types.ts`

```ts
export type IsoDateTimeString = string;     // 全层统一的时间字符串表示（ISO 8601）

export interface Page<T> {                  // 游标分页的通用返回
  items: T[];
  nextCursor: string | null;
}
```

### 6.2 `context.ts` — `SqliteRepositoryContext`

所有仓储共享的运行时上下文，承载三件横切关注点：

- `db`：`better-sqlite3` 的同步数据库句柄。
- `now()`：当前时间生成器（默认 `new Date().toISOString()`，可注入）。
- `ids`：`source` / `destination` / `route` / `event` / `delivery` / `attempt`
  六个 ID 生成器（默认 `randomUUID`，可注入）。

并提供**可重入的事务方法**：

```ts
runInTransaction<T>(fn: () => T, ...guard: SyncTransactionGuard<T>): T
```

事务由 `better-sqlite3` 的 `db.transaction(fn).immediate()` 承担：最外层使用
`BEGIN IMMEDIATE`，嵌套调用自动变成 savepoint。这样仓储方法（如
`deliveries.enqueueForEvent` 内部也调用 `runInTransaction`）既能单独用，也能被
`store.transaction()` 包裹复用；如果内层失败并被外层捕获，只回滚内层 savepoint，不会
悄悄保留半段写入。`better-sqlite3` 也会拒绝返回 Promise 的事务回调，避免同步 SQLite
事务被异步代码拆开；`transaction.ts` 还通过 `SyncTransactionGuard<T>` 让业务代码里的
Promise-returning transaction callback 尽量在 TypeScript 编译期暴露出来。

### 6.3 `codecs.ts` — SQLite 物理表示助手

只剩"SQLite 怪癖"相关的纯函数，**不依赖 `@vane/core`**：

```ts
export type SqliteBoolean = 0 | 1;          // SQLite 没有布尔，用 0/1
export type SqliteJsonText = string;        // JSON 列在 SQLite 里是 TEXT

export function toSqliteBoolean(value: boolean): SqliteBoolean
export function fromSqliteBoolean(value: number): boolean   // 非 0/1 抛 SqliteDataIntegrityError

export function rowOrUndefined<Row>(row: unknown): Row | undefined
export function rowAs<Row>(row: unknown): Row
export function rowsAs<Row>(rows: unknown[]): Row[]
```

`rowAs` / `rowsAs` / `rowOrUndefined` 是把 `db` 返回的 `unknown` 断言成具体 Row 类型的
泛型助手（编译期断言，不做运行时校验，详见 §8）。

> 通用 JSON 编解码（`encodeJson` / `decodeJson` / `encodeJsonObject` /
> `decodeJsonObject` / `encodeSchemaJson` / `decodeSchemaJson`）在 `@vane/core` 的
> `json.ts`，各聚合从那里导入。

### 6.4 `errors.ts` — 错误家族

本层专属的错误体系，全部继承自 `SqliteError`，方便上层 `instanceof SqliteError`
一把抓住持久化层的错误：

```ts
export class SqliteError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;            // 子类名自动正确（日志/stack 友好）
  }
}

export class SqliteDataIntegrityError extends SqliteError {}   // 数据完整性/解码不变量

export class RecordNotFoundError extends SqliteError {
  constructor(readonly resource: string, readonly id?: string) {
    super(id ? `${resource} not found: ${id}` : `${resource} not found`);
  }
}
```

- `SqliteDataIntegrityError`：DB 里存了非法值（如布尔列不是 0/1）。属于"不该发生"
  的不变量违例。
- `RecordNotFoundError`：按 ID 取不到记录。带 `resource` / `id` 字段，将来 API 层可以
  `instanceof` 它并映射成 404。

`errors.ts` 不加 `server-only`：错误类是纯 isomorphic 的，上层（含将来的路由 error
boundary）可能需要在任意位置 `instanceof`。

---

## 7. 聚合详解

每个聚合文件的内部结构都一致：**Row 类型 → Repository 接口 → 输入/输出 DTO →
（运行时配置类型）→ 映射函数 → require 守卫 → 仓储类**。下面逐个说明。

### 7.1 `sources.ts`

- **Row**：`SourceRow`（`id` / `name` / `provider` / `token_hash` / `enabled` /
  `config_json` / `created_at` / `updated_at`）。
- **运行时配置**：`SourceRuntimeConfig extends SourceSummary { tokenHash; config }`
  —— 在 `SourceSummary` 之上补充敏感/运行时字段。
- **接口**：

```ts
export interface SourceRepository {
  list(): SourceSummary[];
  listEnabled(): SourceSummary[];
  get(id: string): SourceRuntimeConfig | null;
  findByTokenHash(tokenHash: string): SourceRuntimeConfig | null;
  create(input: CreateSourceInput): SourceSummary;
  update(id: string, input: UpdateSourceInput): SourceSummary;
  setEnabled(id: string, enabled: boolean): SourceSummary;
}
```

- **DTO**：`CreateSourceInput`、`UpdateSourceInput`。
- **映射 / 守卫（导出，供 deliveries/history 复用）**：
  `sourceSummaryFromRow`、`sourceRuntimeFromRow`、`sourceSummaryFromRuntime`、
  `requireSource`。
- **类**：`SqliteSourceRepository`。

### 7.2 `destinations.ts`

- **Row**：`DestinationRow`（含 `config_json`、`secret_refs_json`）。
- **运行时配置**：`DestinationRuntimeConfig extends DestinationSummary { config; secretRefs }`。
- **安全投影**：`destinationMetadataFromRuntime` 从 runtime config 生成 Delivery detail 可展示的
  metadata，只包含 method、header 名称、模板/签名开关、email to/from 等排障信息，不包含
  webhook URL、sign secret、endpoint URL 或 header 值。
- **接口**：`DestinationRepository`（`list` / `listEnabled` / `get` / `create` /
  `update` / `setEnabled`）。
- **DTO**：`CreateDestinationInput`、`UpdateDestinationInput`。
- **映射 / 守卫**：`destinationSummaryFromRow`、`destinationRuntimeFromRow`、
  `destinationSummaryFromRuntime`、`requireDestination`。
- **类**：`SqliteDestinationRepository`。

### 7.3 `routes.ts`

- **Row**：`RouteRow`（含 `rule_json`、`destination_ids_json`）。
- **接口**：`RouteRepository`，方法返回的是 `@vane/core` 的 `RouteDefinition`。
- **DTO**：`CreateRouteInput`、`UpdateRouteInput`（`rule` 字段类型来自
  `RouteDefinitionInput["rule"]`）。
- **映射 / 编解码 / 守卫**：`routeFromRow`、`encodeDestinationIds`、
  `decodeDestinationIds`、`requireRoute`。
- **类**：`SqliteRouteRepository`。`create` / `update` 在写入前用
  `RouteDefinitionSchema.parse(...)` 规整整条记录（含默认值、校验）。

### 7.4 `intake.ts`

- **Row**：`EventRow`（拍平了 `severity` / `status` / `title` / `fingerprint` 等便于
  查询的列，同时保留 `normalized_json` / `raw_payload_json` / `raw_headers_json` 等
  blob）。
- **接口**：

```ts
export interface IntakeRepository {
  recordEvent(input: RecordEventInput): EventRecord;
  pruneRawPayloads(input: PruneRawPayloadsInput): number;
}
```

- **DTO**：`RecordEventInput`、`PruneRawPayloadsInput`。
- **映射 / 守卫**：`eventFromRow`、`requireEvent`。
- **类**：`SqliteIntakeRepository`。`pruneRawPayloads` 不删除 Event，只把超过保留期的
  `raw_payload_json` 替换为 tombstone、清空 `raw_headers_json`，从而保留审计行和
  normalized 字段，同时控制 SQLite 体积。类上还有一个 `get(id): EventRecord | null`
  （不在接口里），供 deliveries/history 内部按 ID 取事件。
- **解析失败审计**：provider parser 抛错时，应用层 `intake.ts`
  （`WebhookIntakeService`）仍会通过 `IntakeRepository.recordEvent` 写入一条审计
  Event。这类 Event 使用 `unknown` severity/status、`parse_failed` 标签、解析错误
  metadata、脱敏后的 raw payload/headers，并且不创建 deliveries。这样 webhook 入站有
  可追踪记录，但不会进入投递队列。

### 7.5 `deliveries.ts`（最复杂的聚合）

- **Row**：`DeliveryRow`、`DeliveryAttemptRow`、`DeliveryDedupeKeyRow`。
- **输出类型**：`DeliveryAttempt`（attempt 的领域形状，本层手写，暂未提到 core）。
- **接口**：

```ts
export interface DeliveryRepository {
  enqueueForEvent(input: EnqueueDeliveriesInput): EnqueueDeliveriesResult;
  claimNext(input: ClaimDeliveriesInput): ClaimedDelivery[];
  markSucceeded(input: MarkDeliverySucceededInput): DeliveryJob;
  markFailed(input: MarkDeliveryFailedInput): DeliveryJob;
  retryNow(input: RetryDeliveryInput): DeliveryJob;
  get(id: string): DeliveryDetail | null;
}
```

- **DTO**：`EnqueueDeliveriesInput` / `EnqueueDeliveriesResult` / `DedupedDelivery`、
  `ClaimDeliveriesInput` / `ClaimedDelivery`、`MarkDeliverySucceededInput`、
  `MarkDeliveryFailedInput`、`RetryDeliveryInput`、`DeliveryDetail`。
- **映射 / 守卫**：`deliveryFromRow`、`attemptFromRow`、`decodeRenderedPayload`、
  `requireDelivery`、`requireAttempt`。
- **内部去重逻辑**（文件私有函数）：`reserveDedupeKey`、`pruneDedupeKeys`。
- **类**：`SqliteDeliveryRepository`，构造时注入 sources/destinations/routes/intake，
  以便在认领（claim）时把 job、event、source、destination、route、attempt 一并组装
  成 `ClaimedDelivery`。
  - 关键行为：`enqueueForEvent` / `claimNext` / `markSucceeded` / `markFailed` 都包在
    `context.runInTransaction` 里；按 `idempotencyKey` 在去重窗口内对
    `(source, idempotencyKey, route, destination)` 去重；`claimNext` 只认领 destination
    enabled 且 route enabled（或无 route）的 pending delivery，并用条件 UPDATE +
    `changes()` 实现乐观认领；`retryNow` 只接受 `failed` delivery，并在自动重试次数已耗尽时
    把 `max_attempts` 推到 `attempt_count + 1`，确保手动重试会被 worker 认领为下一次
    attempt。
  - 类上还有 `getJob(id)` / `getAttempt(id)` 两个辅助读方法。

### 7.6 `history.ts`（跨聚合只读投影）

不拥有任何表，只做面向 UI 的联表读模型。

- **接口**：

```ts
export interface HistoryRepository {
  listEvents(query?: EventListQuery): Page<EventListItem>;
  getEventDetail(eventId: string): EventDetail | null;
  listDeliveries(query?: DeliveryListQuery): Page<DeliveryListItem>;
}
```

- **查询 DTO**：`EventListQuery`、`DeliveryListQuery`（都支持过滤 + `cursor` 游标 +
  `limit`）。Event 列表可按 source、severity、status、title/message 搜索；Delivery
  列表可按 source、severity、status、destination、delivery state、title/message 搜索。
- **投影类型**：`EventListItem`（含按状态聚合的 `deliveryCounts`）、`EventDetail`、
  `EventDetailDelivery`、`DeliveryListItem`。`EventDetailDelivery` 在 `DeliveryJob`
  基础上只补充 `destinationName` / `routeName`，让事件详情页能从一个地方读到投递目标、
  状态、attempt 摘要和错误原因，同时不暴露 destination secret/config。
- **类**：`SqliteHistoryRepository`。分页采用"多取一条判断是否有下一页"的游标方案，
  `nextCursor` 取自最后一条的时间戳。
- **事件详情路由解释**：`EventDetail` 包含 `routeMatches`。新写入的 Event 会在
  intake 时把当时所有 Route 的匹配解释持久化到 `events.route_matches_json`，因此后续
  修改 Route 名称、条件或启停状态时，旧事件详情仍能说明"当时为什么匹配/未匹配"。旧
  数据库或旧事件没有快照时，`history` 会退回用已持久化的 normalized event 和当前
  routes 重新计算解释。真正代表当时实际入队结果的历史证据仍然是 deliveries 行。

### 7.7 `settings.ts`

应用级设置仓储，当前只管理 `rawPayloadRetentionDays`。

- **接口**：

```ts
export interface SettingsRepository {
  get(): AppSettings;
  update(input: Partial<AppSettings>): AppSettings;
}
```

- **类**：`SqliteSettingsRepository`。使用 `settings` 表的 key/value 行存储，默认
  raw payload 保留 30 天；写入时用 `ON CONFLICT` upsert。

---

## 8. 校验与编解码边界

判据：**只有跨越序列化/不可信边界的数据才做运行时校验。**

| 数据 | 是否运行时校验 | 怎么做 |
| --- | --- | --- |
| JSON 列（`config_json`、`normalized_json`、`raw_payload_json` 等）读出 | ✅ 是 | `decodeJsonObject` / `decodeSchemaJson(Schema, ...)`（Zod parse） |
| 领域对象写入前（如 route） | ✅ 是 | `RouteDefinitionSchema.parse(...)` |
| 从行映射出领域类型（`eventFromRow` / `deliveryFromRow` / ...） | ✅ 是 | 对应 `XxxSchema.parse(...)` |
| enum 列（`provider`、`kind`） | ✅ 是 | `SourceProviderSchema.parse` / `DestinationKindSchema.parse` |
| 布尔列 | ✅ 是 | `fromSqliteBoolean`（非 0/1 抛错） |
| 行的整体结构（`db.get()/all()` 的返回） | ❌ 否 | `rowAs` / `rowsAs` 编译期断言 |
| 仓储输入 DTO（`CreateXInput` 等） | ❌ 否 | 手写 interface，调用方已是类型安全的内部代码 |
| 只读投影（`EventListItem` 等） | ❌ 否 | 手写 interface，由已校验的片段在进程内拼装 |

要点：行的"物理结构"由迁移控制、是自家数据，所以用 `as` 断言即可；行里**真正
来自外部的 JSON blob** 才是风险点，那些都过了 Zod。只用 `z.infer` 而不 `.parse()`
和手写 interface 在安全性上完全等价，所以内部契约一律手写 interface。

---

## 9. 错误模型

- 取不到记录 → `RecordNotFoundError`（6 处 `requireX` 守卫）。
- 数据完整性违例 → `SqliteDataIntegrityError`（如 `fromSqliteBoolean`）。
- JSON / schema 解析失败 → Zod 自身的 `ZodError`（未包装）。
- 三者（前两者）都继承 `SqliteError`，上层可统一捕获。

---

## 10. 连接与迁移

- **`connection.ts` / `createSqliteDatabase()`**：打开数据库，开启
  `PRAGMA foreign_keys = ON`；非 `:memory:` 时启用 `journal_mode = WAL` 和
  `busy_timeout = 5000`。
- **`transaction.ts` / `transaction()`**：基于 `better-sqlite3`
  `db.transaction(fn).immediate()` 的事务封装，被
  `SqliteRepositoryContext.runInTransaction` 和迁移入口复用；嵌套事务由 driver 的
  savepoint 语义保证。
- **`migrate.ts` / `migrateSqliteDatabase()`**：读取 `migrations/` 下形如
  `0001_xxx.sql` 的文件，按版本顺序、逐个在事务内执行，并写入 `schema_migrations`
  账本表；已应用的版本会跳过。迁移**只前进**，不修改已提交的旧迁移。
- 当前 schema 共 13 张表：`sources` / `destinations` / `routes` / `events` /
  `deliveries` / `delivery_attempts` / `delivery_dedupe_keys` / `settings` /
  `schema_migrations`，以及 Better Auth 的 `user` / `session` / `account` /
  `verification`。

---

## 11. 测试

- `store.test.ts`：用 `openSqliteStore({ databasePath: ":memory:", now, ids })` 注入
  确定性时间与 ID，覆盖全仓储 ID 注入、去重入队、认领上下文、标记成功、事件详情路由解释等端到端流程。
- `intake.test.ts`：覆盖 webhook 入站服务，包括 provider parser 解析失败时记录审计
  Event、脱敏 raw payload/headers、且不创建 deliveries。
- `routes/api/sources/$sourceId/-webhook.test.ts`：覆盖 webhook endpoint 的 HTTP 行为，
  包括缺 token、payload 超限、非法 JSON、成功 202 响应，以及 parser 失败时返回
  `eventId`。
- `migrate.test.ts`：验证迁移前进与账本记录、表清单，以及通过
  `new OpenedSqliteStore(db, new SqliteRepositoryContext({ db })).schemaVersion` 从
  `schema_migrations` 账本读取当前 schema 版本。

---

## 12. 如何扩展

**新增一个聚合：**

1. 新建 `apps/console/src/infra/sqlite/<aggregate>.ts`，放入 Row 类型、Repository 接口、
   输入/输出 DTO、映射函数、require 守卫、仓储类。
2. 在 `store.ts` 的 `SqliteStoreUnitOfWork` 加上该仓储，并在
   `createSqliteRepositories` 里实例化、按依赖顺序注入。
3. JSON 列用 `@vane/core` 的 `encode*/decode*`；布尔/行 cast 用本层 `codecs.ts`；
   取不到记录抛 `RecordNotFoundError`。

**新增一张表 / 改 schema：**

1. 在 `migrations/` 新建 `NNNN_描述.sql`（版本号递增），只前进。
2. 不要改动已提交的旧迁移。
3. 时间列统一用 `IsoDateTimeString`（TEXT，ISO 8601）。

**判断类型该用 Zod 还是手写 interface：** 见 [§8](#8-校验与编解码边界)——会跨边界、
需要运行时校验的用 `@vane/core` 的 schema + `.parse()`；纯内部契约用手写 interface。
