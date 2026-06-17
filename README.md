# Vane

Vane 是一个面向 SRE 和运维团队的开源、自托管 Alert Hub。它接收来自 SigNoz、Grafana、Uptime Kuma、Alertmanager 或自定义系统的告警 webhook，将 payload 规范化为统一事件，再按简单、可审计的规则路由到 Feishu、Slack、Email 或通用 webhook 等通知目标。

Vane 的目标不是做 SaaS 平台，也不是做通用工作流引擎。它更接近一个可以私有部署的运维基础设施组件：一个进程、一个 SQLite 数据库、一个数据卷，清楚记录告警从进入、规范化、匹配、投递、重试到失败的完整路径。

> 当前项目仍处于 MVP 开发阶段。核心架构、控制台、SQLite 持久化、认证、配置、投递与 UI 基础已经在仓库中推进，但还不应视为稳定发布版。

## 为什么需要 Vane

团队常常同时使用多套监控与告警系统。每个系统都要分别配置 Feishu、Slack、邮件或 webhook，导致：

- 通知渠道和密钥分散在多个上游系统中。
- 告警路由规则重复、难以审计。
- 无法统一回答“Vane 收到了什么、匹配了哪条规则、发送到了哪里、为什么失败”。
- 上游重试、目的端故障、重复告警和敏感字段处理缺乏一致策略。

Vane 把这些能力集中到一个私有部署里：

- Sources 代表上游告警发送方，每个 Source 有独立 webhook URL 和 token。
- Events 记录每次进入 Vane 的 webhook 请求和规范化后的告警字段。
- Routes 用简单条件匹配 Source、severity、status、labels、title、message。
- Destinations 保存通知目标配置与模板，密钥只留在服务端。
- Deliveries 异步投递并记录状态、尝试次数、失败原因和重试计划。

## 当前能力

仓库当前实现围绕 MVP Alert Hub 方向展开：

- TanStack Start 控制台，包含登录、首次 setup、dashboard shell、Sources、Routes、Destinations、Events、Deliveries 和 Settings 页面。
- Better Auth dashboard 登录；首次注册用户可成为 owner。
- SQLite-first 持久化层，显式 migrations，仓储按 Sources、Destinations、Routes、Intake、Deliveries、History、Settings 切分。
- Provider parser registry：`generic`、`signoz`、`grafana`、`uptime_kuma`、`alertmanager`。
- Destination sender registry：`generic_webhook`、`feishu`、`slack`、`email`。
- Route rule、normalized event、delivery job、portable config 等核心 schema 位于 `@vane/core`。
- SQLite-backed in-process delivery worker，支持异步投递、状态记录、失败重试和手动运行。
- TOML import/export 基础，默认避免导出明文 secret，并支持环境变量引用。
- shadcn/base-ui 风格的紧凑运维 UI，包含错误页、404、profile menu、toast、loading skeleton 等基础体验。
- Dockerfile 与 docker-compose 本地自托管形态。

## 项目结构

```txt
apps/console
  TanStack Start console。拥有 UI、API routes、Better Auth、SQLite、migrations、
  server functions、application services、in-process worker 和 Docker runtime。

packages/core
  共享领域 schema、类型、路由规则、delivery 类型、config schema、JSON helper、
  redaction helper 和共享错误。

packages/providers
  入站 provider parser 与 provider registry。

packages/destinations
  出站 destination sender、message template 与 destination registry。

docs
  PRD 与架构文档。产品范围以 docs/prd/self-hosted-alert-hub-mvp.md 为准。
```

更详细的架构说明见：

- `docs/prd/self-hosted-alert-hub-mvp.md`
- `docs/architecture/frontend-architecture.md`
- `docs/architecture/sqlite-store.md`
- `docs/architecture/application-container.md`

## 本地开发

要求：

- Node.js `24.x`
- pnpm `11.5.3`

安装依赖：

```bash
pnpm install
```

准备 console 环境变量：

```bash
cp apps/console/.env.example apps/console/.env.local
```

启动开发服务器：

```bash
pnpm --filter @vane/console dev
```

运行检查：

```bash
pnpm --filter @vane/console fmt
pnpm --filter @vane/console lint
pnpm --filter @vane/console test
pnpm --filter @vane/console build
```

常用环境变量：

| 变量 | 说明 |
| --- | --- |
| `BETTER_AUTH_URL` | Better Auth 对外 URL，本地通常是 dev server URL。 |
| `BETTER_AUTH_SECRET` | Better Auth secret，生产必须使用 32+ 字符随机值。 |
| `SERVER_URL` | Vane 对外访问 URL，用于生成 webhook URL 等。 |
| `VANE_DATABASE_PATH` | SQLite 数据库路径。 |
| `VANE_MAX_WEBHOOK_BYTES` | 入站 webhook 最大 payload 大小。 |
| `VANE_WORKER_BATCH_SIZE` | delivery worker 每批处理数量。 |
| `VANE_WORKER_INTERVAL_MS` | delivery worker 轮询间隔。 |

