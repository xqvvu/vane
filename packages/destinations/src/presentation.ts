import type { AlertSeverity, AlertStatus } from "@vane/core";
import { DEFAULT_VANE_LOCALE, DEFAULT_VANE_TIME_ZONE } from "@vane/core/presentation";

import type { DestinationPresentation } from "#/types.ts";

const copy = {
  "en-US": {
    severity: { critical: "Critical", warning: "Warning", info: "Info", unknown: "Unknown" },
    status: { firing: "Firing", resolved: "Resolved", unknown: "Unknown" },
    labels: {
      summary: "Alert summary",
      status: "Status",
      source: "Source",
      severity: "Severity",
      provider: "Upstream system",
      service: "Service",
      environment: "Environment",
      fingerprint: "Fingerprint",
      occurredAt: "Occurred at",
      eventId: "Event ID",
      destination: "Destination",
      labels: "Labels",
    },
  },
  "zh-Hans": {
    severity: { critical: "严重", warning: "警告", info: "信息", unknown: "未知" },
    status: { firing: "触发中", resolved: "已恢复", unknown: "未知" },
    labels: {
      summary: "告警摘要",
      status: "状态",
      source: "告警源",
      severity: "级别",
      provider: "上游系统",
      service: "服务",
      environment: "环境",
      fingerprint: "指纹",
      occurredAt: "发生时间",
      eventId: "事件 ID",
      destination: "通知目标",
      labels: "标签",
    },
  },
} as const;

export function resolveDestinationPresentation(
  presentation?: DestinationPresentation,
): DestinationPresentation {
  return {
    locale: presentation?.locale ?? DEFAULT_VANE_LOCALE,
    timeZone: presentation?.timeZone ?? DEFAULT_VANE_TIME_ZONE,
  };
}

export function destinationCopy(presentation?: DestinationPresentation) {
  return copy[resolveDestinationPresentation(presentation).locale];
}

export function displaySeverity(
  severity: AlertSeverity,
  presentation?: DestinationPresentation,
): string {
  return destinationCopy(presentation).severity[severity];
}

export function displayStatus(status: AlertStatus, presentation?: DestinationPresentation): string {
  return destinationCopy(presentation).status[status];
}

export function formatDestinationDateTime(
  value: string,
  presentation?: DestinationPresentation,
): string {
  const resolved = resolveDestinationPresentation(presentation);

  return new Intl.DateTimeFormat(resolved.locale, {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: resolved.timeZone,
  }).format(new Date(value));
}
