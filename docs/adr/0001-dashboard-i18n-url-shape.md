# Dashboard i18n URL shape

Vane 的 dashboard 是登录后的自托管运维 console，不依赖按语言区分的公开 URL、SEO 或可索引内容。我们决定 dashboard 路径保持语言无关，例如 `/events`、`/sources`、`/settings`；界面语言由请求级语言解析、浏览器语言或用户偏好决定。外部 webhook 和 API 路径不参与本地化，避免上游集成 URL 因界面语言变化而改变。

Vane dashboard 首批支持 `en-US` 和 `zh-Hans`。默认 fallback locale 是 `en-US`，因为当前 UI 文案、测试基线和 SRE 集成术语以英文为主；请求或浏览器语言匹配到简体中文时归一化为 `zh-Hans`。`zh`、`zh-CN`、`zh-SG`、`zh-Hans` 都视为 `zh-Hans`，`en` 和 `en-US` 都视为 `en-US`。

语言偏好先存为 per-browser cookie，例如 `vane_locale`，不写入 Better Auth `user` 表，也不作为全局 app settings。解析顺序是 cookie、请求或浏览器语言、`en-US` fallback。这样每个管理员可以在自己的浏览器里选择语言，不会因为全局设置影响同一部署里的其他使用者，也避免 MVP 阶段为了语言偏好引入用户资料迁移。

首版消息运行时采用 `use-intl`，不引入 Paraglide/codegen。Vane 当前主要需要登录后 console 的 UI 文案、表单校验、toast、少量插值和日期数字格式；`use-intl` 的 React provider 与 SSR 模型足够覆盖这些需求。Paraglide 的 compile-time message functions 和 URL localization 对公开、多语言路由站点更有价值，但会在当前阶段增加 Vite plugin、生成文件和 routing 集成复杂度。

i18n 代码作为 console 的顶层应用能力放在 `apps/console/src/i18n/`，而不是藏在 `integrations/` 下。消息文件用 JSON 组织在 `apps/console/src/i18n/messages/{en-US,zh-Hans}.json`，由源码 import 参与 SSR 和打包，不放到 `public/` 里做运行时 fetch。这样翻译文件对人工编辑和翻译工具友好，同时避免首屏额外请求、缓存版本和 SSR/client 消息不一致的问题。

首版 i18n 迁移采用全量用户可见文案抽取，而不是渐进抽取。应抽取导航、标题、按钮、表格列、空状态、表单 label/description/error、toast、dialog、badge label、404/error 页面，以及技术枚举的显示标签。不得翻译稳定协议值、URL path、TOML 字段名、JSON/raw payload key、数据库存储值、provider 或 destination kind 的机器值、Source token、webhook URL、日志和 debug 原始数据。

语言切换入口在登录前后分开呈现，但写入同一个 cookie。`/login` 和 `/setup` 在右上角提供紧凑语言选择器，dashboard 登录后把语言选择放在 user menu 内；Settings 可以展示当前语言，但不把语言保存为全局部署设置。切换语言后刷新或重新导航当前页，让 SSR 与 client 使用同一份 locale 和 messages。

i18n 边界停在 console UI 层。Server functions、services、webhook API、`@vane/core`、provider adapters 和 destination senders 不直接读取 locale，也不返回已本地化字符串。UI 可以把已知错误码、状态码和枚举值映射成本地化展示；未知错误、destination transport error、provider parser error、历史 `lastError`、raw/debug 数据和 webhook API response 保持原文并继续走现有脱敏规则。

i18n 测试以英文为默认 UI 测试基线。组件和路由测试默认固定 `en-US`，避免为每个页面复制双语断言；单独维护 i18n 测试覆盖 message key parity、locale 归一化、cookie 优先级、`Accept-Language` fallback 和 root `<html lang>`。`zh-Hans` 只需要少量 smoke test 覆盖登录页或 shell/nav 等关键入口。server、service 和 package 测试继续断言机器值、错误码和原始错误。

**Considered Options**

- 使用 `/zh-Hans/...`、`/en-US/...` 这类 locale prefix。它适合公开站点，但会增加 auth redirect、复制链接、route tree、webhook 文档和外部集成路径的复杂度。
- 保持 console URL 语言无关。它更符合 authenticated app 的使用方式，也让现有 dashboard URL、Source webhook URL 和未来 API 边界稳定。
- 使用 Paraglide/codegen 作为消息系统。它能提供很强的编译期能力，但当前 dashboard i18n 不需要把 URL localize，也不值得为了首版翻译引入新的生成流水线。
- 把 messages 放到 `public/` 并由浏览器运行时请求。这会让翻译文件更像静态资产，但会增加 SSR 首屏、加载失败和缓存版本处理复杂度。
- 渐进抽取用户可见文案。它能降低单次 diff，但 Vane 仍处于 MVP 阶段，现在全量抽取比未来回头追散落文案更便宜。
