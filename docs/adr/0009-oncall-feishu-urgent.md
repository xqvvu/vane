# 0009 --- On-call 加急：飞书应用与 delivery 级电话呼叫

状态：提议（2026-10-08）。本 ADR 是对 MVP PRD 的 scope amendment：PRD 把 on-call scheduling、escalation policies 列为 out-of-scope（`docs/prd/self-hosted-alert-hub-mvp.md:210`），实现前需要先按 `docs/prd/post-mvp-planning.md` 的流程认领方向并立增量 PRD（`docs/prd/oncall-feishu-urgent.md`）。本 ADR **amend** `0002-curated-adapter-extension-model.md` 的一条决策（adapter 家族新增 urgency channel 类型；send result 的 `providerReference` 已随步骤 1 落地），并依赖 `0007-console-orpc-api-boundary.md` 的边界规则。

2026-10-08 设计修订：初版把飞书应用凭证放在独立的"加急策略"实体里、用单聊消息作为加急载体。评审后改为：**飞书应用做成可复用资源；加急配置挂在飞书 destination 上；加急动作挂在某一次 delivery 上（自动 + 手动）**。本 ADR 记录修订后的形状；被替换的设计记入「不采用的替代方案」。

## 背景

需求：告警命中时，通过飞书加急（`urgent_phone`）打电话叫醒值班人。发送本身是简单 HTTP 调用；真正的架构问题是加急**挂在哪一层、如何触发、失败如何重试、凭证放哪**。

飞书平台侧的硬约束（2026-10-08 由官方 Go SDK `larksuite/oapi-sdk-go` 的 `im/v1` samples 核实）：

1. 加急是 `PATCH /open-apis/im/v1/messages/:message_id/urgent_phone`（同类还有 `urgent_app` 应用内强提醒、`urgent_sms` 短信），body 为 `{ urgent_receivers: { user_id_list } }`，query 带 `user_id_type`。它**作用于一条已存在的 message**，必须先有 `message_id`。
2. 该调用需要自建应用凭证（`app_id` + `app_secret` → `tenant_access_token`）。Vane 当前 `feishu` destination 用的是自定义群机器人 webhook（`webhookUrl` + 签名密钥），响应里只有 `{code, msg}`，拿不到 `message_id`：**webhook 消息无法被加急，能被加急的只有应用自己发出的消息**。
3. 应用向群发消息需要机器人已在群内；`chat_id` 由此获得。加急有配额/计费（电话按量）。

对现有代码的关键发现（决定下面的取舍）：

- `DestinationSendResult` 已能携带可选 `providerReference: { type, value }`，且 `deliveries.provider_ref_type / provider_ref_value` 已落库并投影进 Delivery detail（步骤 1，2026-10-08 完成）。"加急作用于某次 delivery 的消息"所需的地基已经就位。
- `delivery-execution.ts` 是所有出站发送的唯一收口，`markSucceeded` / `markFailed` 共享同一个 attempt 计数与退避。**加急若折叠进 `send()`，电话失败会连带重发整条告警卡片**，在告警群里不可接受。
- `RouteRuleSchema` / `RouteDefinition` 是 strict schema，且有 TOML snake_case 镜像与路由表单全链；把加急接收人配在 route 上的连带成本显著高于配在 destination config（后者本就是 adapter-owned JSON，有现成的 schema/manifest/表单/操作摘要管线，email 的 `to` 字段是既有先例）。

## 决定

1. **飞书应用是一等资源。** 新表 `feishu_apps(id, name UNIQUE, app_id, app_secret, created_at, updated_at)`；console 新增「飞书应用」管理页（列表 + 新建/编辑/删除 + 测试）。测试 = 用 `app_id`/`app_secret` 换 `tenant_access_token` 验证凭证有效。凭证沿用现有 secret 纪律：形如 `appSecret` 的路径按 `isSensitiveKey`/redaction helper 脱敏，不回显进 DTO，不进 TOML 明文（导出为 env ref，命名对齐 `VANE_DEST_*`，即 `VANE_FEISHU_APP_<id>_<path>`）；被 destination 引用时拒绝删除，并在错误信息里列出引用方。

