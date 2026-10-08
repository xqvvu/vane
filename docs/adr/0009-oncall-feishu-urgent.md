# 0009 --- On-call 加急：飞书电话呼叫的接入架构

状态：提议（2026-10-08）。本 ADR 是对 MVP PRD 的 scope amendment：PRD 把 on-call scheduling、escalation policies 列为 out-of-scope（`docs/prd/self-hosted-alert-hub-mvp.md:210`），实现前需要先按 `docs/prd/post-mvp-planning.md` 的流程认领方向并立增量 PRD。本 ADR 同时 **amend** `0002-curated-adapter-extension-model.md` 的两条决策（send result 形状、adapter 能力 registry），并依赖 `0007-console-orpc-api-boundary.md` 的边界规则。

## 背景

需求：告警命中时，通过飞书加急（`urgent_phone`）打电话叫醒值班人。发送本身是简单 HTTP 调用；真正的架构问题是加急**挂在哪一层、如何触发、失败如何重试、凭证放哪**。

飞书平台侧的硬约束（2026-10-08 由官方 Go SDK `larksuite/oapi-sdk-go` 的 `im/v1` samples 核实）：

1. 加急是 `PATCH /open-apis/im/v1/messages/:message_id/urgent_phone`（同类还有 `urgent_app` 应用内强提醒、`urgent_sms` 短信），body 为 `{ urgent_receivers: { user_id_list } }`，query 带 `user_id_type`。它**作用于一条已存在的 message**，必须先有 `message_id`。
2. 该调用需要自建应用凭证（`app_id` + `app_secret` → `tenant_access_token`）。Vane 当前 `feishu` destination 用的是自定义群机器人 webhook（`webhookUrl` + 签名密钥），两者是互不相通的接入方式；加急无法从 webhook 路径发起。
3. 现有 webhook 发送的响应只有 `{code, msg}`，拿不到 `message_id`，因此**群卡片消息大概率无法被加急**（自定义机器人消息不是应用资产）。平台文档是客户端渲染的，暂时无法在线核实这条限制；设计上不依赖它，但实现前必须用真实飞书应用做 spike 验证。

对现有代码的关键发现（决定下面的取舍）：

- `DestinationAdapter` 只有 `preview` + `send` 两个动作；`DestinationSendResult` 没有任何 provider reference 字段（`packages/destinations/src/types.ts:60`），`deliveries` / `delivery_attempts` 也没有 `message_id` 列。
- `delivery-execution.ts` 是所有出站发送的唯一收口，`markSucceeded` / `markFailed` 共享同一个 attempt 计数与退避。**加急若塞进 `send()` 内部，电话失败会连带重发整条告警卡片**，这在告警群里不可接受。
- `RouteRuleSchema` 是严格匹配谓词，`evaluateRouteMatch` 产出审计用 `checks[]`。加急是动作（action），不是谓词（predicate），塞进规则会污染匹配审计。

## 决定

1. **加急是独立的 on-call 升级能力，不折叠进 destination `send()`。** 新建 capability 切片：`packages/core/src/oncall/`（共享契约）、`apps/console/src/server/oncall/`（service）、新表和新 worker 队列、新 oRPC namespace。加急拥有自己的状态机、attempt 计数和退避（镜像 `deliveries` 的形状），与群卡片投递生命周期完全解耦：电话失败只重试电话，永远不重发卡片；卡片重发也绝不重复打电话。

2. **每条 ping 自带消息载体（DM 模式）。** 加急动作 `ping` 是 channel adapter 内部的两步组合：先用应用凭证给值班人发单聊消息 `POST /im/v1/messages?receive_id_type=user_id` 拿到该消息的 `message_id`，再对这条消息执行 `PATCH .../urgent_phone`。加急因此完全不依赖群卡片投递的结果，规避约束 3。未来 spike 若证明群卡片可加急，只需给 ping 增加一种 provider reference 来源（见决定 6），队列和状态机不变。

3. **Channel adapter 与 Destination adapter 并列，复用同一套纪律。** `packages/destinations/src/urgency/` 新增 `UrgencyChannelAdapter`（`kind`、`configSchema`、`ping(input, ctx)`）和 `UrgencyRegistry`，与 `DestinationRegistry` 同构：结构化 `ok` union、error kind、retry hint、只接收已校验 typed config、不碰 DB/container/logger、使用注入的 `fetch` / `now` transport context。`UrgencyChannelKind` 从第一天就是封闭枚举，当前唯一成员 `feishu_urgent_phone`；SMS/语音以后是新增成员，不是重构。不把加急塞进 `DestinationAdapter` 变成可选方法：那会让"能力标志 + 动作方法"两处真相分裂，且被迫打开封闭的 capabilities schema，0002 的论证同样适用。

