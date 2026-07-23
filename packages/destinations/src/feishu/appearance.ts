import type { TemplateBindings } from "#destinations/template";

export const FeishuCardColors = [
  "blue",
  "wathet",
  "turquoise",
  "green",
  "yellow",
  "orange",
  "red",
  "carmine",
  "violet",
  "purple",
  "indigo",
  "grey",
  "default",
] as const;

export type FeishuCardColor = (typeof FeishuCardColors)[number];

export const defaultFeishuCardBindings = {
  statusColor: {
    select: "event.status",
    cases: {
      firing: "red",
      resolved: "green",
      unknown: "grey",
    },
    fallback: "grey",
  },
} satisfies TemplateBindings;
