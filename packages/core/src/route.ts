import { z } from "zod";

import { AlertSeveritySchema, AlertStatusSchema, NormalizedEventSchema } from "#/normalized-event.ts";
import type { NormalizedEvent } from "#/normalized-event.ts";

export const LabelMatchOperatorSchema = z.enum(["equals", "contains"]);

export const LabelMatcherSchema = z.object({
  key: z.string().min(1),
  operator: LabelMatchOperatorSchema.default("equals"),
  value: z.string(),
});

export const RouteRuleSchema = z.object({
  sourceIds: z.array(z.string().min(1)).default([]),
  severities: z.array(AlertSeveritySchema).default([]),
  statuses: z.array(AlertStatusSchema).default([]),
  labels: z.array(LabelMatcherSchema).default([]),
  titleContains: z.array(z.string().min(1)).default([]),
  messageContains: z.array(z.string().min(1)).default([]),
});

const EmptyRouteRule = {
  sourceIds: [],
  severities: [],
  statuses: [],
  labels: [],
  titleContains: [],
  messageContains: [],
} satisfies z.output<typeof RouteRuleSchema>;

export const RouteDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  enabled: z.boolean().default(true),
  rule: RouteRuleSchema.default(EmptyRouteRule),
  destinationIds: z.array(z.string().min(1)).min(1),
});

export const RouteMatchInputSchema = z.object({
  sourceId: z.string().min(1),
  event: NormalizedEventSchema,
});

export type LabelMatcher = z.infer<typeof LabelMatcherSchema>;
export type RouteRule = z.output<typeof RouteRuleSchema>;
export type RouteRuleInput = z.input<typeof RouteRuleSchema>;
export type RouteDefinition = z.output<typeof RouteDefinitionSchema>;
export type RouteDefinitionInput = z.input<typeof RouteDefinitionSchema>;
export type RouteMatchInput = z.infer<typeof RouteMatchInputSchema>;

export interface RouteMatchCheck {
  field: "enabled" | "source" | "severity" | "status" | "label" | "title" | "message";
  matched: boolean;
  detail: string;
}

export interface RouteMatchResult {
  routeId: string;
  routeName: string;
  matched: boolean;
  destinationIds: string[];
  checks: RouteMatchCheck[];
}

export function evaluateRouteMatch(routeInput: RouteDefinitionInput, input: RouteMatchInput): RouteMatchResult {
  const route = RouteDefinitionSchema.parse(routeInput);
  const checks: RouteMatchCheck[] = [];

  if (!route.enabled) {
    checks.push({ field: "enabled", matched: false, detail: "Route is disabled" });
    return resultFor(route, checks);
  }

  checks.push({ field: "enabled", matched: true, detail: "Route is enabled" });
  evaluateSource(route.rule.sourceIds, input.sourceId, checks);
  evaluateOneOf("severity", route.rule.severities, input.event.severity, checks);
  evaluateOneOf("status", route.rule.statuses, input.event.status, checks);
  evaluateLabels(route.rule.labels, input.event, checks);
  evaluateContainsAll("title", route.rule.titleContains, input.event.title, checks);
  evaluateContainsAll("message", route.rule.messageContains, input.event.message, checks);

  return resultFor(route, checks);
}

export function routeMatchesEvent(route: RouteDefinitionInput, input: RouteMatchInput): boolean {
  return evaluateRouteMatch(route, input).matched;
}

export function findMatchingRoutes(routes: RouteDefinitionInput[], input: RouteMatchInput): RouteMatchResult[] {
  return routes.map((route) => evaluateRouteMatch(route, input)).filter((result) => result.matched);
}

function resultFor(route: RouteDefinition, checks: RouteMatchCheck[]): RouteMatchResult {
  return {
    routeId: route.id,
    routeName: route.name,
    matched: checks.every((check) => check.matched),
    destinationIds: route.destinationIds,
    checks,
  };
}

function evaluateSource(expectedSourceIds: string[], actualSourceId: string, checks: RouteMatchCheck[]): void {
  if (expectedSourceIds.length === 0) {
    checks.push({ field: "source", matched: true, detail: "No source condition" });
    return;
  }

  checks.push({
    field: "source",
    matched: expectedSourceIds.includes(actualSourceId),
    detail: `Expected one of ${expectedSourceIds.join(", ")}, received ${actualSourceId}`,
  });
}

function evaluateOneOf(
  field: "severity" | "status",
  expected: string[],
  actual: string,
  checks: RouteMatchCheck[],
): void {
  if (expected.length === 0) {
    checks.push({ field, matched: true, detail: `No ${field} condition` });
    return;
  }

  checks.push({
    field,
    matched: expected.includes(actual),
    detail: `Expected one of ${expected.join(", ")}, received ${actual}`,
  });
}

function evaluateLabels(matchers: LabelMatcher[], event: NormalizedEvent, checks: RouteMatchCheck[]): void {
  if (matchers.length === 0) {
    checks.push({ field: "label", matched: true, detail: "No label condition" });
    return;
  }

  for (const matcher of matchers) {
    const actualValue = event.labels[matcher.key];
    const matched =
      matcher.operator === "equals"
        ? actualValue === matcher.value
        : typeof actualValue === "string" && actualValue.includes(matcher.value);

    checks.push({
      field: "label",
      matched,
      detail: `Expected label ${matcher.key} ${matcher.operator} ${matcher.value}`,
    });
  }
}

function evaluateContainsAll(
  field: "title" | "message",
  expectedNeedles: string[],
  actualHaystack: string,
  checks: RouteMatchCheck[],
): void {
  if (expectedNeedles.length === 0) {
    checks.push({ field, matched: true, detail: `No ${field} condition` });
    return;
  }

  const normalizedHaystack = actualHaystack.toLocaleLowerCase();

  for (const needle of expectedNeedles) {
    checks.push({
      field,
      matched: normalizedHaystack.includes(needle.toLocaleLowerCase()),
      detail: `Expected ${field} to contain ${needle}`,
    });
  }
}
