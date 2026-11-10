import { z } from "zod";

export const createOrderSchema = {
  body: z.object({
    amount: z.number().int().min(1),
    items: z.array(z.any()),
    razorpayOrderId: z.string().optional().nullable(),
    razorpayPaymentId: z.string().optional().nullable(),
    shippingAddress: z.record(z.any()).optional().nullable(),
    userPhone: z.string().optional().nullable(),
  }),
};
