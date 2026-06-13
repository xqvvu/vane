import {
  formHeaderLines,
  formSeparatedList,
  formString,
  formTrimmedString,
  nonEmptyObject,
  type JsonObject,
} from "@vane/core";

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
  const messageTemplate = formTrimmedString(data, "messageTemplate");

  if (kind === "email") {
    const subjectPrefix = formTrimmedString(data, "subjectPrefix");
    const replyTo = formTrimmedString(data, "replyTo");
    const headers = formHeaderLines(data);

    return {
      endpointUrl: formTrimmedString(data, "endpointUrl"),
      to: formSeparatedList(data, "to"),
      from: formTrimmedString(data, "from"),
      ...(replyTo ? { replyTo } : {}),
      ...(subjectPrefix ? { subjectPrefix } : {}),
      ...nonEmptyObject({ headers }),
      ...(messageTemplate ? { messageTemplate } : {}),
    };
  }

  if (kind === "feishu") {
    const signSecret = formTrimmedString(data, "signSecret");

    return {
      webhookUrl: formTrimmedString(data, "webhookUrl"),
      ...(signSecret ? { signSecret } : {}),
      ...(messageTemplate ? { messageTemplate } : {}),
    };
  }

  if (kind === "slack") {
    return {
      webhookUrl: formTrimmedString(data, "webhookUrl"),
      ...(messageTemplate ? { messageTemplate } : {}),
    };
  }

  const headers = formHeaderLines(data);

  return {
    url: formTrimmedString(data, "url"),
    method: formWebhookMethod(data),
    ...nonEmptyObject({ headers }),
    ...(messageTemplate ? { messageTemplate } : {}),
  };
}

export function destinationConfigPatchFromForm(
  kind: DestinationFormKind,
  data: FormData,
): JsonObject {
  const messageTemplate = formTrimmedString(data, "messageTemplate");
  const config: JsonObject = {};

  if (kind === "email") {
    const endpointUrl = formTrimmedString(data, "endpointUrl");
    const to = formSeparatedList(data, "to");
    const from = formTrimmedString(data, "from");
    const replyTo = formTrimmedString(data, "replyTo");
    const subjectPrefix = formTrimmedString(data, "subjectPrefix");
    const headers = formHeaderLines(data);

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

    if (nonEmptyObject(headers)) {
      config.headers = headers;
    }
  } else if (kind === "feishu") {
    const webhookUrl = formTrimmedString(data, "webhookUrl");
    const signSecret = formTrimmedString(data, "signSecret");

    if (webhookUrl) {
      config.webhookUrl = webhookUrl;
    }

    if (signSecret) {
      config.signSecret = signSecret;
    }
  } else if (kind === "slack") {
    const webhookUrl = formTrimmedString(data, "webhookUrl");

    if (webhookUrl) {
      config.webhookUrl = webhookUrl;
    }
  } else {
    const url = formTrimmedString(data, "url");
    const method = formString(data, "method").toUpperCase();
    const headers = formHeaderLines(data);

    if (url) {
      config.url = url;
    }

    if (method === "POST" || method === "PUT" || method === "PATCH") {
      config.method = method;
    }

    if (nonEmptyObject(headers)) {
      config.headers = headers;
    }
  }

  if (messageTemplate) {
    config.messageTemplate = messageTemplate;
  }

  return config;
}

function formWebhookMethod(data: FormData): "POST" | "PUT" | "PATCH" {
  const method = formString(data, "method").toUpperCase();

  return method === "PUT" || method === "PATCH" ? method : "POST";
}
