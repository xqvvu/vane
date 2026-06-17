# MVP RC 收尾 Checklist

本文档记录 Vane 进入 MVP Release Candidate（RC）收尾阶段的范围、非目标、工作项和验收 gate。产品范围仍以 `docs/prd/self-hosted-alert-hub-mvp.md` 为准；架构规则仍以 `AGENTS.md` 和 `docs/architecture/*` 为准。

## 阶段目标

Vane 当前不再按“继续扩新 feature”的方式推进，而进入 **MVP RC 收尾**：把已经跑通的 Source → Webhook intake → Event → Route → Destination → Delivery → Worker → History 主链路打磨到可信、可演示、可自托管试用、可维护。

RC 阶段优先处理：

1. 影响信任的功能缺口。
2. 影响排障和配置理解的 UI 缺口。
3. 影响后续维护的前端/服务边界债务。
4. 影响公开试用的 CI、E2E、Docker、部署文档和 release gate。

## 非目标

RC 阶段不主动扩展以下方向：

- Silence、suppression、maintenance window。
- Incident lifecycle、on-call scheduling、escalation policy。
- 更多 destination/provider 适配器，除非为了修复现有主链路。
- SaaS tenant、organization workspace、billing、多实例部署。
- 稳定 public management REST API。
- 大规模视觉重设计或 marketing-style dashboard。
- 重写路由规则系统或引入通用 workflow engine。

## 已定边界

### Route builder

RC 内 Route builder 必须完整 round-trip `RouteRule` 的核心 schema：

- 多个告警源匹配。
- 多个 severity/status 匹配。
- 多个 label 条件。
- title/message contains 条件。
- 多个投递目标。

UI 不应把 TOML/import 进来的有效规则悄悄压扁成单条件规则。如果某个合法结构暂不提供友好编辑控件，必须以只读/受限编辑方式明确提示，而不是静默丢失。

### Webhook authentication

RC 的公开承诺是：

- `接入 Token` 是每个告警源默认和主要的 Webhook 认证方式。
- `额外共享密钥` 是 Vane 侧可选的第二层共享密钥校验。
- RC 不承诺 Grafana、SigNoz、Alertmanager 等上游监控系统的原生签名协议或时间戳校验。

因此 UI、catalog、README、PRD follow-up 和代码命名应避免把当前额外共享密钥暗示为 provider-native secret/signature。

### Delivery worker

RC 内需要完成可靠性硬化：

- stale `running` delivery reclaim / timeout。
- honor destination adapter `retryHint`。
- worker health / last-run 状态投影。
- 基础结构化、脱敏 runtime logs。
- 对 crash/restart recovery、retry scheduling、manual retry 的测试覆盖。

### 前端架构

RC 采用中等范围架构整理，不做全面重写：

- 将 Events 和 Deliveries 从 `features/operations` 的混合 query/server function 中拆出。
- Events 页面只查询 Events；Deliveries 页面只查询 Deliveries。
- Event/Delivery detail 返回列表时保留 filter/search/cursor 状态。
- Source/Destination forms 使用 server catalog，而不是硬编码 adapter/provider 列表。
- Sources、Routes、Destinations 增加基础 URL search state，至少覆盖搜索、分页或常用过滤。

### UI polish

RC UI 优化是“信任导向 polish”，只服务于运维排障与配置理解：

- Route explain / 规则摘要更清楚。
- Event detail 清楚展示规范化字段、脱敏 raw debug data、route matches、关联 deliveries。
- Delivery detail 清楚展示 rendered payload、attempts、last error、next attempt、retry 结果。
- Debug JSON 支持复制、折叠或更易读展示。
- Sources、Routes、Destinations、Events、Deliveries 的表格密度、状态 badge 和显式动作保持一致。

不以 RC 为理由做大范围视觉重设计。

### Release gate

RC 最低发布硬化要求：

- CI 跑 workspace fmt-check、lint、tests、console build。
- 关键浏览器 E2E workflow：setup/login、创建 Source、复制 webhook URL、创建/测试 Destination、创建 Route、发送 webhook、查看 Event/Delivery、过滤历史、失败 retry。
- Docker build + compose smoke test。
- health endpoint 或 container healthcheck。
- 自托管部署文档：反向代理/TLS、数据卷、备份恢复、升级/回滚、migration 策略。
- release checklist。
- 清理 starter/stale docs。
- 对 webhook、worker、delivery、auth failure 的脱敏 runtime logs。

