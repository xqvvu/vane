import type { JsonObject } from "@vane/core";

export type DestinationFormKind = "generic_webhook" | "feishu" | "slack" | "email";

export function formDestinationKind(data: FormData): DestinationFormKind {
  return formDestinationKindValue(data.get("kind"));
}

export function formDestinationKindValue(
  value: FormDataEntryValue | string | null,
): DestinationFormKind {
  switch (value) {
    case "feishu":
    case "slack":
    case "email": {
      return value;
    }
    default: {
      return "generic_webhook";
    }
  }
}

export function destinationConfigFromForm(kind: DestinationFormKind, data: FormData): JsonObject {
  const messageTemplate = formString(data, "messageTemplate").trim();

  if (kind === "email") {
    const subjectPrefix = formString(data, "subjectPrefix").trim();
    const replyTo = formString(data, "replyTo").trim();
    const headers = headersFromForm(data);

    return {
      endpointUrl: formString(data, "endpointUrl").trim(),
      to: formEmailList(data, "to"),
      from: formString(data, "from").trim(),
      ...(replyTo ? { replyTo } : {}),
      ...(subjectPrefix ? { subjectPrefix } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      ...(messageTemplate ? { messageTemplate } : {}),
    };
  }

  if (kind === "feishu") {
    const signSecret = formString(data, "signSecret").trim();

    return {
      webhookUrl: formString(data, "webhookUrl").trim(),
      ...(signSecret ? { signSecret } : {}),
      ...(messageTemplate ? { messageTemplate } : {}),
    };
  }

  if (kind === "slack") {
    return {
      webhookUrl: formString(data, "webhookUrl").trim(),
      ...(messageTemplate ? { messageTemplate } : {}),
    };
  }

  const headers = headersFromForm(data);

  return {
    url: formString(data, "url").trim(),
    method: formWebhookMethod(data),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(messageTemplate ? { messageTemplate } : {}),
  };
}

export function destinationConfigPatchFromForm(
  kind: DestinationFormKind,
  data: FormData,
): JsonObject {
  const messageTemplate = formString(data, "messageTemplate").trim();
  const config: JsonObject = {};

  if (kind === "email") {
    const endpointUrl = formString(data, "endpointUrl").trim();
    const to = formEmailList(data, "to");
    const from = formString(data, "from").trim();
    const replyTo = formString(data, "replyTo").trim();
    const subjectPrefix = formString(data, "subjectPrefix").trim();
    const headers = headersFromForm(data);

    if (endpointUrl) {
      config.endpointUrl = endpointUrl;
    }

    if (to.length > 0) {
      config.to = to;
    }

    if (from) {
      config.from = from;
    }

    if (replyTo) {
      config.replyTo = replyTo;
    }

    if (subjectPrefix) {
      config.subjectPrefix = subjectPrefix;
    }

    if (Object.keys(headers).length > 0) {
      config.headers = headers;
    }
  } else if (kind === "feishu") {
    const webhookUrl = formString(data, "webhookUrl").trim();
    const signSecret = formString(data, "signSecret").trim();

    if (webhookUrl) {
      config.webhookUrl = webhookUrl;
    }

    if (signSecret) {
      config.signSecret = signSecret;
    }
  } else if (kind === "slack") {
    const webhookUrl = formString(data, "webhookUrl").trim();

    if (webhookUrl) {
      config.webhookUrl = webhookUrl;
    }
  } else {
    const url = formString(data, "url").trim();
    const method = formString(data, "method").toUpperCase();
    const headers = headersFromForm(data);

    if (url) {
      config.url = url;
    }

    if (method === "POST" || method === "PUT" || method === "PATCH") {
      config.method = method;
    }

    if (Object.keys(headers).length > 0) {
      config.headers = headers;
    }
  }

  if (messageTemplate) {
    config.messageTemplate = messageTemplate;
  }

  return config;
}

function formString(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

function formEmailList(data: FormData, key: string): string[] {
  return formString(data, key)
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function formWebhookMethod(data: FormData): "POST" | "PUT" | "PATCH" {
  const method = formString(data, "method").toUpperCase();

  return method === "PUT" || method === "PATCH" ? method : "POST";
}

function headersFromForm(data: FormData): Record<string, string> {
  const headerLines = formString(data, "headers");
  const headers: Record<string, string> = {};

  for (const line of headerLines.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && value) {
      headers[key] = value;
    }
  }

  return headers;
}