2. **飞书 destination 增加应用发送模式。** config 增加 `sendMode: "webhook" | "app"`（默认 `webhook`，现有配置零迁移）：app 模式引用 `{ appRef, chatId }`，卡片经 `POST /im/v1/messages` 由应用发出，响应 `message_id` 写入 `providerReference`。预览、测试、模板渲染、webhook 模式全部保持原样共用。运维前提写进表单提示与部署文档：应用机器人必须已加入目标群，`chat_id` 从群信息获得。

3. **加急挂在某一次 delivery 上，不引入策略实体。** 加急对象就是这条 delivery 自己发出的消息，因此只有应用发送模式的投递可加急；webhook 投递在 UI 上明确标注"无法加急（消息非应用发送）"。初版的 `oncall_policies` 表、策略 CRUD 与 `oncall` namespace 全部取消。

4. **触发 = 自动 + 手动。** destination 的 `urgent` 配置形状：`{ autoEnabled, severities（默认 ["critical"]）, userIdType, receivers（≥1 且唯一） }`；`urgent` 存在才允许加急，`autoEnabled = false` 即"只手动"。
   - 自动：delivery 成功、带 `providerReference`、事件 `status = firing`、severity 在 `urgent.severities` 内 → 为每个接收人建一条 ping（`trigger: auto`）。
   - 手动：`operations.buzzDelivery({ deliveryId })`，接收人取 destination 配置，记录操作者（`trigger: manual` + `initiated_by`）；立即派发，失败落回队列重试。v1 不支持手动指定任意接收人。
   - 触发判断收口在 `delivery-execution.ts` 的成功分支，通过注入的窄接口（`enqueueUrgentPings`）调用；执行器不读 Feishu 配置细节，无该依赖时行为与今天完全一致（既有测试与单 destination 场景不感知）。

5. **ping 拥有独立状态机与重试，一个接收人一条。**

   ```text
   oncall_pings(
     id, delivery_id, destination_id, event_id, fingerprint, receiver, channel,
     state scheduled|running|fired|suppressed|failed,
     provider_ref_type, provider_ref_value,   -- 被加急的那条消息（来自 delivery）
     attempt_count, max_attempts, next_attempt_at, last_error,
     trigger auto|manual, initiated_by,       -- 审计
     suppress_reason,                         -- v1 恒为 null，见决定 13
     created_at, updated_at, fired_at
   )
   ```

   电话失败只重试电话，绝不重发卡片；卡片重发也绝不重复打电话。`OncallWorker.runOnce()` 照抄 `DeliveryWorkerService`（`server/deliveries/delivery-worker.service.ts`）的 reclaim → claim(due) → execute 顺序，退避复用 `DeliveryBackoffOptions`（`server/deliveries/delivery-execution.ts:31`）；runner 复用 `createDeliveryWorkerRunner`（`server/runtime/delivery-worker-runner.ts:47`，它对队列形状无感知），container 里 `ensureOncallWorkerRunner()` 与 delivery runner 并列（注入点见 `server/runtime/container.ts:138`），仍是单进程 setInterval。MVP 阶段按 AGENTS.md 直接在 `migrate/schema.ts` 的 `createVaneTables` / `createVaneIndexes` 加表。

6. **去重风暴保护。** ping 按 `(fingerprint, destination_id, receiver)` 在一个去重窗口（沿用 `intake.service.ts:54` 的 `dedupeWindowMs ?? 5 * 60 * 1000` 模式，作为 service 选项而非共享常量）内只建一条。告警风暴下"每 30 秒一条 firing 就刷一次电话"不可接受。新建 `oncall_ping_dedupe_keys` 表，不复用 `delivery_dedupe_keys` 的行。

