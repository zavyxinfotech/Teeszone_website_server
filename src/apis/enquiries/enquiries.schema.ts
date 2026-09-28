import { z } from "zod";
import { envelope } from "../../utils/zod";

const STATUS = ["NEW", "CONTACTED", "CLOSED"] as const;

const createBody = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  phone: z.string().min(5).max(30),
  product: z.string().max(200).optional(),
  quantity: z.string().max(100).optional(),
  message: z.string().max(5000).optional(),
});

export const enquiryEntity = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string().nullable(),
  phone: z.string(),
  productId: z.string().nullable(),
  productName: z.string().nullable(),
  quantity: z.string().nullable(),
  message: z.string().nullable(),
  status: z.enum(STATUS),
  createdAt: z.string(),
});

export const createEnquirySchema = {
  description: "Submit a quote enquiry (public). Unknown product slugs are stored with a null product link.",
  tags: ["Enquiries"],
  summary: "Create enquiry",
  body: createBody,
  response: { 201: envelope(z.object({ id: z.string() })) },
};

export const listEnquiriesSchema = {
  description: "Admin: paginated enquiry inbox, filterable by status",
  tags: ["Admin"],
  summary: "List enquiries",
  security: [{ ApiToken: [] }],
  querystring: z.object({
    status: z.enum(STATUS).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  response: {
    200: envelope(z.object({ items: z.array(enquiryEntity), total: z.number() })),
  },
};

export const updateEnquirySchema = {
  description: "Admin: update enquiry status",
  tags: ["Admin"],
  summary: "Update enquiry status",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(STATUS) }),
  response: { 200: envelope(enquiryEntity) },
};
