// oxlint-disable typescript/no-redundant-type-constituents

/**
 * @example
 */

/* -------------------------------------------------------------------------- */
/* Feishu Webhook Interactive Card Payload                                    */
/* -------------------------------------------------------------------------- */

export type FeishuWebhookCardPayload =
  | FeishuWebhookRawCardPayload
  | FeishuWebhookTemplateCardPayload;

export type FeishuWebhookRawCardPayload = FeishuWebhookBasePayload & {
  msg_type: "interactive";
  card: FeishuCardV1 | FeishuCardV2;
};

export type FeishuWebhookTemplateCardPayload = FeishuWebhookBasePayload & {
  msg_type: "interactive";
  card: FeishuCardTemplate;
};

export interface FeishuWebhookBasePayload {
  /**
   * 开启 webhook 签名校验时需要。
   * 秒级 Unix timestamp。
   */
  timestamp?: string | number;

  /**
   * 开启 webhook 签名校验时需要。
   */
  sign?: string;
}

/* -------------------------------------------------------------------------- */
/* Shared Basic Types                                                         */
/* -------------------------------------------------------------------------- */

export type FeishuLocale = "zh_cn" | "en_us" | "ja_jp" | "zh_hk" | "zh_tw" | string;

export type FeishuTextTag = "plain_text" | "lark_md";

export interface FeishuText<T extends FeishuTextTag = FeishuTextTag> {
  tag: T;
  content: string;

  /**
   * JSON 2.0 常见局部多语言字段。
   */
  i18n_content?: Partial<Record<FeishuLocale, string>>;
}

export type FeishuPlainText = FeishuText<"plain_text">;
export type FeishuMarkdownText = FeishuText<"lark_md">;

export type FeishuHeaderTemplate =
  | "blue"
  | "wathet"
  | "turquoise"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "carmine"
  | "violet"
  | "purple"
  | "indigo"
  | "grey"
  | "default"
  | string;

export type FeishuTextAlign = "left" | "center" | "right";

export type FeishuVerticalAlign = "top" | "center" | "bottom";

export type FeishuHorizontalAlign = "left" | "center" | "right";

export type FeishuButtonType =
  | "default"
  | "primary"
  | "danger"
  | "text"
  | "primary_text"
  | "danger_text"
  | "primary_filled"
  | "danger_filled"
  | "laser"
  | string;

export type FeishuButtonSize = "tiny" | "small" | "medium" | "large" | string;

export type FeishuButtonWidth = "default" | "fill" | string;

export type FeishuSelectWidth = "default" | "fill" | string;

export type FeishuDimension = string;

export type FeishuUrl = string;

export interface FeishuMultiUrl {
  url?: FeishuUrl;
  default_url?: FeishuUrl;
  pc_url?: FeishuUrl;
  ios_url?: FeishuUrl;
  android_url?: FeishuUrl;
}

export interface FeishuConfirm {
  title: FeishuPlainText;
  text: FeishuPlainText | FeishuMarkdownText;
}

export interface FeishuOption {
  text: FeishuPlainText;
  value: string;
  icon?: FeishuIcon;
  disabled?: boolean;
  disabled_tips?: FeishuPlainText;
}

export type FeishuIcon = FeishuCustomIcon | FeishuStandardIcon;

export interface FeishuCustomIcon {
  tag: "custom_icon";
  img_key: string;
}

export interface FeishuStandardIcon {
  tag: "standard_icon";
  token: string;
  color?: string;
}

export interface FeishuCardSummary {
  content: string;
  i18n_content?: Partial<Record<FeishuLocale, string>>;
}

/* -------------------------------------------------------------------------- */
/* Template Card                                                              */
/* -------------------------------------------------------------------------- */

export interface FeishuCardTemplate {
  type: "template";
  data: {
    template_id: string;
    template_version_name?: string;
    template_variable?: Record<string, unknown>;
  };
}

