import { describe, expect, it } from "vitest";

import {
  routeFormDefaultsFromRule,
  routeRuleFromForm,
  routeRuleFromValues,
  routeRulePatchFromForm,
  routeRulePatchFromValues,
} from "#/features/routes/model/route-form";

describe("route form helpers", () => {
  it("maps route form fields into an inspectable route rule", () => {
    const data = new FormData();

    data.set("sourceId", "source-grafana");
    data.set("severity", "critical");
    data.set("status", "firing");
    data.set("labelKey", "service");
    data.set("labelOperator", "contains");
    data.set("labelValue", "checkout");
    data.set("titleContains", "LatencyHigh");
    data.set("messageContains", "timeout");

    expect(routeRuleFromForm(data)).toEqual({
      sourceIds: ["source-grafana"],
      severities: ["critical"],
      statuses: ["firing"],
      labels: [{ key: "service", operator: "contains", value: "checkout" }],
      titleContains: ["LatencyHigh"],
      messageContains: ["timeout"],
    });
  });

  it("treats any source, severity, and status as empty route conditions", () => {
    const data = new FormData();

    data.set("severity", "any");
    data.set("status", "any");

    expect(routeRuleFromForm(data)).toEqual({
      sourceIds: [],
      severities: [],
      statuses: [],
      labels: [],
      titleContains: [],
      messageContains: [],
    });
  });

  it("maps TanStack form values into an inspectable route rule", () => {
    expect(
      routeRuleFromValues({
        sourceId: "source-grafana",
        severity: "warning",
        status: "resolved",
        labelKey: "team",
        labelOperator: "equals",
        labelValue: "sre",
        titleContains: "DiskFull",
        messageContains: "volume",
      }),
    ).toEqual({
      sourceIds: ["source-grafana"],
      severities: ["warning"],
      statuses: ["resolved"],
      labels: [{ key: "team", operator: "equals", value: "sre" }],
      titleContains: ["DiskFull"],
      messageContains: ["volume"],
    });
  });

  it("derives editable defaults from the first value of each simple rule condition", () => {
    expect(
      routeFormDefaultsFromRule({
        sourceIds: ["source-grafana", "source-alertmanager"],
        severities: ["warning"],
        statuses: ["resolved"],
        labels: [{ key: "team", operator: "equals", value: "sre" }],
        titleContains: ["DiskFull"],
        messageContains: ["volume"],
      }),
    ).toEqual({
      sourceId: "source-grafana",
      severity: "warning",
      status: "resolved",
      labelKey: "team",
      labelOperator: "equals",
      labelValue: "sre",
      titleContains: "DiskFull",
      messageContains: "volume",
    });
  });

  it("patches the first editable condition while preserving extra route conditions", () => {
    const data = new FormData();

    data.set("sourceId", "source-grafana-prod");
    data.set("severity", "critical");
    data.set("status", "firing");
    data.set("labelKey", "service");
    data.set("labelOperator", "contains");
    data.set("labelValue", "api");
    data.set("titleContains", "LatencyHigh");
    data.set("messageContains", "timeout");

    expect(
      routeRulePatchFromForm(
        {
          sourceIds: ["source-grafana", "source-alertmanager"],
          severities: ["warning", "unknown"],
          statuses: ["resolved", "unknown"],
          labels: [
            { key: "team", operator: "equals", value: "sre" },
            { key: "cluster", operator: "contains", value: "prod" },
          ],
          titleContains: ["DiskFull", "VolumeFull"],
          messageContains: ["volume", "filesystem"],
        },
        data,
      ),
    ).toEqual({
      sourceIds: ["source-grafana-prod", "source-alertmanager"],
      severities: ["critical", "unknown"],
      statuses: ["firing", "unknown"],
      labels: [
        { key: "service", operator: "contains", value: "api" },
        { key: "cluster", operator: "contains", value: "prod" },
      ],
      titleContains: ["LatencyHigh", "VolumeFull"],
      messageContains: ["timeout", "filesystem"],
    });
  });

  it("patches the first editable condition from TanStack form values", () => {
    expect(
      routeRulePatchFromValues(
        {
          sourceIds: ["source-grafana", "source-alertmanager"],
          severities: ["warning", "unknown"],
          statuses: ["resolved", "unknown"],
          labels: [
            { key: "team", operator: "equals", value: "sre" },
            { key: "cluster", operator: "contains", value: "prod" },
          ],
          titleContains: ["DiskFull", "VolumeFull"],
          messageContains: ["volume", "filesystem"],
        },
        {
          sourceId: "source-grafana-prod",
          severity: "critical",
          status: "firing",
          labelKey: "service",
          labelOperator: "contains",
          labelValue: "api",
          titleContains: "LatencyHigh",
          messageContains: "timeout",
        },
      ),
    ).toEqual({
      sourceIds: ["source-grafana-prod", "source-alertmanager"],
      severities: ["critical", "unknown"],
      statuses: ["firing", "unknown"],
      labels: [
        { key: "service", operator: "contains", value: "api" },
        { key: "cluster", operator: "contains", value: "prod" },
      ],
      titleContains: ["LatencyHigh", "VolumeFull"],
      messageContains: ["timeout", "filesystem"],
    });
  });
});
