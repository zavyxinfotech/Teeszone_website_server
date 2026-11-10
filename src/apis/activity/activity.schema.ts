import { z } from "zod";

export const logActivitySchema = {
  body: z.object({
    activityType: z.string().min(1).max(64),
    productId: z.string().optional().nullable(),
    productName: z.string().optional().nullable(),
    orderId: z.string().optional().nullable(),
    status: z.string().optional().default("COMPLETED"),
    details: z.record(z.any()).optional().nullable(),
    userName: z.string().optional().nullable(),
    userEmail: z.string().optional().nullable(),
  }),
};

export const listActivitiesSchema = {
  querystring: z.object({
    search: z.string().optional(),
    activityType: z.string().optional(),
    productId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
};