/* -------------------------------------------------------------------------- */
/* Card JSON 1.0                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Card JSON 1.0 / 旧版卡片结构。
 *
 * 特征：
 * - 没有 schema: "2.0"
 * - elements 在 card 顶层
 * - 按钮跳转常见字段是 url / multi_url
 */
export interface FeishuCardV1 {
  config?: FeishuCardV1Config;
  header?: FeishuCardV1Header;

  /**
   * JSON 1.0 正文元素在顶层。
   */
  elements: FeishuCardV1Element[];

  /**
   * JSON 1.0 支持全局多语言元素。
   */
  i18n_elements?: Partial<Record<FeishuLocale, FeishuCardV1Element[]>>;

  /**
   * JSON 1.0 常见多语言 header。
   */
  i18n_header?: Partial<Record<FeishuLocale, FeishuCardV1Header>>;

  /**
   * 卡片整体点击跳转。
   */
  card_link?: FeishuMultiUrl;

  /**
   * JSON 1.0 里可能存在的全局降级配置。
   */
  fallback?: Record<string, unknown>;

  [extra: string]: unknown;
}

export interface FeishuCardV1Config {
  /**
   * 宽屏模式。
   */
  wide_screen_mode?: boolean;

  /**
   * 是否允许转发。
   */
  enable_forward?: boolean;

  /**
   * 是否为共享卡片。
   */
  update_multi?: boolean;

  /**
   * 消息列表预览摘要。
   */
  summary?: FeishuCardSummary;

  [extra: string]: unknown;
}

export interface FeishuCardV1Header {
  title: FeishuPlainText | FeishuMarkdownText;
  subtitle?: FeishuPlainText | FeishuMarkdownText;
  template?: FeishuHeaderTemplate;

  [extra: string]: unknown;
}

export type FeishuCardV1Element =
  | FeishuCardV1DivElement
  | FeishuCardV1MarkdownElement
  | FeishuCardV1ImageElement
  | FeishuCardV1HrElement
  | FeishuCardV1ActionElement
  | FeishuCardV1NoteElement
  | FeishuCardV1ColumnSetElement
  | FeishuCardV1FormElement
  | FeishuCardV1InputElement
  | FeishuCardV1SelectElement
  | FeishuCardV1DatePickerElement
  | FeishuCardV1OverflowElement
  | FeishuCardV1UnknownElement;

export interface FeishuCardV1BaseElement<TTag extends string = string> {
  tag: TTag;
  element_id?: string;
  [extra: string]: unknown;
}

export interface FeishuCardV1DivElement extends FeishuCardV1BaseElement<"div"> {
  text?: FeishuPlainText | FeishuMarkdownText;
  fields?: Array<{
    is_short?: boolean;
    text: FeishuPlainText | FeishuMarkdownText;
  }>;
  extra?: FeishuCardV1Element;
}

export interface FeishuCardV1MarkdownElement extends FeishuCardV1BaseElement<"markdown"> {
  content: string;
  text_align?: FeishuTextAlign;
}

export interface FeishuCardV1ImageElement extends FeishuCardV1BaseElement<"img"> {
  img_key: string;
  alt: FeishuPlainText;
  title?: FeishuPlainText | FeishuMarkdownText;
  mode?: "fit_horizontal" | "crop_center" | "large" | "medium" | "small" | string;
  preview?: boolean;
}

export interface FeishuCardV1HrElement extends FeishuCardV1BaseElement<"hr"> {}

export interface FeishuCardV1ActionElement extends FeishuCardV1BaseElement<"action"> {
  actions: FeishuCardV1Action[];
  layout?: "bisected" | "trisection" | "flow" | string;
}

export type FeishuCardV1Action =
  | FeishuCardV1ButtonElement
  | FeishuCardV1SelectElement
  | FeishuCardV1DatePickerElement
  | FeishuCardV1OverflowElement
  | FeishuCardV1InputElement
  | FeishuCardV1UnknownElement;