4. **触发复用 Route 匹配；配置是独立实体，不进 `RouteRuleSchema`。** intake 事务（`server/intake/intake.service.ts` 里 `tx.intake.recordEvent` + `tx.deliveries.enqueueForEvent` 之后，见该文件 105/115 行）新增一步 `schedulePingsForEvent`：为「匹配到的 route 关联的、enabled 的 on-call policy」各建一条 ping。`RouteRuleSchema` / `evaluateRouteMatch` / `checks[]` 一字不改。配置侧新增 `oncall_policies` 表（policy 按 id 关联 routeIds，含渠道、收件人、severity 门槛），配 oRPC `oncall.listPolicies / upsertPolicy / deletePolicy / listPings`。路由只负责"是否命中"，policy 负责"命中后打给谁、什么级别才打"。不把 receivers 写进 destination config（那是 transport 配置，不是 operator intent），也不写进 `RouteDefinition`（route 的 strict schema + TOML snake_case 镜像 + 路由表单会全链连带）。

5. **`oncall_pings` 运行时表 + 复用 worker 形状。**

   ```text
   oncall_pings(
     id, policy_id, event_id, route_id, fingerprint, channel,
     state scheduled|running|fired|suppressed|failed,
     provider_ref_type, provider_ref_value,          -- DM 的 message_id
     attempt_count, max_attempts, next_attempt_at, last_error,
     trigger auto|manual, initiated_by,              -- 审计
     suppress_reason,                                -- MVP 恒为 null，见决定 9
     created_at, updated_at, fired_at
   )
   ```

   `OncallWorker.runOnce()` 照抄 `DeliveryWorkerService`（`server/deliveries/delivery-worker.service.ts`）的 reclaim → claim(due) → execute 顺序，退避复用 `DeliveryBackoffOptions`（`server/deliveries/delivery-execution.ts:31`）；runner 复用 `createDeliveryWorkerRunner`（`server/runtime/delivery-worker-runner.ts:47`，它对队列形状无感知），container 里 `ensureOncallWorkerRunner()` 与 delivery runner 并列（注入点见 `server/runtime/container.ts:138`），仍是单进程 setInterval。MVP 阶段按 AGENTS.md 直接在 `migrate/schema.ts` 的 `createVaneTables` / `createVaneIndexes` 里加表（`migrate/0001_initial_schema.ts` 只是编排器，不需要改）；ping 需要独立 attempt 历史时再加 `oncall_ping_attempts`（与 `delivery_attempts` 同构）。

6. **Provider reference 进通用 send result，为群加急留门。** `DestinationSendResultBase` 增加可选 `providerReference?: { type: string; value: string }`（`type` 是开放字符串命名空间，如 `feishu_message_id`），`markSucceeded` 落 `deliveries.provider_ref_{type,value}` 两列。这是对 0002 的 amend：结果保持 `ok` union 纪律，只是多了"目标系统资产句柄"这一通用维度。有了它，手动加急（决定 8）和未来群卡片加急都不需要再动 schema。共享类型 `ProviderReferenceSchema` 归 `@vane/core`（infra 层不应依赖 `@vane/destinations`），读路径经 `DeliveryDetail.providerReference` 与 `packages/api` 的 `DeliveryDetailSchema` 投影到已认证 dashboard；`value` 是运维标识符而非 secret。

7. **`app_id` / `app_secret` 归属 on-call policy，走现有 secret 管线。** policy 的 channel config 里 `app_secret` 声明为 `secretFields`（kind `api_key`，env hint `VANE_ONCALL_FEISHU_APP_SECRET`），沿用 secretRefs 与 `preserve/replace/clear` 编辑语义；DTO、TOML 导出、日志一律不带明文。飞书 destination 配置不新增 app 凭证：webhook 群通知和加急是两条能力路径，凭证各自归属各自的实体，operator 在 UI 里分别配置。

8. **手动加急按钮进 v1。** oRPC `oncall.buzzNow({ eventId })`：对事件关联的 policy（无 policy 时要求显式传 channel + receivers）建一条 `trigger: manual` 的 ping 并立即 dispatch（参照 `server/destinations/destination.service.ts:140` `testDestination` 的直接调用模式，不等 tick；失败落回队列重试）。这是 `manual` trigger 与 `initiated_by` 列存在的原因，也是 0007 边界（薄 entrypoint + `withDashboardService`）的标准套用。

