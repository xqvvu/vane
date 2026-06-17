# Vane

Vane 是面向自托管 SRE 场景的告警中枢语境。它描述上游告警如何进入、规范化、路由，并投递到团队通知通道。

## Language

**告警中枢**:
接收多个上游监控系统告警、统一规范化、按规则路由并投递到通知通道的单个私有部署。
_Avoid_: SaaS 平台、通用工作流引擎

**告警源**:
一个上游监控系统或自定义发送方在 Vane 中的独立接入口，拥有自己的 Webhook URL 和认证凭据。
_Avoid_: 来源、入口、上游账号

**上游监控系统**:
向 Vane 发送告警载荷的外部系统，例如 Grafana、SigNoz、Uptime Kuma 或 Alertmanager。
_Avoid_: 客户端、生产者

**告警解析器**:
理解某类上游告警载荷并把它解释为 Vane 通用告警语义的适配能力。
_Avoid_: importer、workflow step

**告警解析器适配器**:
告警解析器在代码中的扩展单元，包含配置描述、解析行为和安全边界声明。
_Avoid_: parser class、plugin

**规范化告警**:
Vane 用于跨上游系统路由和展示的通用告警表达，包含标题、消息、级别、状态、标签、指纹和发生时间。
_Avoid_: 原始载荷、provider payload

**告警标签**:
附着在规范化告警上的短字符串键值对，用于表达服务、环境、集群、命名空间、团队等可路由上下文。
_Avoid_: metadata、raw fields

**告警事件**:
一个告警源向 Vane 发送一次 Webhook 后留下的不可变接收记录；它可以代表触发、恢复、测试通知、心跳或通用告警载荷。
_Avoid_: incident、case、alert item

**路由规则**:
根据告警源、级别、状态、标签、标题或消息匹配规范化告警，并选择一个或多个投递目标的规则。
_Avoid_: workflow、pipeline、automation

**投递目标**:
Vane 可以发送通知的外部通道或系统，例如飞书、Slack、Email 或通用 Webhook。
_Avoid_: channel、sink、output

**投递发送器**:
理解某类投递目标配置，并把规范化告警发送到对应外部通道的适配能力。
_Avoid_: job runner、route executor

**投递发送器适配器**:
投递发送器在代码中的扩展单元，包含配置描述、预览/发送行为和安全边界声明。
_Avoid_: sender class、plugin

**投递**:
一次把某个告警事件发送到某个投递目标的异步尝试记录，包含状态、重试和失败信息。
_Avoid_: notification、message