## Docker 试运行

本地构建并启动：

```bash
BETTER_AUTH_SECRET="$(openssl rand -hex 32)" docker compose up --build
```

默认服务会暴露在 `http://localhost:3000`，SQLite 数据放在 `vane-data` volume 中。

## Roadmap

### 0. 已落地的基础

- 建立 Vane 的领域语言：Sources、Events、Routes、Destinations、Deliveries、History。
- 建立 monorepo 包边界：`core`、`providers`、`destinations`、`console`。
- 建立 SQLite-first store、显式 migrations 和 repository 分层。
- 建立 application container、request context、dashboard auth 与 webhook auth 分离。
- 建立 provider parser registry 和 destination sender registry。
- 建立 TanStack Start 控制台的 route-first + feature module 方向。
- 建立 dashboard auth、first setup、error/not-found、toast、skeleton、profile menu 等基础体验。

### 1. MVP 功能收尾

- 完善 Source 生命周期：创建、禁用、更新、token 轮换、额外共享密钥校验与审计提示。
- 完善 webhook intake：payload size limit、redaction、provider parse error、duplicate request dedupe、快速 accepted response。
- 完善 Event detail：normalized fields、raw debug view、route match 解释、关联 deliveries。
- 完善 Delivery detail：rendered payload、attempt history、last error、next attempt、手动 retry。
- 完善 Route authoring：更清晰的条件编辑、匹配预览、目标 destination 多选与规则解释。
- 完善 Destination test/preview：真实发送测试、模板预览、失败信息脱敏展示。
- 完善 TOML import/export：secret env ref、导入差异预览、校验错误定位、配置迁移策略。
- 补齐端到端 workflow 测试：Source -> Event -> Route -> Delivery -> retry/history。

### 2. 自托管发布硬化

- 整理生产部署文档：Docker、反向代理、数据卷、备份恢复、升级步骤。
- 明确 migration 与版本升级策略，保证 SQLite schema 向前兼容。
- 增加 webhook、worker、delivery、auth 的运行时观测日志。
- 增加配置和敏感字段的安全测试，防止 token hash、destination secret、raw secret config 泄露到客户端。
- 明确默认 retention 策略，限制 raw payload 与 delivery history 的 SQLite 增长。
- 增加 release checklist 和示例配置。

### 3. 集成扩展

- 为常见 provider 增加更多真实 fixture：SigNoz、Grafana、Uptime Kuma、Alertmanager 的多版本 payload。
- 为 Feishu、Slack、Email、Generic webhook 增强模板与卡片格式。
- 增加更多 destination adapter，例如 Discord、Telegram、Teams 或企业内部 webhook 规范。
- 增加 provider/destination contributor guide，让外部贡献者可以只实现 adapter、fixtures 和 tests。

### 4. 运维体验增强

- 更强的搜索和筛选：按 source、severity、status、destination、delivery state、fingerprint、时间范围过滤。
- 更好的 retry 操作：批量 retry、retry reason、retry 后差异记录。
- 更清晰的 route explain：某个 Event 为什么匹配或没有匹配某条 Route。
- 更细的 dashboard 权限：owner/admin/member 的只读与管理边界。
- 更完善的配置审计：谁在何时改了 Source、Route、Destination 或 Settings。

### 5. MVP 之后的可能方向

这些能力为未来保留空间，但不是 MVP 承诺：

- Silence、suppression、maintenance window。
- Alert grouping、per-fingerprint mute、重复告警聚合。
- Incident lifecycle、on-call scheduling、escalation policy。
- 多实例部署、分布式队列、Postgres/Redis/Kafka/Temporal 等外部中间件。
- SaaS tenant、billing、organization workspace。
- 稳定公开管理 REST API。
- Vane-owned YAML 配置格式。

## 设计约束

- 默认部署形态是单进程、SQLite、一个 Docker image、一个数据卷。
- Dashboard auth 和 webhook auth 是两条不同边界；webhook intake 不依赖浏览器 session。
- Route rules 和 message templates 不执行用户提供的 JavaScript、shell、SQL 或动态代码。
- Secrets 保持 server-side，不进入 route loader data、query data、client props、TOML 默认导出或浏览器日志。
- UI 面向重复使用的运维工作流，优先表格、筛选、详情、明确启停和可审计动作。
- Vane-owned portable config 使用 TOML，不使用 YAML。

## 贡献方向

优先贡献这些小而清晰的切片：

- 新 provider parser：adapter、fixtures、normalization tests、registry registration。
- 新 destination sender：config schema、send/preview、secret handling tests、registry registration。
- 控制台 feature：保持 route thin，把表单、表格、query/mutation 放入 `features/*`。
- SQLite 变更：新增 forward-only migration，并补 migration/store tests。
- 文档变更：中文优先，产品范围和架构决策写入 `docs`。

请先阅读 `AGENTS.md` 和 `docs/prd/self-hosted-alert-hub-mvp.md`。它们定义了当前仓库的工作方式、产品范围和非目标。