export interface FeishuCardV1ButtonElement extends FeishuCardV1BaseElement<"button"> {
  text: FeishuPlainText | FeishuMarkdownText;
  type?: FeishuButtonType;
  size?: FeishuButtonSize;
  url?: string;
  multi_url?: FeishuMultiUrl;
  value?: Record<string, unknown>;
  confirm?: FeishuConfirm;
  disabled?: boolean;
}

export interface FeishuCardV1NoteElement extends FeishuCardV1BaseElement<"note"> {
  elements: Array<
    FeishuPlainText | FeishuMarkdownText | FeishuCardV1ImageElement | FeishuCardV1UnknownElement
  >;
}

export interface FeishuCardV1ColumnSetElement extends FeishuCardV1BaseElement<"column_set"> {
  columns: FeishuCardV1ColumnElement[];
  flex_mode?: "none" | "stretch" | "flow" | "bisect" | "trisect" | string;
  background_style?: string;
}

export interface FeishuCardV1ColumnElement extends FeishuCardV1BaseElement<"column"> {
  elements: FeishuCardV1Element[];
  width?: "auto" | "weighted" | string;
  weight?: number;
  vertical_align?: FeishuVerticalAlign;
}

export interface FeishuCardV1FormElement extends FeishuCardV1BaseElement<"form"> {
  name?: string;
  elements: FeishuCardV1Element[];
}

export interface FeishuCardV1InputElement extends FeishuCardV1BaseElement<"input"> {
  name?: string;
  placeholder?: FeishuPlainText;
  default_value?: string;
  required?: boolean;
  disabled?: boolean;
  max_length?: number;
  input_type?: "text" | "multiline_text" | "password" | string;
  value?: string | Record<string, unknown>;
}

export interface FeishuCardV1SelectElement extends FeishuCardV1BaseElement<
  "select_static" | "multi_select_static" | "select_person" | "multi_select_person"
> {
  name?: string;
  placeholder?: FeishuPlainText;
  options?: FeishuOption[];
  initial_option?: string;
  selected_values?: string[];
  required?: boolean;
  disabled?: boolean;
  value?: Record<string, unknown>;
}

export interface FeishuCardV1DatePickerElement extends FeishuCardV1BaseElement<
  "date_picker" | "picker_time" | "picker_datetime"
> {
  name?: string;
  placeholder?: FeishuPlainText;
  initial_date?: string;
  initial_time?: string;
  initial_datetime?: string;
  required?: boolean;
  disabled?: boolean;
  value?: Record<string, unknown>;
}

export interface FeishuCardV1OverflowElement extends FeishuCardV1BaseElement<"overflow"> {
  options: Array<{
    text: FeishuPlainText;
    url?: string;
    multi_url?: FeishuMultiUrl;
    value?: string | Record<string, unknown>;
  }>;
  value?: Record<string, unknown>;
}

export interface FeishuCardV1UnknownElement extends FeishuCardV1BaseElement<string> {}

/* -------------------------------------------------------------------------- */
/* Card JSON 2.0                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Card JSON 2.0 / 新版卡片结构。
 *
 * 特征：
 * - 必须有 schema: "2.0"
 * - elements 移到 body.elements
 * - 交互行为推荐放在 behaviors 里
 */
export interface FeishuCardV2 {
  schema: "2.0";

  config?: FeishuCardV2Config;
  header?: FeishuCardV2Header;
  body: FeishuCardV2Body;

  /**
   * 卡片整体点击跳转。
   */
  card_link?: FeishuMultiUrl;

  [extra: string]: unknown;
}

export interface FeishuCardV2Config {
  /**
   * JSON 2.0 中共享卡片相关配置。
   */
  update_multi?: true;

  /**
   * 是否允许转发。
   */
  enable_forward?: boolean;

  /**
   * 是否允许转发后的卡片继续交互。
   */
  enable_forward_interaction?: boolean;

  /**
   * 消息列表预览摘要。
   */
  summary?: FeishuCardSummary;