## 工作清单

### A. 信任缺口修复

- [ ] Route builder 支持完整 round-trip `RouteRule`。
- [x] 将 provider secret 相关文案/命名收敛为额外共享密钥，避免 native provider auth 暗示。
- [ ] Source config 通过 provider adapter/catalog 做 schema 校验或明确只接受 Vane 定义的 config。
- [x] Webhook response 不向持有 Source token 的调用方泄漏不必要的 route/destination 内部信息。
- [x] Delivery worker 支持 stale running reclaim。
- [x] Delivery worker honor adapter `retryHint`。
- [x] 增加 worker health / last-run 状态。
- [ ] 增加 delivery history retention 或明确 RC 不自动清理 delivery history 的产品理由。
- [ ] 将 raw payload pruning / dedupe cleanup 从 intake hot path 中移出或限制成本。
- [ ] 评估 Delivery detail 所需的历史快照字段，避免配置重命名破坏历史解释。

### B. 前端架构整理

- [ ] 拆分 Events query/server function。
- [ ] 拆分 Deliveries query/server function。
- [ ] 移除或归档旧的 combined `OperationsPanel`。
- [ ] Event detail back link 保留原列表 URL state。
- [ ] Delivery detail back link 保留原列表 URL state。
- [ ] Source form 使用 provider catalog。
- [ ] Destination form 使用 destination catalog。
- [ ] Sources 列表增加基础 search/filter/pagination URL state。
- [ ] Routes 列表增加基础 search/filter/pagination URL state。
- [ ] Destinations 列表增加基础 search/filter/pagination URL state。

### C. 信任导向 UI polish

- [ ] Route rule editor 支持多条件可视编辑或明确受限编辑提示。
- [ ] Route summary / explain 文案使用运维人员可理解的中文。
- [ ] Event detail 的 normalized fields、raw debug data、route matches、deliveries 分区更清楚。
- [ ] Delivery detail 的 rendered payload、attempts、last error、next attempt、retry 操作更清楚。
- [ ] Raw/debug JSON 增加 copy/collapse/search 中至少一种实用能力。
- [ ] Sources、Routes、Destinations 表格动作密度和状态呈现对齐。
- [ ] Header 中 inert notification/help buttons 删除、隐藏或接上真实入口。

### D. 测试与发布硬化

- [ ] 增加 root/workspace CI workflow。
- [ ] 增加关键浏览器 E2E workflow。
- [ ] 增加 Docker build/compose smoke test。
- [ ] 增加 health endpoint 或 Docker `HEALTHCHECK`。
- [x] 增加 worker crash/restart recovery 测试。
- [ ] 增加 secret-safe logging 测试或边界测试。
- [ ] 增加 release checklist。
- [ ] 补充 Docker 生产部署文档。
- [ ] 补充备份/恢复/升级/回滚文档。
- [ ] 清理 `apps/console/README.md` starter 内容。
- [ ] 对齐 README、package metadata、workspace 中的 Node/pnpm 版本说明。

### E. Fixtures 与贡献体验

- [ ] 将 provider inline payload tests 扩展为 fixture 文件。
- [ ] 覆盖 SigNoz、Grafana、Uptime Kuma、Alertmanager 的多版本/代表性 payload。
- [ ] 增加 provider/destination contributor guide 或在 README 中补充贡献切片。

## 验收标准

RC 完成时，维护者应能完成以下演示路径：

1. 使用 Docker 或本地命令启动 Vane。
2. 首次 setup owner/admin 并登录 dashboard。
3. 创建一个告警源，复制 webhook URL 和接入 Token。
4. 创建一个投递目标并完成 preview/test。
5. 创建一条包含多个条件的路由规则。
6. 向 webhook 发送代表性告警载荷。
7. 在 Events 中看到规范化告警、route match、脱敏 raw debug data。
8. 在 Deliveries 中看到投递状态、attempts、rendered payload、失败与 retry 行为。
9. 重启进程后 worker 不遗留永久 running delivery。
10. 导出 TOML 时不包含明文 secret。
11. CI、测试、build、Docker smoke 和 E2E 通过。
12. 文档能指导用户完成自托管部署、备份、升级和恢复。
