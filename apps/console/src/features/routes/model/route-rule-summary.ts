import type { Configuration } from "#/features/configuration/model/configuration-types.ts";

export function describeRule(rule: Configuration["routes"][number]["rule"]): string {
  const labels = rule.labels.map(
    (label) => `${label.key}${label.operator === "equals" ? "=" : "~"}${label.value}`,
  );
  const parts = [
    rule.sourceIds.length > 0 ? `sources:${rule.sourceIds.length}` : null,
    rule.severities.length > 0 ? `severity:${rule.severities.join(",")}` : null,
    rule.statuses.length > 0 ? `status:${rule.statuses.join(",")}` : null,
    labels.length > 0 ? `labels:${labels.join(",")}` : null,
    rule.titleContains.length > 0 ? `title:${rule.titleContains.join(",")}` : null,
    rule.messageContains.length > 0 ? `message:${rule.messageContains.join(",")}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "All events";
}