  /**
   * 卡片宽度模式。
   */
  width_mode?: "compact" | "fill";

  /**
   * 多语言 locales。
   */
  locales?: FeishuLocale[];

  /**
   * 是否启用自定义翻译。
   */
  use_custom_translation?: boolean;

  /**
   * 流式卡片。
   */
  streaming_mode?: boolean;
  streaming_config?: {
    print_frequency_ms?: Partial<Record<"default" | "android" | "ios" | "pc", number>>;
    print_step?: Partial<Record<"default" | "android" | "ios" | "pc", number>>;
    print_strategy?: "fast" | "delay";
  };

  /**
   * 样式配置，飞书这里字段较多，建议保留透传。
   */
  style?: {
    text_size?: Record<string, Record<string, string>>;
    color?: Record<string, Record<string, string>>;
    [extra: string]: unknown;
  };

  [extra: string]: unknown;
}

export interface FeishuCardV2Header {
  title: FeishuPlainText | FeishuMarkdownText;
  subtitle?: FeishuPlainText | FeishuMarkdownText;
  template?: FeishuHeaderTemplate;
  icon?: FeishuIcon;
  text_tag_list?: FeishuTextTagElement[];
  i18n_text_tag_list?: Partial<Record<FeishuLocale, FeishuTextTagElement[]>>;
  padding?: FeishuDimension;

  [extra: string]: unknown;
}

export interface FeishuTextTagElement {
  tag: "text_tag";
  text: FeishuPlainText;
  color?:
    | "neutral"
    | "blue"
    | "turquoise"
    | "lime"
    | "orange"
    | "violet"
    | "indigo"
    | "wathet"
    | "green"
    | "yellow"
    | "red"
    | "purple"
    | "carmine"
    | string;
}

export interface FeishuCardV2Body {
  direction?: "vertical" | "horizontal";
  padding?: FeishuDimension;

  horizontal_spacing?: FeishuDimension;
  horizontal_align?: FeishuHorizontalAlign;

  vertical_spacing?: FeishuDimension;
  vertical_align?: FeishuVerticalAlign;

  elements: FeishuCardV2Element[];
}

export type FeishuCardV2Element =
  | FeishuCardV2DivElement
  | FeishuCardV2MarkdownElement
  | FeishuCardV2ImageElement
  | FeishuCardV2ImageCombinationElement
  | FeishuCardV2HrElement
  | FeishuCardV2ButtonElement
  | FeishuCardV2ColumnSetElement
  | FeishuCardV2ColumnElement
  | FeishuCardV2FormElement
  | FeishuCardV2InteractiveContainerElement
  | FeishuCardV2CollapsiblePanelElement
  | FeishuCardV2InputElement
  | FeishuCardV2SelectElement
  | FeishuCardV2DatePickerElement
  | FeishuCardV2OverflowElement
  | FeishuCardV2CheckerElement
  | FeishuCardV2PersonElement
  | FeishuCardV2PersonListElement
  | FeishuCardV2TableElement
  | FeishuCardV2ChartElement
  | FeishuCardV2UnknownElement;

export interface FeishuCardV2BaseElement<TTag extends string = string> {
  tag: TTag;
  element_id?: string;
  margin?: FeishuDimension;
  [extra: string]: unknown;
}

export interface FeishuCardV2BaseContainerElement<
  TTag extends string = string,
> extends FeishuCardV2BaseElement<TTag> {
  elements: FeishuCardV2Element[];

  direction?: "vertical" | "horizontal";
  padding?: FeishuDimension;

  horizontal_spacing?: FeishuDimension;
  horizontal_align?: FeishuHorizontalAlign;

  vertical_spacing?: FeishuDimension;
  vertical_align?: FeishuVerticalAlign;
}

/* ------------------------------ V2 Content ------------------------------- */

export interface FeishuCardV2DivElement extends FeishuCardV2BaseElement<"div"> {
  text?: FeishuDivText;
  icon?: FeishuIcon;
  width?: FeishuDimension;
}