9. **延时与确认：状态机预留，行为不实现。** v1 的 ping 是 immediate（`scheduled_at = received_at`）。`scheduled` / `suppressed` 状态、`ackOncallPing` 和 resolved-as-ack（按 fingerprint 抑制未 fire 的 ping）不实现，只保留在状态枚举里。"没人确认就升级"是真正的 on-call 语义，但依赖 ack/silence 建模，PRD 明确把这类概念留给单独的设计轮；先打通电话通路，不预先设计一半的升级链。

10. **去重风暴保护。** ping 按 `(fingerprint, policy_id)` 在一个去重窗口（沿用 `intake.service.ts:54` 的 `dedupeWindowMs ?? 5 * 60 * 1000` 模式，作为 service 选项而非共享常量）内只建一条。告警风暴下"每 30 秒一条 firing 就刷一次电话"不可接受。新建 `oncall_ping_dedupe_keys` 表，不复用 `delivery_dedupe_keys` 的行，避免两种生命周期缠绕。

## 后果

- 实现前必须完成 spike：真实飞书应用拿 `tenant_access_token`、发 DM 取 `message_id`、`urgent_phone` 打通；同时验证群 webhook 卡片是否可加急（决定 2 的前提）。spike 结论回写本 ADR。
- 飞书加急有平台配额/计费（电话、短信按量），`UrgencyRegistry` 的结果必须能区分配额类拒绝（映射为 `target_rejected` + `not_retryable`）。per-channel 限流仍按 0002 留给 worker 架构议题，但配额错误码解析属于 adapter。
- 第二张队列表意味着 worker 健康快照、日志（`vane.delivery` / `vane.worker.*` 模式扩展到 `vane.oncall`）与 operations UI 各多一个维度；这是独立重试换来的固定成本。
- 0002 需要补两段：send result 的 `providerReference`；adapter 家族新增 urgency channel 类型及其 registry 纪律。AGENTS.md 的目录清单（`features` 与 `server/`）要加 `oncall`。具体批次见「实现顺序」的前置门槛。
- UI 侧新增 `features/oncall/`（policy 配置页、ping 列表、事件详情上的加急按钮），i18n 按 AGENTS.md 运维词汇使用「加急」「值班」「呼叫」，中文键走 `oncall.*` namespace。

## 实现顺序

下面是把上述决定摊开的落地顺序，每步标注它实现哪条决定、动哪些文件、如何验收。路径均已核对存在。

**前置门槛（不满足则不开步骤 3）**

- 按 `docs/prd/post-mvp-planning.md` 认领方向并立增量 PRD；本 ADR 从提议转为接受以该 PRD 被接受为条件（PRD `:210` 目前把 on-call 列为 out-of-scope）。
- `docs/adr/0002-curated-adapter-extension-model.md` 补两段：send result 的 `providerReference`（已随步骤 1 落地）、urgency channel adapter 家族及其 registry 纪律（已写入，标注为提议且尚未实现）。`AGENTS.md` 的 `features` 与 `server/` 目录清单加 `oncall` 一项**延后**：该文件当前带着未提交的 oRPC 边界重构改动，现在编辑会与之混在同一批 diff 里，等那批重构落地后再补。

**步骤 0：飞书 spike（阻塞项，不入仓库）**

用一次性脚本验证三件事：`app_id` + `app_secret` 换 `tenant_access_token`；`POST /open-apis/im/v1/messages?receive_id_type=user_id` 发单聊能取到 `message_id`；`PATCH /open-apis/im/v1/messages/:message_id/urgent_phone` 真实响铃。同时验证群 webhook 卡片是否可加急（决定 2 的前提），并记录加急的配额/计费错误码形态。结论回写「背景」第 3 条与决定 2、决定 7。**spike 不通过就不进入步骤 1**，本 ADR 退回重议。

**步骤 1：provider reference 地基（决定 6，可独立合并）—— 已完成（2026-10-08）**