7. **urgency channel adapter 家族与 Destination adapter 并列。** `packages/destinations/src/urgency/` 新增 `UrgencyChannelAdapter`（`kind` / `configSchema` / `ping(input, ctx)`）与 `UrgencyRegistry`，复用 0002 的全部纪律：结构化 `ok` union、封闭 error kind、retry hint、只接收已校验 typed config、不碰 DB/container/logger、`fetch` 与 `now` 从 ctx 注入。`UrgencyChannelKind` 是封闭枚举，v1 唯一成员 `feishu_urgent_phone`；输入为 `{ app: { appId, appSecret }, messageId, receivers, userIdType }`。卡模式直接对 `messageId` 执行 `urgent_phone`；若 spike 证明群卡片不可加急，则在该 adapter 内部回退为"先给每个接收人发单聊、再对其加急"，对外接口不变。配额/权限类拒绝映射为 `target_rejected` + `not_retryable`。

8. **凭证解析在服务端路径上完成。** 应用凭证在三条路径上按 `appRef` 解析并注入 adapter：delivery 发送、destination 测试、加急执行。adapter 永远不读 DB/env；console 侧用一个窄的 resolver 依赖（容器注入，测试可替换）。

9. **oRPC 面。** 新增 `integrations` namespace（`listFeishuApps` / `createFeishuApp` / `updateFeishuApp` / `deleteFeishuApp` / `testFeishuApp`）+ `operations.buzzDelivery`；`DeliveryDetail` 增加 `pings[]`，与既有 `providerReference` 一起构成"这条投递能不能加急、加急成没成"的可见面。不新增 `oncall` namespace。私有过程一律 dashboard 鉴权，领域错误由边界统一翻译，DTO 不带 `app_secret`。

10. **可移植性。** `feishu_apps` 进 `VaneConfiguration` 与 TOML（`[[feishu_apps]]`：id / name / app_id / app_secret，导出时 secret 走 env ref）；destination 的 `sendMode` / `app` / `urgent` 随现有 destination config 块自然进出；不含这些块的旧文档仍可导入。

11. **删除语义。** 删除仍被 destination 引用的飞书应用被拒绝；pings 随 delivery 级联删除，dedupe 键随 ping 级联；source/route 的既有级联策略不变（pings 经 delivery/event 间接级联）。

12. **destination 操作摘要新增投影。** sendMode、应用名、群 `chat_id`、加急开关与接收人数进入 `DestinationOperationalConfig`，使通知目标表能直接看出"哪些目标会在 critical 时打电话"。接收人 id 是运维标识符而非 secret，可以进入已认证 dashboard DTO。

13. **v1 边界。** 只做电话加急（`urgent_phone`）、只做即时触发、只对 `firing` 自动；排班/轮转/多级升级、ack 与抑制、恢复呼叫、短信与应用内渠道、自定义加急消息模板、手动指定任意接收人、route 级加急配置、独立加急记录页、per-channel 限流都不在实现范围；`scheduled` / `suppressed` 只留在状态枚举里。

## 后果

- **spike 是硬门槛**：①应用凭证换 `tenant_access_token`；②应用向群发卡片并拿到 `message_id`；③对群内接收人执行 `urgent_phone` 真实响铃；④记录配额/计费错误码；⑤若 ③ 不可行，确认 DM 回退路径。结论回写本 ADR 与 PRD 的对应条目。
- 电话加急按量计费、有平台配额；配额/权限错误码解析属于 adapter（映射为不可重试），per-channel 限流仍按 0002 留给 worker 架构议题。
- 应用机器人必须在目标群内（`chat_id` 前提），部署文档与表单提示需要覆盖这一前置条件和常见错误（chat_id 无效、机器人不在群、权限未开通）。
- 自动触发点是本方案**唯一**改动现有热路径的地方（delivery execution 成功分支 + 一次注入调用）；intake 与 route 匹配完全不改。
- 改动面比初版更小：没有策略表、策略 CRUD、策略 oRPC 与策略页面；多出的是应用资源页与三条路径上的凭证解析。
- `0002` 需要两段：urgency channel 家族（已写入，标注为提议且尚未实现）、send result 的 `providerReference`（已写入并已实现）。AGENTS.md 目录清单：`features` 加 `integrations`，`server/` 加 `oncall`。

## 实现顺序

每步标注实现哪条决定、动哪些文件、如何验收。路径均已核对存在。

**步骤 0（步骤 3、4 的门槛）：飞书 spike，人工执行，不入仓库**