export interface FeishuDivText extends FeishuText<"plain_text" | "lark_md"> {
  text_size?: FeishuTextSize;
  text_color?: string;
  text_align?: FeishuTextAlign;
  lines?: number;
}

export interface FeishuCardV2MarkdownElement extends FeishuCardV2BaseElement<"markdown"> {
  content: string;
  text_size?: FeishuTextSize;
  text_align?: FeishuTextAlign;
  icon?: FeishuIcon;
}

export interface FeishuCardV2ImageElement extends FeishuCardV2BaseElement<"img"> {
  img_key: string;
  alt?: FeishuPlainText;
  title?: FeishuPlainText;
  transparent?: boolean;
  preview?: boolean;
  corner_radius?: FeishuDimension;

  scale_type?: "crop_center" | "fit_horizontal" | "crop_top" | string;

  size?: "large" | "medium" | "small" | "tiny" | "stretch_without_padding" | "stretch" | string;

  mode?: "crop_center" | "fit_horizontal" | "large" | "medium" | "small" | "tiny" | string;
}

export interface FeishuCardV2ImageCombinationElement extends FeishuCardV2BaseElement<"img_combination"> {
  combination_mode?: "double" | "triple" | "bisect" | "trisect" | string;
  combination_transparent?: boolean;
  corner_radius?: FeishuDimension;
  img_list?: Array<{
    img_key: string;
  }>;
}

export interface FeishuCardV2HrElement extends FeishuCardV2BaseElement<"hr"> {}

/**
 * @deprecated 飞书 Card JSON 2.0 平台校验已不再接受 note 元素。
 * 仅为历史卡片结构保留，不应放入 FeishuCardV2.body.elements。
 */
export interface FeishuCardV2NoteElement extends FeishuCardV2BaseElement<"note"> {
  elements: Array<
    | FeishuPlainText
    | FeishuMarkdownText
    | FeishuCardV2ImageElement
    | FeishuIcon
    | Record<string, unknown>
  >;
}

export interface FeishuCardV2PersonElement extends FeishuCardV2BaseElement<"person"> {
  user_id: string;
  size?: "large" | "medium" | "small" | "extra_small" | string;
  show_avatar?: boolean;
  show_name?: boolean;
  style?: "normal" | "capsule" | string;
}

export interface FeishuCardV2PersonListElement extends FeishuCardV2BaseElement<"person_list"> {
  persons: Array<{
    id: string;
  }>;
  size?: "large" | "medium" | "small" | "extra_small" | string;
  show_name?: boolean;
  show_avatar?: boolean;
  lines?: number;
  drop_invalid_user_id?: boolean;
  icon?: FeishuIcon;
}

export interface FeishuCardV2ChartElement extends FeishuCardV2BaseElement<"chart"> {
  chart_spec: Record<string, unknown>;
  aspect_ratio?: "1:1" | "2:1" | "4:3" | "16:9" | string;
  color_theme?: "brand" | "rainbow" | "complementary" | "converse" | "primary" | string;
  preview?: boolean;
  height?: "auto" | FeishuDimension;
}

export interface FeishuCardV2TableElement extends FeishuCardV2BaseElement<"table"> {
  page_size?: number;
  row_height?: "low" | "medium" | "high" | string;
  row_max_height?: FeishuDimension;
  freeze_first_column?: boolean;
  header_style?: FeishuTableHeaderStyle;
  columns: FeishuTableColumn[];
  rows: Array<Record<string, unknown>>;
}

export interface FeishuTableHeaderStyle {
  text_align?: FeishuTextAlign;
  text_size?: FeishuTextSize;
  background_style?: "grey" | "none" | string;
  text_color?: "default" | "grey" | string;
  bold?: boolean;
  lines?: number;
}

