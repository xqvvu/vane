# PRD: Destination 结构化模板引擎

Labels: `ready-for-agent`

## Problem Statement

Vane 的 MVP 已经支持 Destination message template，但当前能力本质上是文本插值。它可以覆盖飞书文本消息、Slack 正文、Email 文本正文和 generic webhook 的 `message` 字段，却无法表达飞书交互式卡片、Slack blocks、Email HTML 或通用 webhook 的结构化 JSON payload。

SRE 用户配置告警通知时，不只需要“把标题和消息拼成一段文本”，还需要按团队通知规范组织结构化消息：突出 severity/status、展示关键 labels、链接回 Vane Event detail，并在飞书卡片或后续 Slack blocks 中形成可读、可预览、可测试的消息。

同时，模板配置必须保持 Vane 的安全边界：不能执行用户 JavaScript、shell、SQL 或动态代码；不能把 source token、destination secret、raw sensitive payload 或 webhook URL 暴露到浏览器、TOML 默认导出、Delivery rendered payload 或普通日志中。

## Solution

引入 Destination-aware 的结构化模板引擎。模板仍然作为 Destination config 的一部分，不引入独立 Template 资源。

本轮实现共享模板基础设施，并以 Feishu 作为首个落地 Destination：

- Feishu 支持 `text` 与 `feishu_card` 两种模板模式。
- `messageTemplate` 被 `template` 完全替代，不做迁移兼容。
- 模板语言只支持安全路径插值，不支持条件、循环、表达式、函数调用或默认值表达式。
- 结构化 JSON 模板递归遍历字符串字段并做变量插值。
- 模板保存前必须通过 mode、基础结构、变量路径、大小和长度校验。
- Preview 返回 rendered payload、safe template context、diagnostics，并可用内置样例 Event 或历史 Event 作为样本。
- UI 为模板编辑提供变量参考、样例事件、normalized fields、redacted raw payload reference、rendered payload 和错误定位。

第一版不做飞书卡片拖拽设计器。用户直接编辑卡片 JSON/template，并通过 preview/test 验证平台是否接受。

## User Stories

1. As an SRE, I want a Destination to have a structured template config, so that message formatting is owned by the Destination that sends it.
2. As an SRE, I want Feishu Destinations to choose between text and card templates, so that simple teams can keep text while advanced teams can use cards.
3. As an SRE, I want Feishu card templates to use Feishu-native card JSON, so that I can copy patterns from Feishu documentation without learning a Vane-specific card DSL.
4. As an SRE, I want template strings to interpolate normalized alert fields, so that notification content can include title, message, severity, status, fingerprint, labels, and occurred time.
5. As an SRE, I want template strings to interpolate Source and Destination summaries, so that notifications can show where an alert came from and where it was sent.
6. As an SRE, I want a safe Vane Event URL variable, so that notification cards can link back to the Event detail page.
7. As an SRE, I want the template editor to show all available variables, so that I do not need to guess field names.
8. As an SRE, I want each variable to show example values, so that I can understand what will appear in the notification.
9. As an SRE, I want to click a variable to insert it into the template, so that template authoring is less error-prone.
10. As an SRE, I want to preview templates with a built-in sample Event, so that I can configure a Destination before real Events exist.
11. As an SRE, I want to preview templates with a recent historical Event, so that I can test formatting against real SigNoz, Grafana, Uptime Kuma, Alertmanager, or generic payloads.
12. As an SRE, I want the preview to show normalized Event fields, so that I can understand the stable data available to templates.
13. As an SRE, I want the preview to show redacted raw payload reference, so that I can understand what the upstream system sent.
14. As an SRE, I want raw payload to be reference-only, so that templates do not couple directly to unstable provider payload internals.
15. As an SRE, I want unknown template variables to fail validation before save, so that broken templates do not create broken Deliveries later.
16. As an SRE, I want template errors to identify the JSON path where they occur, so that I can fix card templates quickly.
17. As an SRE, I want the rendered payload preview to omit Feishu signing fields, so that previews remain secret-safe.
18. As an SRE, I want Destination test to use the same renderer as real delivery, so that a successful test means the saved template and credentials work together.
19. As an SRE, I want Feishu platform rejection to be recorded separately from local template validation failure, so that I know whether Vane or Feishu rejected the message.
20. As an SRE, I want template rendering failures during Delivery to be non-retryable configuration errors, so that the worker does not waste retries on invalid config.
21. As an SRE, I want TOML import/export to use the new `template` shape, so that portable config represents the actual destination message format.
22. As an SRE, I want `messageTemplate` removed from new config, so that there is a single template model.
23. As an open-source contributor, I want shared template renderer and diagnostics primitives, so that future Slack blocks, Email HTML, and generic JSON templates can reuse the same safety model.
24. As an open-source contributor, I want adapter manifests to declare template modes and defaults, so that the console can render the right editing experience without adapter runtime internals.
25. As a security-conscious operator, I want templates to avoid user code execution, so that Vane does not become a remote code execution surface.
26. As a security-conscious operator, I want source tokens, destination secrets, raw sensitive headers, and webhook URLs excluded from template context, so that notifications cannot leak secrets.
27. As a maintainer, I want templates to remain Destination config JSON, so that this feature does not introduce new persistence relations before reuse is proven.

