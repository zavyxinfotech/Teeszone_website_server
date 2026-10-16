import { z } from "zod";

export const createOrderSchema = {
  description: "Create a Razorpay order for online checkout",
  tags: ["Payments"],
  summary: "Create Razorpay order",
  body: z.object({
    amount: z.number().int().min(100, "Amount must be at least 100 paise (₹1)"),
    currency: z.string().default("INR"),
    receipt: z.string().optional(),
    notes: z.record(z.string()).optional(),
  }),
};

export const verifyPaymentSchema = {
  description: "Verify Razorpay payment signature",
  tags: ["Payments"],
  summary: "Verify payment signature",
  body: z.object({
    razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
    razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
    razorpay_signature: z.string().min(1, "razorpay_signature is required"),
  }),
};