export interface FeishuTableColumn {
  name: string;
  display_name?: string;
  width?: "auto" | FeishuDimension;
  vertical_align?: FeishuVerticalAlign;
  horizontal_align?: FeishuHorizontalAlign;
  data_type?: "text" | "lark_md" | "options" | "number" | "persons" | "date" | "markdown" | string;
  format?: {
    precision?: number;
    /**
     * 有些历史类型里拼成 percision，兼容一下。
     */
    percision?: number;
    symbol?: string;
    separator?: string;
  };
  date_format?: string;
}

/* ----------------------------- V2 Containers ----------------------------- */

export interface FeishuCardV2ColumnSetElement extends FeishuCardV2BaseElement<"column_set"> {
  columns: FeishuCardV2ColumnElement[];

  horizontal_spacing?: FeishuDimension;
  horizontal_align?: FeishuHorizontalAlign;
  vertical_align?: "center" | FeishuVerticalAlign;

  flex_mode?: "none" | "stretch" | "flow" | "bisect" | "trisect" | string;
  background_style?: string;

  action?: {
    multi_url: FeishuMultiUrl;
  };
}

export interface FeishuCardV2ColumnElement extends FeishuCardV2BaseContainerElement<"column"> {
  background_style?: string;
  width?: "auto" | "weighted" | FeishuDimension;
  weight?: number;

  action?: {
    multi_url: FeishuMultiUrl;
  };
}

export interface FeishuCardV2FormElement extends FeishuCardV2BaseContainerElement<"form"> {
  name: string;
  confirm?: FeishuConfirm;
}

export interface FeishuCardV2InteractiveContainerElement extends FeishuCardV2BaseContainerElement<"interactive_container"> {
  width?: FeishuDimension;
  height?: FeishuDimension;
  background_style?: string;
  has_border?: boolean;
  border_color?: string;
  corner_radius?: FeishuDimension;
  behaviors: FeishuCardV2Behavior[];
  disabled?: boolean;
  disabled_tips?: FeishuPlainText;
  confirm?: FeishuConfirm;
  hover_tips?: FeishuPlainText;
}

export interface FeishuCardV2CollapsiblePanelElement extends FeishuCardV2BaseContainerElement<"collapsible_panel"> {
  expanded?: boolean;
  background_color?: string;
  header: {
    title: FeishuPlainText | FeishuMarkdownText | FeishuCardV2MarkdownElement;
    background_color?: string;
    vertical_align?: FeishuVerticalAlign;
    padding?: FeishuDimension;
    position?: "top" | "bottom";
    width?: FeishuDimension;
    icon?: FeishuIcon & {
      size?: FeishuDimension;
    };
    icon_position?: "left" | "right" | "follow_text";
    icon_expanded_angle?: number;
  };
  border?: {
    color?: string;
    corner_radius?: FeishuDimension;
  };
}

/* ---------------------------- V2 Interactive ----------------------------- */

export type FeishuCardV2Behavior =
  | FeishuCardV2OpenUrlBehavior
  | FeishuCardV2CallbackBehavior
  | FeishuCardV2UnknownBehavior;

export interface FeishuCardV2OpenUrlBehavior {
  type: "open_url";
  default_url: string;
  pc_url?: string;
  ios_url?: string;
  android_url?: string;
}

export interface FeishuCardV2CallbackBehavior {
  type: "callback";
  value?: Record<string, string | number | boolean | null>;
}

export interface FeishuCardV2UnknownBehavior {
  type: string;
  [extra: string]: unknown;
}

export interface FeishuCardV2ButtonElement extends FeishuCardV2BaseElement<"button"> {
  text: FeishuPlainText;
  type?: FeishuButtonType;
  size?: FeishuButtonSize;
  width?: FeishuButtonWidth;

  icon?: FeishuIcon;

  disabled?: boolean;
  disabled_tips?: FeishuPlainText;
  hover_tips?: FeishuPlainText;

  confirm?: FeishuConfirm;

  /**
   * JSON 2.0 推荐使用 behaviors 表达打开链接、回调等行为。
   */
  behaviors?: FeishuCardV2Behavior[];

