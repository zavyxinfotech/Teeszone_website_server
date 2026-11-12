import logger from "../utils/logger";
import { config } from "../config";

export const sendOrderWhatsAppAlert = async (order: {
  orderNumber: string;
  userName?: string | null;
  userPhone?: string | null;
  amount: number;
  itemsCount: number;
}): Promise<void> => {
  const message = [
    `🛍️ *NEW TEESZONE ORDER CONFIRMED!*`,
    ``,
    `*Order #:* ${order.orderNumber}`,
    `*Customer:* ${order.userName || "Customer"}`,
    `*Phone:* ${order.userPhone || "—"}`,
    `*Items:* ${order.itemsCount} pcs`,
    `*Amount Paid:* ₹${order.amount.toLocaleString("en-IN")}`,
    ``,
    `Inspect order specs & mockups in Admin Dashboard:`,
    `http://localhost:3001/orders`,
  ].join("\n");

  logger.info(`[WHATSAPP ALERT to Admin +${config.whatsapp_admin_number}]:\n${message}`);

  // If webhook / provider URL is configured, dispatch directly via HTTP POST
  if (config.whatsapp_webhook_url) {
    try {
      await fetch(config.whatsapp_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: config.whatsapp_admin_number,
          message,
          order,
        }),
      });
    } catch (err) {
      logger.error({ err }, "WhatsApp webhook dispatch failed");
    }
  }
};