| 文件 | 改动 |
| --- | --- |
| `packages/core/src/delivery/delivery.ts` | 新增 `ProviderReferenceSchema` 与 `ProviderReference` 类型 |
| `packages/destinations/src/types.ts` | `DestinationSendResultBase` 增可选 `providerReference?: ProviderReference` |
| `apps/console/src/infra/sqlite/migrate/schema.ts` | `createVaneTables` 给 `deliveries` 增 `provider_ref_type` / `provider_ref_value` |
| `apps/console/src/infra/sqlite/schema.ts` | `DeliveriesTable` 同步两列 |
| `apps/console/src/infra/sqlite/repositories/delivery/delivery.interface.ts` | `DeliveryRow` 两列；`MarkDeliverySucceededInput.providerReference` |
| 同目录 `delivery.helpers.ts` | 新增 `providerReferenceFromRow`（两列任一为 null 即视为无句柄） |
| 同目录 `delivery.repository.ts` | insert 显式写 null；`markSucceeded` 写两列；`get()` 投影进 detail |
| `packages/core/src/operations.ts` | `DeliveryDetail.providerReference` |
| `packages/api/src/schemas/operations.ts` | `DeliveryDetailSchema` 增 `providerReference` nullable，使 wire DTO 与 core 投影一致 |
| `apps/console/src/server/deliveries/delivery-execution.ts` | 成功分支把 `sendResult.providerReference` 透传给 `markSucceeded` |

实现时比原计划多做了读路径：只写不读的列是死数据，而 `DeliveryDetail` 增加字段不会外溢到 UI（oRPC 输出由 `packages/api` 的 schema 决定，前端 view 复用 core 类型，因此必须同批补 wire schema，否则 `delivery-detail-page.tsx` 类型不通过）。UI 是否展示 message_id 留给步骤 8。

验收：`vp check` 零错误，`vp run -r test` 四个包全绿（含新增断言：execution 透传 ref、store 落库并可读回、失败投递的 ref 为 null），`vp run -r build` 通过。此步不需要飞书应用凭证。

**步骤 2：urgency channel adapter（决定 3）**

新建 `packages/destinations/src/urgency/`，与 `feishu/` 并列：

- `types.ts`：`UrgencyChannelKind = "feishu_urgent_phone"`（封闭枚举）、`UrgencyChannelAdapter`（`kind` / `configSchema` / `ping(input, ctx)`）、结构化 `ok` union、error kind、`retryable`
- `feishu/`：`schema.ts`（已校验的 typed app config）、`client.ts`（token 获取与缓存 + 发 DM + `urgent_phone` 两步）、`adapter.ts`、`manifest.ts`、`result.ts`（从响应提取 `message_id`）
- `registry.ts`：照抄 `packages/destinations/src/registry.ts` 的注册与查找形状
- 包根 `index.ts` 只做聚合导出，`package.json` 增加 `@vane/destinations/urgency/...` 子路径

纪律：`ping` 对内两步、对外一个动作；adapter 不碰 DB / container / logger；`fetch` 与 `now` 从 ctx 注入；配额类拒绝映射为 `target_rejected` + 不可重试。**不要**给 `DestinationAdapter` 加 `urgent?()` 方法（见替代方案第二条）。

验收：假 `fetch` 单元测试断言两步调用的 URL、query `user_id_type`、body `urgent_receivers`，以及 token 过期重取。

**步骤 3：core 共享契约（决定 4、5、7、8）**

`packages/core/src/oncall/`：policy 与 ping 的 DTO、`UpsertOncallPolicyCommand` / `ListOncallPingsCommand` / `BuzzNowCommand` 等命令 schema、ping 状态枚举（含预留的 `scheduled` / `suppressed`）。必须保持环境中性：不 import `node:*`、`#/infra/*`、`#/server/*`，不带 server-only 标记。

**步骤 4：持久化与 service（决定 4、5、9、10）**

- `infra/sqlite/migrate/schema.ts`：`oncall_policies`、`oncall_pings`、`oncall_ping_dedupe_keys`
- `infra/sqlite/schema.ts`：Kysely 表类型声明；`infra/sqlite/migrate/migrate.test.ts` 的精确表名清单断言要同步（该断言是全量相等，漏改必红）
- `infra/sqlite/store.ts` + `repositories/oncall/`（`oncall.interface.ts` / `oncall.helpers.ts` / `oncall.repository.ts`）
- `server/oncall/oncall.service.ts` + `oncall.service.types.ts`：policy CRUD、`schedulePingsForEvent`、`buzzNow`、claim/due/mark。领域失败用 `RecordNotFoundError` / `DomainValidationError`，**不得 throw `ORPCError`**（`server/orpc/errors.ts` 是唯一的边界翻译点）
- 去重按 `(fingerprint, policy_id)`，照抄 `intake.service.ts:54` 的 `dedupeWindowMs` 选项模式

**步骤 5：worker（决定 5）**

