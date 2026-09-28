import { z } from "zod";

export const healthSchema = {
  description: "Health check endpoint",
  tags: ["Health"],
  summary: "Health check",
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      uptime: z.number(),
    }),
  },
};
