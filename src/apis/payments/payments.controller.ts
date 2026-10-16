import crypto from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import Razorpay from "razorpay";
import { config, fmt } from "../../config";
import { captureRequestError } from "../../utils/error-tracking";

interface CreateOrderBody {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

import dotenv from "dotenv";

class PaymentsController {
  private razorpayInstance: Razorpay | null = null;

  private getCredentials(): { keyId: string; keySecret: string } {
    dotenv.config({ override: true });
    const keyId = process.env.RAZORPAY_KEY_ID || config.razorpay_key_id || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || config.razorpay_key_secret || "";
    return { keyId, keySecret };
  }

  private getRazorpay(): Razorpay {
    const { keyId, keySecret } = this.getCredentials();

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured on the server.");
    }

    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  createOrder = async (
    req: FastifyRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { amount, currency = "INR", receipt, notes } = req.body || {};

      // Amount validation: must be at least 100 paise (₹1)
      if (typeof amount !== "number" || isNaN(amount) || amount < 100) {
        return reply.status(400).send({
          success: false,
          error: "Invalid amount. Minimum amount is 100 paise (₹1).",
        });
      }

      const { keyId, keySecret } = this.getCredentials();

      if (!keyId || !keySecret) {
        return reply.status(500).send({
          success: false,
          error: "Razorpay credentials are not configured on server.",
        });
      }


      const razorpay = this.getRazorpay();
      const options = {
        amount: Math.round(amount),
        currency: (currency || "INR").toUpperCase(),
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      };

      const order = await razorpay.orders.create(options);

      return reply.status(200).send({
        success: true,
        order_id: order.id,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
      });
    } catch (error: any) {
      captureRequestError(error, req);

      // Handle auth failures (return 401)
      const isAuthError =
        error?.statusCode === 401 ||
        (error?.error?.code === "BAD_REQUEST_ERROR" &&
          String(error?.error?.description || "").toLowerCase().includes("auth"));

      if (isAuthError) {
        return reply.status(401).send({
          success: false,
          error: error.error?.description || "Razorpay authentication failed",
        });
      }

      // Handle other Razorpay API errors (return 500)
      return reply.status(500).send({
        success: false,
        error: error.error?.description || error.message || "Failed to create Razorpay order",
      });

    }
  };

  verifyPayment = async (
    req: FastifyRequest<{ Body: VerifyPaymentBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

      // Check required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return reply.status(400).send({
          success: false,
          error: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        });
      }

      const { keySecret } = this.getCredentials();
      if (!keySecret) {
        return reply.status(500).send({
          success: false,
          error: "Razorpay secret is not configured on server.",
        });
      }


      // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
      const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(dataToSign)
        .digest("hex");

      const expBuf = Buffer.from(generatedSignature, "utf-8");
      const sigBuf = Buffer.from(razorpay_signature, "utf-8");
      const isSignatureValid = expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);

      if (!isSignatureValid) {
        return reply.status(400).send({
          success: false,
          verified: false,
          error: "Signature verification failed. Signatures do not match.",
        });
      }

      return reply.status(200).send({
        success: true,
        verified: true,
        message: "Payment verified successfully",
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });
    } catch (error: any) {
      captureRequestError(error, req);
      return reply.status(500).send({
        success: false,
        error: error.message || "Error verifying payment signature",
      });
    }
  };
}

export default new PaymentsController();
