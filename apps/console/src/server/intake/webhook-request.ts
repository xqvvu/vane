export class WebhookPayloadTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`Webhook payload exceeds ${maxBytes} bytes`);
    this.name = "WebhookPayloadTooLargeError";
  }
}

export class InvalidWebhookJsonError extends Error {
  constructor(options?: ErrorOptions) {
    super("Expected JSON webhook payload", options);
    this.name = "InvalidWebhookJsonError";
  }
}

export async function readWebhookJsonPayload(
  request: Request,
  options: { maxBytes: number },
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const declaredBytes = Number(contentLength);

    if (Number.isFinite(declaredBytes) && declaredBytes > options.maxBytes) {
      throw new WebhookPayloadTooLargeError(options.maxBytes);
    }
  }

  try {
    return JSON.parse(await readRequestText(request, options.maxBytes)) as unknown;
  } catch (error) {
    if (error instanceof WebhookPayloadTooLargeError) {
      throw error;
    }

    throw new InvalidWebhookJsonError({ cause: error });
  }
}

async function readRequestText(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const read = await reader.read();

    if (read.done) {
      break;
    }

    totalBytes += read.value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new WebhookPayloadTooLargeError(maxBytes);
    }

    chunks.push(read.value);
  }

  return new TextDecoder().decode(concatChunks(chunks, totalBytes));
}

function concatChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const output = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}