一次性脚本验证：`app_id` + `app_secret` 换 `tenant_access_token`；应用向群发卡片（`POST /im/v1/messages`）拿到 `message_id`；对该消息执行 `urgent_phone`，接收人手机真实响铃；记录配额/计费错误码形态。若加急群卡片不可行，验证"发单聊 + 加急"回退路径。结论回写背景第 2、3 条与决定 7。**不通过就不进入步骤 3、4**，本 ADR 退回重议。

**步骤 1：provider reference 地基（决定 5 的前件）—— 已完成（2026-10-08）**

已合并：`packages/core` 的 `ProviderReferenceSchema`、`@vane/destinations` send result 的可选 `providerReference`、`deliveries.provider_ref_type / provider_ref_value` 两列、`markSucceeded` 透传、`DeliveryDetail.providerReference` 与 wire schema。`vp check`、`vp run -r test`、`vp run -r build` 全绿。

**步骤 2：飞书应用资源（决定 1、10）**

- `packages/core`：`FeishuAppSchema`（id / name / appId / appSecret / timestamps）与 `VaneConfiguration` / TOML 文档 schema + 两个 mapper 的 `feishu_apps` 段
- `apps/console/src/infra/sqlite/migrate/schema.ts`：`feishu_apps` 表；`infra/sqlite/schema.ts` 的表类型；`migrate/migrate.test.ts` 的表名清单断言同步
- `infra/sqlite/repositories/feishu-app/`（`*.interface.ts` / `*.helpers.ts` / `*.repository.ts`）并接入 `store.ts`
- `server/integrations/feishu-app.service.ts` + `.types.ts`：CRUD、凭证测试（注入 fetch）、被引用时拒删（引用查询走 destination 配置扫描）
- `packages/api` 的 `integrations` contract + `server/orpc/features/integrations/router.ts` + `server/orpc/router.ts` 注册
- `server/configuration/`：portability 的导出/导入与 env ref（`VANE_FEISHU_APP_<id>_<path>`），旧文档导入测试
- `features/integrations/`（api / model / ui）：列表、表单、测试按钮；i18n `integrations.*`
- `AGENTS.md` 的 `features` 目录清单加 `integrations`

验收：应用可建可测可删；被 destination 引用时删除被拒；TOML 往返（含 env ref）与旧的、无 `feishu_apps` 的文档导入均通过；`vp check` + `vp run -r test`。

**步骤 3：destination 应用发送模式（决定 2、4 的配置面、12）**

- `packages/destinations/src/feishu/schema.ts`：`sendMode`（默认 webhook）、`app: { appRef, chatId }`、`urgent: { autoEnabled, severities, userIdType, receivers }` 与 mode/字段一致性、`urgent` 必须 app 模式的 superRefine
- `packages/destinations/src/feishu/adapter.ts` + 新 `app.ts`：app 模式发送（token → `im/v1/messages`）、`message_id` → `providerReference`；webhook 路径不动
- `packages/destinations/src/feishu/manifest.ts`：`configFields` 增 mode/app/urgent 字段（`appRef` 用 select 类型或在 feature 层 override）
- `destination.service.ts`：保存校验 `appRef` 存在；`test`/`preview` 路径的应用凭证解析（resolver 注入）
- `infra/sqlite/repositories/destination/destination.helpers.ts`：`DestinationOperationalConfig` 投影（sendMode / 应用名 / chatId / 加急开关与接收人数）
- `features/destinations`：表单 mode 切换、应用选择、urgent 区块；i18n
- 测试：app 模式 send 的请求形状与 providerReference 落库、mode/urgent 校验矩阵、webhook 模式回归

**步骤 4：urgency channel adapter（决定 7）**

- 新建 `packages/destinations/src/urgency/`：`types.ts`（封闭 `UrgencyChannelKind`、adapter 接口、结构化结果）、`feishu-urgent/`（schema / client：token → `urgent_phone`，DM 回退路径按 spike 结论）、`registry.ts`、包根与 `package.json` 子路径导出
- 测试：假 fetch 断言 URL、`user_id_type`、`urgent_receivers` body、响应解析、配额类不可重试、token 复用

**步骤 5：加急队列、自动触发与可见性（决定 4 自动、5、6、8、11）**

