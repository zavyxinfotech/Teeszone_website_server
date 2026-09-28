import { z } from "zod";
import { envelope } from "../../utils/zod";
import { enquiryEntity } from "../enquiries/enquiries.schema";

export const dashboardStatsSchema = {
  description: "Admin: headline counts + recent activity for the dashboard home.",
  tags: ["Admin"],
  summary: "Dashboard stats",
  security: [{ ApiToken: [] }],
  response: {
    200: envelope(
      z.object({
        products: z.object({ active: z.number(), inactive: z.number() }),
        collections: z.number(),
        promotions: z.object({ live: z.number(), total: z.number() }),
        enquiries: z.object({ new: z.number(), contacted: z.number(), closed: z.number() }),
        reviews: z.object({ published: z.number(), unpublished: z.number() }),
        customers: z.number(),
        subscribers: z.number(),
        recentEnquiries: z.array(enquiryEntity),
        recentCustomers: z.array(
          z.object({ id: z.string(), name: z.string(), email: z.string(), createdAt: z.string() }),
        ),
      }),
    ),
  },
};