  /**
   * 表单内按钮相关。
   */
  name?: string;
  required?: boolean;
  form_action_type?: "submit" | "reset";
}

export interface FeishuCardV2InputElement extends FeishuCardV2BaseElement<"input"> {
  name?: string;
  required?: boolean;
  placeholder?: FeishuPlainText;
  default_value?: string;

  disabled?: boolean;
  disabled_tips?: FeishuPlainText;

  width?: "default" | "fill" | FeishuDimension;
  max_length?: number;

  input_type?: "text" | "multiline_text" | "password" | string;

  show_icon?: boolean;

  rows?: number;
  auto_resize?: boolean;
  max_rows?: number;

  label?: FeishuPlainText;
  label_position?: "top" | "left";

  value?: string | Record<string, unknown>;

  behaviors?: FeishuCardV2Behavior[];
  confirm?: FeishuConfirm;
}

export type FeishuCardV2SelectElement =
  | FeishuCardV2StaticSelectElement
  | FeishuCardV2StaticMultiSelectElement
  | FeishuCardV2PersonSelectElement
  | FeishuCardV2PersonMultiSelectElement
  | FeishuCardV2ImageSelectElement;

export interface FeishuCardV2BaseSelectElement<
  TTag extends string,
> extends FeishuCardV2BaseElement<TTag> {
  type?: "default" | "text";
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: FeishuPlainText;
  width?: FeishuSelectWidth;
  confirm?: FeishuConfirm;
  behaviors?: FeishuCardV2Behavior[];
}

export interface FeishuCardV2StaticSelectElement extends FeishuCardV2BaseSelectElement<"select_static"> {
  options: FeishuOption[];
  initial_option?: string;
}

export interface FeishuCardV2StaticMultiSelectElement extends FeishuCardV2BaseSelectElement<"multi_select_static"> {
  options: FeishuOption[];
  selected_values?: string[];
}

export interface FeishuCardV2PersonSelectElement extends FeishuCardV2BaseSelectElement<"select_person"> {
  options?: Array<{
    value: string;
  }>;
  initial_option?: string;
}

export interface FeishuCardV2PersonMultiSelectElement extends FeishuCardV2BaseSelectElement<"multi_select_person"> {
  options?: Array<{
    value: string;
  }>;
  selected_values?: string[];
}

export interface FeishuCardV2ImageSelectElement extends FeishuCardV2BaseSelectElement<"select_img"> {
  multi_select?: boolean;
  layout?: "stretch" | "bisect" | "trisect" | string;
  can_preview?: boolean;
  aspect_ratio?: "1:1" | "4:3" | "16:9" | string;
  disabled_tips?: FeishuPlainText;
  value?: string | Record<string, unknown>;
  options?: Array<{
    img_key: string;
    value?: string;
    disabled?: boolean;
    disabled_tips?: FeishuPlainText;
    hover_tips?: FeishuPlainText;
  }>;
}

export type FeishuCardV2DatePickerElement =
  | FeishuCardV2DatePicker
  | FeishuCardV2TimePicker
  | FeishuCardV2DateTimePicker;

export interface FeishuCardV2DatePicker extends FeishuCardV2BaseSelectElement<"date_picker"> {
  initial_date?: string;
  value?: Record<string, unknown>;
}

export interface FeishuCardV2TimePicker extends FeishuCardV2BaseSelectElement<"picker_time"> {
  initial_time?: string;
  value?: Record<string, unknown>;
}

export interface FeishuCardV2DateTimePicker extends FeishuCardV2BaseSelectElement<"picker_datetime"> {
  initial_datetime?: string;
  value?: Record<string, unknown>;
}

export interface FeishuCardV2OverflowElement extends FeishuCardV2BaseElement<"overflow"> {
  width?: "default" | "fill" | FeishuDimension;
  options: Array<{
    text?: FeishuPlainText;
    multi_url?: FeishuMultiUrl;
    value?: string;
  }>;
  value?: Record<string, unknown>;
  confirm?: FeishuConfirm;
}