`server/oncall/oncall-worker.service.ts`（+ `.types.ts`）照抄 `server/deliveries/delivery-worker.service.ts` 的 reclaim → claim(due) → execute，退避复用 `DeliveryBackoffOptions`；runner 直接复用 `server/runtime/delivery-worker-runner.ts:47`，在 `server/runtime/container.ts`（对照 138 行的 delivery runner 注入）加 `ensureOncallWorkerRunner()`。日志命名从 `vane.delivery` 扩展到 `vane.oncall`。

验收：worker 单元测试用假时钟断言退避序列，且**必须**覆盖一条「ping 失败不触碰 delivery 状态」的断言，这是决定 1 的全部价值所在。

**步骤 6：oRPC 边界（决定 8，套用 0007）**

- `packages/api/src/contract/oncall.ts` + `contract/index.ts` 注册 namespace
- `apps/console/src/server/orpc/features/oncall/router.ts`：`listPolicies` / `upsertPolicy` / `deletePolicy` / `listPings` / `buzzNow`，私有过程用 `withDashboardService((container) => container.createOncallService())`，handler 只调 `context.service.<method>(input)`
- DTO 不得带出 `app_secret`、token 或明文 secret

contract 与 implementer 由类型检查强制同步，步骤 3 与步骤 6 应落在同一批提交。

**步骤 7：intake 挂接（决定 4）**

`server/intake/intake.service.ts` 在 `tx.intake.recordEvent`（105 行）+ `tx.deliveries.enqueueForEvent`（115 行）之后加一步 `schedulePingsForEvent`。这是本方案唯一改动现有热路径的地方，收口在事务内的依赖注入 + 一次调用，不要在此文件写加急业务判断。

验收：intake 测试补「命中 enabled policy 时建 ping」「policy disabled 时不建」「同 fingerprint 窗口内只建一条」。

**步骤 8：portability 与 UI（决定 4、7）**

- `server/configuration/config-portability.service.ts`（+ `config-portability.ts` / `.service.types.ts`）：policy 进 TOML 导出导入；`app_secret` 走 secretRefs，env hint `VANE_ONCALL_FEISHU_APP_SECRET`；**旧 TOML 无该块必须仍能导入**
- `src/features/oncall/`：`api/`（queryOptions 与 mutation 包装）、`model/`、`ui/`（policy 列表页、policy 表单、ping 列表、事件详情加急按钮），路由文件只挂 URL 与 loader
- `src/components/common` 复用表格壳与分页；`enabled/disabled` 用现有 badge
- i18n 走 `oncall.*` namespace，`const t = useTranslations();` 单入口，中文用「加急」「值班」「呼叫对象」「应用凭证」，`feishu_urgent_phone` 等机器值不翻译
- 表单用 TanStack Form，列表用 TanStack Table，持久筛选进 Router search params

验收：`vp check` + `vp run -r test`，再起 dev server 用 `admin@example.test` 走完「建 policy → 打告警 → 收到电话 → 事件详情手动加急」，浏览器验证走 `http://localhost:<port>`。

## 不采用的替代方案

- **折叠进 `send()`（最省）**：加急作为 feishu send 的副作用，零新表。否决：电话失败连带重发群卡片；加急无法被操作者单独观测和重试；手动加急没有 message 句柄。
- **`DestinationAdapter.urgent?()` 可选方法 + capability 标志**：比独立 registry 少一个接口，但把"出站通知"和"呼叫人"两种语义挤进同一 adapter 对象，且要打开封闭 capabilities schema，四份 manifest 连带修改。否决：seam 更差，收益只是少一个类。
- **urgency 写进 `RouteRuleSchema` / `RouteDefinition`**：operator intent 更贴身，但污染匹配谓词审计，且 route strict schema + TOML snake_case 镜像 + 路由表单全链连带。否决：独立 policy 实体表达同样关联，改动面小得多。
- **完整 on-call 平台（排班/轮转/多级升级）一次到位**：正是 PRD 排除的部分，不预先建模。本 ADR 的 policy / ping / channel 三层形状已足以无破坏地长出这些概念。

## 参考

- `docs/adr/0002-curated-adapter-extension-model.md`（本 ADR amend 其 send result 与 registry 决策）
- `docs/adr/0007-console-orpc-api-boundary.md`（oncall namespace 的边界套用）
- `docs/prd/self-hosted-alert-hub-mvp.md`（out-of-scope 条款，本 ADR 是其 amendment 提案）
- `docs/prd/post-mvp-planning.md`（新特性先认领方向 + 增量 PRD 的流程）
- 飞书加急 API：`larksuite/oapi-sdk-go` `sample/apiall/imv1/urgentPhone_message.go`，`PATCH /open-apis/im/v1/messages/:message_id/urgent_phone`
