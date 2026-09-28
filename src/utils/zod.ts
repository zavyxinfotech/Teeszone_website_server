import { z } from "zod";

export const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    message: z.string(),
    success: z.boolean(),
    code: z.string(),
  });

export const errorEnvelope = z.object({
  message: z.string(),
  data: z.unknown().nullable(),
  success: z.boolean(),
  code: z.string(),
  description: z.string().optional(),
});