export interface FeishuCardV2CheckerElement extends FeishuCardV2BaseElement<"checker"> {
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  text?: FeishuCheckerText;
  overall_checkable?: boolean;

  button_area?: {
    pc_display_rule?: "always" | "on_hover";
    buttons?: FeishuCheckerButton[];
  };

  checked_style?: {
    show_strikethrough?: boolean;
    opacity?: number;
  };

  padding?: FeishuDimension;
  confirm?: FeishuConfirm;
  behaviors?: FeishuCardV2Behavior[];
  hover_tips?: FeishuPlainText;
  disabled_tips?: FeishuPlainText;
}

export interface FeishuCheckerText extends FeishuText<"plain_text" | "lark_md"> {
  text_size?: "normal" | "heading" | "notation" | string;
  text_color?: string;
  text_align?: FeishuTextAlign;
}

export interface FeishuCheckerButton extends FeishuCardV2BaseElement<"button"> {
  text: FeishuPlainText;
  type: "text" | "primary_text" | "danger_text" | string;
  size?: FeishuButtonSize;
  icon?: FeishuIcon;
  disabled?: boolean;
  behaviors?: FeishuCardV2Behavior[];
}

/* ----------------------------- V2 Fallback ------------------------------- */

export interface FeishuCardV2UnknownElement extends FeishuCardV2BaseElement<string> {}

/* -------------------------------------------------------------------------- */
/* Style Values                                                               */
/* -------------------------------------------------------------------------- */

export type FeishuTextSize =
  | "heading-0"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "heading"
  | "normal"
  | "notation"
  | "xxxx-large"
  | "xxx-large"
  | "xx-large"
  | "x-large"
  | "large"
  | "medium"
  | "small"
  | "x-small"
  | string;

/**
 * @example
 *
 * ```ts
 * const payloadV1: FeishuWebhookCardPayload = {
 *   msg_type: "interactive",
 *   card: {
 *     config: {
 *       wide_screen_mode: true,
 *       enable_forward: true,
 *     },
 *     header: {
 *       template: "red",
 *       title: {
 *         tag: "plain_text",
 *         content: "告警通知",
 *       },
 *     },
 *     elements: [
 *       {
 *         tag: "div",
 *         text: {
 *           tag: "lark_md",
 *           content: "**服务**：api-server\n**级别**：critical",
 *         },
 *       },
 *       {
 *         tag: "action",
 *         actions: [
 *           {
 *             tag: "button",
 *             type: "primary",
 *             text: {
 *               tag: "plain_text",
 *               content: "查看详情",
 *             },
 *             url: "https://example.com/alerts/123",
 *           },
 *         ],
 *       },
 *     ],
 *   },
 * };
 * ```
 */
let _payloadV1;

/**
 * @example
 * ```ts
 * const payloadV2: FeishuWebhookCardPayload = {
 *   msg_type: "interactive",
 *   card: {
 *     schema: "2.0",
 *     config: {
 *       update_multi: true,
 *       enable_forward: true,
 *       summary: {
 *         content: "api-server critical 告警",
 *       },
 *     },
 *     header: {
 *       template: "red",
 *       title: {
 *         tag: "plain_text",
 *         content: "告警通知",
 *       },
 *     },
 *     body: {
 *       direction: "vertical",
 *       elements: [
 *         {
 *           tag: "markdown",
 *           content: "**服务**：api-server\n**级别**：critical",
 *         },
 *         {
 *           tag: "button",
 *           type: "primary",
 *           text: {
 *             tag: "plain_text",
 *             content: "查看详情",
 *           },
 *           behaviors: [
 *             {
 *               type: "open_url",
 *               default_url: "https://example.com/alerts/123",
 *             },
 *           ],
 *         },
 *       ],
 *     },
 *   },
 * };
 * ```
 */
let _payloadV2;