- `infra/sqlite/migrate/schema.ts`：`oncall_pings`、`oncall_ping_dedupe_keys`（含索引）；表类型与迁移测试同步
- `infra/sqlite/repositories/oncall/`：enqueue（含去重）、claimDue、markFired/markFailed/retryNow、listForDelivery
- `server/oncall/oncall.service.ts` + `.types.ts`：自动入队判断（firing + severity 门槛 + providerReference）、执行（解析 appRef → 调 `UrgencyRegistry.ping`）、退避复用 `DeliveryBackoffOptions`；不 throw `ORPCError`
- `server/oncall/oncall-worker.service.ts` + `.types.ts`；`container.ts` 增 `createOncallService` / `ensureOncallWorkerRunner`；日志 `vane.oncall`
- `server/deliveries/delivery-execution.ts`：成功分支注入 `enqueueUrgentPings`（可选依赖，缺省行为不变）
- `packages/core` 的 `DeliveryDetail.pings` 投影 + `packages/api` wire schema；`features/deliveries` 详情页 pings 区块
- `AGENTS.md` 的 `server/` 目录清单加 `oncall`
- 测试（本方案的核心验收）：假 registry + 假时钟的服务级集成——成功 → 每接收人一条 ping；severity 门槛、firing-only、去重窗口、退避序列、**ping 失败不改 delivery 状态**、卡片重试不重复 ping

**步骤 6：手动加急（决定 4 手动）**

- `packages/api`：`operations.buzzDelivery` contract + `server/orpc/features/operations/router.ts` + service 方法
- `features/deliveries`：详情页「加急」按钮（无 `providerReference` 时禁用并解释原因）、结果反馈、query invalidation
- 测试：手动入队（trigger=manual + initiated_by）、webhook 投递被拒、立即派发失败落回队列

**步骤 7：文档收尾**

`docs/prd/post-mvp-planning.md` 的已认领方向与删除语义更新；`docs/architecture/*` 相关页（application-container、sqlite-store、observability）增补新表/新 runner/新 logger；部署文档补应用机器人入群、chat_id、配额计费三项前提。

## 不采用的替代方案

- **独立"加急策略"实体 + app 凭证内联（初版设计）**：凭证与接收人按策略重复配置，且"哪条消息用哪个 app"要在策略、destination、app 三处维护；修订后替换为"应用资源 + destination 配置 + delivery 级动作"。
- **单聊（DM）作为默认载体**：被叫的人拿到的上下文与群里的卡片割裂，且多一条消息；保留为 spike 失败时的 adapter 内部回退，不作为默认。
- **折叠进 `send()`**：电话失败连带重发卡片，告警群会被刷屏；且加急无法被单独观测与重试。
- **把加急接收人配在 route 上**：语义更贴身，但 route strict schema + TOML snake_case 镜像 + 路由表单全链连带；destination 级配置已能表达"这个目标命中 critical 时呼叫这些人"，且与 email recipients 先例一致。未来若需要按路由细分，另立 ADR 付那笔成本。
- **完整 on-call 平台（排班/轮转/多级升级）一次到位**：正是 PRD 排除的部分，本 ADR 的形状（delivery 级 ping + 状态枚举预留）足以无破坏地长出这些概念。

## 参考

- `docs/prd/oncall-feishu-urgent.md`（本 ADR 对应的增量 PRD；PRD 被接受后本 ADR 从提议转为接受）
- `docs/adr/0002-curated-adapter-extension-model.md`（本 ADR amend 其 adapter 家族与 send result 决策）
- `docs/adr/0007-console-orpc-api-boundary.md`（integrations / operations 过程的边界套用）
- `docs/prd/self-hosted-alert-hub-mvp.md`（out-of-scope 条款，本 ADR 是其 amendment 提案）
- `docs/prd/post-mvp-planning.md`（新特性先认领方向 + 增量 PRD 的流程）
- 飞书加急 API：`larksuite/oapi-sdk-go` `sample/apiall/imv1/urgentPhone_message.go`，`PATCH /open-apis/im/v1/messages/:message_id/urgent_phone`
