import "@tanstack/react-start/server-only";
import { AsyncLocalStorage } from "node:async_hooks";

import {
  configure,
  getAnsiColorFormatter,
  getConfig,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
  type LogLevel,
} from "@logtape/logtape";

import { env } from "#/env";
import { withVaneLogRedaction } from "#/server/runtime/log-safety";

type VaneLogFormat = "json" | "text";

let configured: Promise<void> | undefined;

export async function logger(): Promise<void> {
  if (getConfig() !== null) {
    return;
  }

  configured ??= configureLogging();

  try {
    await configured;
  } finally {
    configured = undefined;
  }
}

async function configureLogging(): Promise<void> {
  const format = resolveLogFormat(env.VANE_LOG_FORMAT, import.meta.env.PROD);
  const level = resolveLogLevel(env.VANE_LOG_LEVEL);
  const formatter =
    format === "json" ? getJsonLinesFormatter() : getAnsiColorFormatter({ timestamp: "rfc3339" });
  const consoleSink = withVaneLogRedaction(getConsoleSink({ formatter }));

  await configure({
    sinks: {
      console: consoleSink,
    },
    loggers: [
      {
        category: ["vane"],
        sinks: ["console"],
        lowestLevel: level,
      },
      {
        category: ["logtape", "meta"],
        sinks: ["console"],
        lowestLevel: "warning",
        parentSinks: "override",
      },
    ],
    contextLocalStorage: new AsyncLocalStorage<Record<string, unknown>>(),
  });

  getLogger(["vane", "runtime"]).info("Logging initialized with {format} output at {level}", {
    format,
    level: level ?? "off",
  });
}

function resolveLogFormat(format: typeof env.VANE_LOG_FORMAT, production: boolean): VaneLogFormat {
  if (format === "auto") {
    return production ? "json" : "text";
  }

  return format;
}

function resolveLogLevel(level: typeof env.VANE_LOG_LEVEL): LogLevel | null {
  return level === "off" ? null : level;
}
