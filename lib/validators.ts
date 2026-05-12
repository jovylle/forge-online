import { z } from "zod";

import { STATUS_VALUES } from "@/lib/types";

const nullableTrimmedText = (maxLength: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value.trim() : null))
    .refine(
      (value) => value === null || value.length <= maxLength,
      `Must be ${maxLength} characters or fewer.`,
    )
    .transform((value) => (value && value.length > 0 ? value : null));

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
});

export const repoMetadataSchema = z.object({
  goal: nullableTrimmedText(280),
  statusOverride: z.enum(STATUS_VALUES).nullable().optional().default(null),
  notes: nullableTrimmedText(4000),
  nextStep: nullableTrimmedText(500),
});

export const syncRequestSchema = z
  .object({
    dryRun: z.boolean().optional(),
  })
  .partial()
  .default({});
