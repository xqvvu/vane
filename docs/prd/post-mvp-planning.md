# Post-MVP Planning

本文档是 Vane MVP baseline 完成后的下一轮产品讨论入口。它不是承诺列表，也不是 issue
拆分结果；它用于把候选方向收拢到可讨论、可取舍、可产出 PRD 的形态。

## 背景

Vane 的 MVP 已经建立了自托管 Alert Hub 的基本闭环：

- 告警源接入与认证。
- Provider 解析与规范化告警。
- 路由规则匹配。
- 投递目标配置、预览、测试和发送。
- SQLite-backed Delivery worker、重试和历史。
- Events / Deliveries 运维视图。
- Settings 与 TOML import/export。
- Docker runtime 与 health/readiness endpoint。

下一阶段应该从“继续补 MVP”切换为“选择一个明确产品方向，写新的 PRD，再拆 issue”。每个新
PRD 都应该保持 Vane 的核心约束：单进程、SQLite-first、自托管、运维工具、非 SaaS、非通用工作流引擎。

## 讨论原则

1. 先定义用户痛点，再讨论实现形态。
2. 每轮只选择一个主方向进入 PRD，避免把 roadmap 写成愿望清单。
3. 新需求必须说明它如何增强 Source、Event、Route、Destination、Delivery 或配置可信度。
4. 不引入 Redis、Postgres、Kafka、Temporal、独立 worker 服务或 SaaS 租户模型，除非有新的架构文档接受这种改变。
5. 模板、路由和规则仍然禁止执行用户提供的 JavaScript、shell、SQL 或动态代码。
6. Secret、raw sensitive payload、token hash、destination secret 不进入客户端 query data、route data、TOML 默认导出或普通日志。

## 候选方向

### 1. Destination 结构化模板引擎

问题：MVP 的文本模板能力已经足够覆盖基础消息，但不能表达飞书卡片、Slack blocks、Email HTML
或通用 webhook 的结构化 JSON payload。下一轮模板工作应把旧的 `messageTemplate` 收敛为统一
`template` 配置模型。

候选范围：

- Destination-aware template schema。
- 用 `template` 替代 `messageTemplate`，不做兼容迁移。
- Feishu text / interactive card。
- Slack text / blocks。
- Email subject / text / HTML。
- Generic webhook JSON payload template。
- Preview、test result、Delivery `renderedPayload` 的 secret-safe 表达。
- TOML import/export 中的结构化模板表示。

不做：

- 用户 JavaScript、表达式语言、远程代码、shell、SQL。
- 跨 destination 复用模板资源，除非 PRD 证明它比 destination-local config 更必要。
- 完整卡片可视化设计器；可以先用 JSON/template editor + preview。

### 2. Route Authoring 与 Explain

问题：匹配层支持多条件规则，但 UI 编辑与解释仍偏基础。用户需要更明确地知道一条 Event 为什么匹配或没有匹配某条 Route。

候选范围：

- 多 source、多 severity/status、多 label、多 title/message 条件的完整编辑体验。
- 规则摘要与中文运维文案。
- Event detail 中的 route explain。
- Route 测试/预览：给定样例 Event，显示匹配结果。
- TOML 导入复杂规则后的只读/受限编辑提示。

不做：

- 通用 workflow engine。
- 任意表达式规则。
- 图形化流程编排。

### 3. Alert Suppression 与 Maintenance Window

问题：MVP 会忠实投递重复 firing 告警，但真实运维需要临时静默噪声、维护窗口和按 fingerprint 抑制。

候选范围：

- Silence / suppression / maintenance window 的领域模型。
- 按 source、severity、status、labels、fingerprint 匹配抑制。
- Event 和 Delivery 记录中保留“被抑制”的可审计证据。
- UI 中创建、启停、过期和查看 suppression。

不做：

- Incident lifecycle。
- On-call scheduling。
- Escalation policy。
- SaaS-style team ownership。

### 4. 搜索、过滤与历史排障

问题：Events 和 Deliveries 已经可查看，但生产排障需要更强的过滤、时间范围、fingerprint 聚合和历史保留策略。

候选范围：

- Events/Deliveries 时间范围过滤。
- fingerprint 视图。
- source/severity/status/destination/state 组合过滤。
- Raw/debug JSON 的 copy、collapse、search。
- Delivery history retention 策略。
- 更清晰的失败分类和 retry 结果。

不做：

- 外部全文搜索服务。
- 大数据分析系统。
- 多实例事件流平台。

### 5. 自托管发布硬化

问题：仓库已有 Docker runtime 和 health/readiness endpoint，但正式公开试用还需要发布工程闭环。

候选范围：

- Root CI workflow。
- 浏览器 E2E。
- Docker build / compose smoke。
- 生产部署文档。
- 备份/恢复/升级/回滚文档。
- Release checklist。
- 脱敏 runtime logs。

不做：

- Helm chart 或 Kubernetes operator，除非后续 PRD 明确需要。
- 多实例写协调。
- 托管云发布流程。

### 6. Adapter 贡献体验

问题：provider/destination registry 结构已经建立，但外部贡献者仍需要更清楚的 fixture、测试和文档路径。

候选范围：

- Provider fixture 目录规范。
- Destination fake transport 测试规范。
- Adapter contributor guide。
- 新 adapter scaffold 或 checklist。
- 默认注册与 catalog 投影测试文档化。

不做：

- 运行时第三方插件安装。
- Marketplace。
- 动态加载远程 adapter。

## 建议优先级

建议下一轮先讨论 **Destination 结构化模板引擎**。理由：

- 它直接把 MVP 的文本模板能力收敛到结构化 `template` model。
- 飞书、Slack、Email、generic webhook 都会从中受益。
- 它能保持在现有 `@vane/destinations` 和 console feature 边界内，不需要改变部署架构。
- 它会自然产生清晰 issue：core schema、template renderer、Feishu card、Slack blocks、Email HTML、UI preview、TOML、测试。

第二优先级建议是 **Route Authoring 与 Explain**，因为它提升用户对告警路由的信任。

## 下一步工作流

1. 选择一个候选方向。
2. 讨论用户故事、非目标、验收标准和架构边界。
3. 用 `to-prd` 产出独立 PRD，例如 `docs/prd/destination-template-engine.md`。
4. Review PRD，必要时更新 `docs/architecture/*`。
5. 用 `to-issues` 拆成可独立领取的垂直切片。
6. 再进入实现。
