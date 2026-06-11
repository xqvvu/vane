import { describe, expect, it } from "vitest";

import type { NormalizedEvent } from "#/normalized-event.ts";
import type { RouteDefinitionInput } from "#/route.ts";
import {
  RouteDefinitionSchema,
  evaluateRouteMatch,
  findMatchingRoutes,
  routeMatchesEvent,
} from "#/route.ts";

const event: NormalizedEvent = {
  title: "Checkout API latency high",
  message: "p95 latency exceeded for checkout in prod",
  severity: "critical",
  status: "firing",
  fingerprint: "checkout-api-latency",
  labels: {
    service: "checkout",
    environment: "prod",
  },
  occurredAt: "2026-06-07T08:00:00.000Z",
};

const route: RouteDefinitionInput = {
  id: "route-critical-checkout",
  name: "Critical checkout alerts",
  enabled: true,
  destinationIds: ["dest-sre"],
  rule: {
    sourceIds: ["source-grafana"],
    severities: ["critical"],
    statuses: ["firing"],
    labels: [{ key: "service", operator: "equals", value: "checkout" }],
    titleContains: ["latency"],
    messageContains: ["prod"],
  },
};

describe("route matching", () => {
  it("matches inspectable route conditions", () => {
    const result = evaluateRouteMatch(route, {
      sourceId: "source-grafana",
      event,
    });

    expect(result.matched).toBe(true);
    expect(result.destinationIds).toEqual(["dest-sre"]);
    expect(result.checks.every((check) => check.matched)).toBe(true);
  });

  it("does not match disabled routes", () => {
    expect(
      routeMatchesEvent(
        {
          ...route,
          enabled: false,
        },
        {
          sourceId: "source-grafana",
          event,
        },
      ),
    ).toBe(false);
  });

  it("does not use fingerprint as suppression", () => {
    const repeatEvent = {
      ...event,
      message: "another repeat firing notification for the same alert",
    };

    expect(
      routeMatchesEvent(
        {
          id: "route-critical",
          name: "Critical alerts",
          enabled: true,
          destinationIds: ["dest-sre"],
          rule: {
            severities: ["critical"],
          },
        },
        {
          sourceId: "source-grafana",
          event: repeatEvent,
        },
      ),
    ).toBe(true);
  });

  it("returns only matching routes", () => {
    const matches = findMatchingRoutes(
      [
        route,
        {
          ...route,
          id: "route-warning",
          name: "Warnings",
          rule: {
            severities: ["warning"],
          },
        },
      ],
      {
        sourceId: "source-grafana",
        event,
      },
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.routeId).toBe("route-critical-checkout");
  });

  it("rejects routes with duplicate destinations", () => {
    expect(() =>
      RouteDefinitionSchema.parse({
        id: "route-duplicate-destinations",
        name: "Duplicate destinations",
        destinationIds: ["dest-sre", "dest-sre"],
      }),
    ).toThrow("Route destination IDs must be unique");
  });

  it("rejects empty label matcher values", () => {
    expect(() =>
      RouteDefinitionSchema.parse({
        id: "route-empty-label",
        name: "Empty label",
        destinationIds: ["dest-sre"],
        rule: {
          labels: [{ key: "service", operator: "contains", value: "" }],
        },
      }),
    ).toThrow("Too small");
  });

  it("trims route string conditions at schema boundaries", () => {
    expect(
      RouteDefinitionSchema.parse({
        id: " route-trimmed ",
        name: " Trimmed route ",
        destinationIds: [" dest-sre "],
        rule: {
          sourceIds: [" source-grafana "],
          labels: [{ key: " service ", operator: "equals", value: " checkout " }],
          titleContains: [" latency "],
          messageContains: [" prod "],
        },
      }),
    ).toMatchObject({
      id: "route-trimmed",
      name: "Trimmed route",
      destinationIds: ["dest-sre"],
      rule: {
        sourceIds: ["source-grafana"],
        labels: [{ key: "service", operator: "equals", value: "checkout" }],
        titleContains: ["latency"],
        messageContains: ["prod"],
      },
    });
  });

  it("rejects whitespace-only route string conditions", () => {
    expect(() =>
      RouteDefinitionSchema.parse({
        id: "route-whitespace-source",
        name: "Whitespace source",
        destinationIds: ["dest-sre"],
        rule: {
          sourceIds: ["   "],
        },
      }),
    ).toThrow("Too small");
    expect(() =>
      RouteDefinitionSchema.parse({
        id: "route-whitespace-title",
        name: "Whitespace title",
        destinationIds: ["dest-sre"],
        rule: {
          titleContains: ["   "],
        },
      }),
    ).toThrow("Too small");
    expect(() =>
      RouteDefinitionSchema.parse({
        id: "route-whitespace-label",
        name: "Whitespace label",
        destinationIds: ["dest-sre"],
        rule: {
          labels: [{ key: "service", operator: "contains", value: "   " }],
        },
      }),
    ).toThrow("Too small");
  });
});
