import { z } from "zod";
import { envelope } from "../../utils/zod";

export const customerEntity = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  role: z.enum(["CUSTOMER", "ADMIN"]),
  hasPassword: z.boolean(),
  googleLinked: z.boolean(),
  addressCount: z.number(),
  createdAt: z.string(),
});

export const customerAddressEntity = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  type: z.enum(["HOME", "WORK", "OTHER"]),
  isDefault: z.boolean(),
});

export const listCustomersSchema = {
  description: "Admin: paginated, searchable customer directory (name / email / phone).",
  tags: ["Admin"],
  summary: "List customers",
  security: [{ ApiToken: [] }],
  querystring: z.object({
    q: z.string().trim().max(120).optional(),
    role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  response: { 200: envelope(z.object({ items: z.array(customerEntity), total: z.number() })) },
};

export const getCustomerSchema = {
  description: "Admin: one customer with their address book.",
  tags: ["Admin"],
  summary: "Get customer",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: {
    200: envelope(customerEntity.extend({ addresses: z.array(customerAddressEntity) })),
  },
};
