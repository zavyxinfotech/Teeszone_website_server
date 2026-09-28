import { z } from "zod";
import { envelope } from "../../utils/zod";

export const subscribeSchema = {
  description: "Subscribe an email to the newsletter (idempotent — resubscribing is a no-op)",
  tags: ["Newsletter"],
  summary: "Subscribe",
  body: z.object({ email: z.string().email().max(320) }),
  response: { 200: envelope(z.object({ subscribed: z.boolean() })) },
};

export const listSubscribersSchema = {
  description: "Admin: list newsletter subscribers",
  tags: ["Admin"],
  summary: "List subscribers",
  security: [{ ApiToken: [] }],
  querystring: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
  response: {
    200: envelope(
      z.object({
        items: z.array(z.object({ id: z.string(), email: z.string(), createdAt: z.string() })),
        total: z.number(),
      }),
    ),
  },
};
