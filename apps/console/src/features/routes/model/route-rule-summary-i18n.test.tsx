// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { describeRouteRule, type RouteRule } from "#/features/routes/model/route-rule-summary";
import { AppIntlProvider } from "#/i18n/provider";
import { useTranslations } from "#/i18n/use-i18n";

const multiSourceRule: RouteRule = {
  sourceIds: ["source-a", "source-b"],
  severities: ["critical"],
  statuses: [],
  labels: [],
  titleContains: [],
  messageContains: [],
};

function CaptureSummary({ onSummary }: { onSummary: (summary: string) => void }) {
  const t = useTranslations();
  const summary = describeRouteRule(multiSourceRule, {
    allEvents: t("routing.table.allEvents"),
    source: t("routing.table.rulePrefix.source"),
    severity: t("routing.table.rulePrefix.severity"),
    status: t("routing.table.rulePrefix.status"),
    labels: t("routing.table.rulePrefix.labels"),
    title: t("routing.table.rulePrefix.title"),
    message: t("routing.table.rulePrefix.message"),
    sourcesCount: (count) => t("routing.table.ruleSummary.sourcesCount", { count }),
    titleContains: t("routing.table.ruleSummary.titleContains"),
    messageContains: t("routing.table.ruleSummary.messageContains"),
    partSeparator: t("routing.table.ruleSummary.partSeparator"),
    listSeparator: t("routing.table.ruleSummary.listSeparator"),
    severityLabel: (severity) => t(`common.severity.${severity}`),
    statusLabel: (status) => t(`common.alertStatus.${status}`),
  });

  onSummary(summary);
  return null;
}

describe("route rule summary i18n wiring", () => {
  afterEach(() => {
    cleanup();
  });

  it("interpolates source counts through real useTranslations messages", () => {
    let enSummary = "";
    let zhSummary = "";

    render(
      <AppIntlProvider locale="en-US">
        <CaptureSummary
          onSummary={(value) => {
            enSummary = value;
          }}
        />
      </AppIntlProvider>,
    );

    render(
      <AppIntlProvider locale="zh-Hans">
        <CaptureSummary
          onSummary={(value) => {
            zhSummary = value;
          }}
        />
      </AppIntlProvider>,
    );

    expect(enSummary).toContain("Sources: 2");
    expect(enSummary).toContain("Severity: Critical");
    expect(enSummary).not.toContain("routing.table.ruleSummary.sourcesCount");

    expect(zhSummary).toContain("告警源 2 个");
    expect(zhSummary).toContain("级别: 严重");
    expect(zhSummary).not.toContain("routing.table.ruleSummary.sourcesCount");
  });
});
