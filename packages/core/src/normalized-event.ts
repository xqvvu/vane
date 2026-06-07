import { z } from "zod";

export const AlertSeveritySchema = z.enum(["critical", "warning", "info", "unknown"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertStatusSchema = z.enum(["firing", "resolved", "unknown"]);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

export const LabelsSchema = z.record(z.string().min(1), z.string());
export type Labels = z.infer<typeof LabelsSchema>;

export const IsoDateTimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected an ISO-compatible datetime string",
});

export const NormalizedEventSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string(),
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  fingerprint: z.string().trim().min(1),
  labels: LabelsSchema.default({}),
  occurredAt: IsoDateTimeSchema,
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;