## Implementation Decisions

- Destination templates remain adapter-owned config data stored in the existing Destination config JSON.
- No Template table, Template list page, reusable template library, or new persistence relation is introduced.
- `template` completely replaces `messageTemplate`. This is allowed because Vane has not reached a stable public release.
- No migration compatibility is required for old `messageTemplate` config.
- TOML import/export accepts and emits `template`, not `messageTemplate`.
- Adapter rendering must read `template` only.
- New Destination creation should write an explicit `template` using the adapter default.
- Adapter defaults may be used as server-side fallback for incomplete drafts or tests, but persisted config should be explicit.
- The first implementation includes shared template model, renderer, diagnostics, and Feishu `text` / `feishu_card` modes.
- Slack, Email, and generic webhook may receive minimal `template.mode = "text"` compatibility, but Slack blocks, Email HTML, and generic JSON editor are out of this first implementation.
- Feishu card templates use Feishu-native card JSON. Vane does not define a neutral card abstraction.
- Vane validates template safety and basic payload shape, but does not attempt to fully mirror the upstream platform's card schema.
- Destination test remains the authoritative integration check for platform-specific acceptance.
- Feishu `feishu_card` wire payload is `{ msg_type: "interactive", card }`.
- Feishu preview/rendered payload must omit `timestamp`, `sign`, webhook URL, and sign secret.
- Template language supports path interpolation only, using `{{event.title}}` style variables.
- Template language does not support expressions, function calls, conditionals, loops, default-value expressions, JavaScript, shell, SQL, or dynamic code.
- JSON templates are rendered by recursively interpolating string values only.
- Unknown variables fail validation before save.
- Missing allowed label values render as empty strings.
- Template context v1 includes safe Event, Source, Destination, and Vane link fields.
- Template context v1 does not include raw payload, raw headers, source token, destination config, destination secret, route internals, delivery attempt state, or last errors.
- `event.id` maps to the current render input Event id.
- `vane.eventUrl` is generated by the console/server runtime and passed into rendering context. Destination adapters do not generate dashboard URLs.
- If a safe Vane URL cannot be generated, `vane.eventUrl` renders as an empty string.
- Historical raw payload is available in preview only as redacted reference data. Templates cannot reference raw payload paths.
- Preview supports an internal sample Event and may support a selected historical Event through `sampleEventId`.
- Historical Event samples are dashboard-authenticated and return only safe normalized data plus redacted raw payload reference.
- Historical Event sample selection is not required to prove that the current Destination would receive that Event through Routes.
- Preview returns structured diagnostics, not only thrown string errors.
- Template validation errors at save time reject create/update.
- Runtime template failures become `configuration_error` with `retryHint = "not_retryable"`.
- Feishu platform rejection remains `target_rejected` or existing HTTP classification, separate from local template validation.

## Testing Decisions

- The primary test seam for renderer behavior is `@vane/destinations` unit tests over template model, context construction helpers, interpolation, diagnostics, and Feishu preview/send behavior.
- Feishu sender tests should assert both text and card wire payloads using fake fetch and deterministic clock.
- Feishu tests must assert preview/rendered payloads do not include signing fields or secrets.
- Template tests should assert unknown variables fail before rendering, missing labels render as empty strings, and JSON path diagnostics identify nested string fields.
- Registry tests should assert destination catalog remains client-safe and exposes template mode metadata without leaking schema, send functions, or secret fields.
- Configuration integration tests should assert Destination create/update rejects invalid templates and TOML import/export uses `template`.
- Destination service preview tests should assert preview returns safe context, rendered payload, diagnostics, and redacted raw payload reference when a historical Event sample is selected.
- UI tests should focus on user-visible behavior: selecting Feishu template mode, editing JSON, inserting variables, previewing with a sample Event, seeing diagnostics, and avoiding secret exposure.
- Delivery worker or delivery execution tests should assert runtime template configuration errors are non-retryable.
- Tests should prefer external behavior at package/service/UI boundaries over private helper implementation details.

## Out of Scope

- Independent Template resources or template reuse across Destinations.
- Long-term compatibility with `messageTemplate`.
- Migration logic for old `messageTemplate` data.
- User JavaScript, expression language, shell, SQL, dynamic code, loops, conditionals, functions, or default-value expressions.
- Direct raw payload variables such as `{{raw.*}}`.
- Direct source token, destination config, destination secret, raw header, route, or delivery attempt variables.
- Complete Feishu card schema replication.
- Feishu card drag-and-drop designer or WYSIWYG editor.
- Feishu interactive callback/action handling.
- Slack blocks implementation.
- Email HTML implementation.
- Generic webhook JSON payload template implementation.
- Kubernetes/Helm/deployment changes.
- New database table, column, or persistence relation.

## Further Notes

- This PRD should be implemented as vertical slices. The recommended first slice is shared destination template model/renderer/diagnostics plus Feishu text/card rendering in `@vane/destinations`.
- The second slice should expose Feishu template modes through manifest/catalog and adapt config/TOML/form data away from `messageTemplate`.
- The UI slice should only begin after preview diagnostics and result shape are stable enough to avoid editor churn.
- Future destination modes should reuse the same TemplateContext and diagnostics model unless a follow-up PRD explicitly changes the safety boundary.
