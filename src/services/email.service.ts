import { Resend } from "resend";
import { config } from "../config";
import logger from "../utils/logger";

export const sendPasswordResetMail = async (email: string, link: string): Promise<boolean> => {
  if (!config.resend_api_key) {
    logger.info(`[DEV EMAIL] Password reset link for ${email}: ${link}`);
    return true;
  }
  const resend = new Resend(config.resend_api_key);
  const { error } = await resend.emails.send({
    from: config.mail_from,
    to: [email],
    subject: "Reset your TeesZone password",
    text: `Open this link to set a new TeesZone password: ${link}\n\nThe link is valid for 30 minutes. If you didn't request it, ignore this email.`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#222222">
      <h2 style="color:#970024">TeesZone</h2>
      <p>We received a request to reset the password for this email address.</p>
      <p><a href="${link}" style="display:inline-block;background:#970024;color:#ffffff;padding:12px 24px;text-decoration:none;font-weight:bold">Set a new password</a></p>
      <p>Or open this link: <a href="${link}">${link}</a></p>
      <p>The link is valid for 30 minutes. If you didn't request it, ignore this email — your password stays unchanged.</p>
    </body></html>`,
  });
  if (error) {
    logger.error({ error }, "sendPasswordResetMail failed");
    return false;
  }
  return true;
};

export const sendEnquiryNotification = async (enquiry: {
  name: string;
  company?: string | null;
  phone: string;
  productName?: string | null;
  quantity?: string | null;
  message?: string | null;
}): Promise<void> => {
  const summary = [
    `Name: ${enquiry.name}`,
    enquiry.company ? `Company: ${enquiry.company}` : null,
    `Phone: ${enquiry.phone}`,
    enquiry.productName ? `Product: ${enquiry.productName}` : null,
    enquiry.quantity ? `Quantity: ${enquiry.quantity}` : null,
    enquiry.message ? `Message: ${enquiry.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!config.resend_api_key || !config.enquiry_notify_email) {
    logger.info(`[DEV EMAIL] New enquiry:\n${summary}`);
    return;
  }
  const resend = new Resend(config.resend_api_key);
  const { error } = await resend.emails.send({
    from: config.mail_from,
    to: [config.enquiry_notify_email],
    subject: `New enquiry from ${enquiry.name}`,
    text: summary,
  });
  if (error) logger.error({ error }, "sendEnquiryNotification failed");
};

export const sendOrderPlacedNotification = async (order: {
  orderNumber: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  amount: number;
  items: any[];
  shippingAddress?: any;
}): Promise<void> => {
  const adminEmail = config.order_notify_email || config.enquiry_notify_email || "info@teeszone.in";
  const recipients: string[] = [adminEmail];
  if (order.userEmail && order.userEmail !== adminEmail && order.userEmail.includes("@")) {
    recipients.push(order.userEmail);
  }

  const itemsHtml = (order.items || [])
    .map((it: any, idx: number) => {
      const frontImg = it.frontPreviewUrl || it.customDesign?.frontPreviewUrl || it.image;
      const backImg = it.backPreviewUrl || it.customDesign?.backPreviewUrl;
      const frontLogo = it.frontLogoUrl || it.customDesign?.frontLogoUrl || it.customDesign?.logoUrl;
      const backLogo = it.backLogoUrl || it.customDesign?.backLogoUrl;
      const qty = it.qty || 1;
      const unitPrice = it.unitPrice || (order.amount / (order.items.length || 1));
      const lineTotal = Math.round(unitPrice * qty);

      return `
        <tr style="border-bottom:1px solid #eeeeee;">
          <td style="padding:10px 8px;vertical-align:top;">
            <strong style="color:#222;">#${idx + 1} ${it.name || "Custom Apparel"}</strong><br/>
            <span style="color:#666;font-size:12px;">Color: ${it.color || "—"} | Size: ${it.size || "—"} | Qty: ${qty} pcs</span>
            ${it.customNote ? `<br/><span style="color:#80011F;font-size:11px;font-style:italic;">Note: ${it.customNote}</span>` : ""}
            <div style="margin-top:4px;">
              ${frontLogo ? `<a href="${frontLogo}" target="_blank" style="color:#80011F;font-size:11px;margin-right:10px;">[Front Logo]</a>` : ""}
              ${backLogo ? `<a href="${backLogo}" target="_blank" style="color:#80011F;font-size:11px;">[Back Logo]</a>` : ""}
            </div>
            ${(frontImg || backImg) ? `
              <div style="margin-top:6px;display:flex;gap:8px;">
                ${frontImg ? `<a href="${frontImg}" target="_blank"><img src="${frontImg}" alt="Front Mockup" style="height:55px;width:auto;border:1px solid #eee;border-radius:4px;margin-right:6px;" /></a>` : ""}
                ${backImg ? `<a href="${backImg}" target="_blank"><img src="${backImg}" alt="Back Mockup" style="height:55px;width:auto;border:1px solid #eee;border-radius:4px;" /></a>` : ""}
              </div>
            ` : ""}
          </td>
          <td style="padding:10px 8px;vertical-align:top;text-align:right;font-weight:bold;color:#222;">
            ₹${lineTotal.toLocaleString("en-IN")}
          </td>
        </tr>
      `;
    })
    .join("");

  const summaryText = `
========================================
NEW TEESZONE ORDER CONFIRMED
========================================
Order Number : ${order.orderNumber}
Customer     : ${order.userName || "Customer"}
Email        : ${order.userEmail || "—"}
Phone        : ${order.userPhone || "—"}
Amount Paid  : ₹${order.amount.toLocaleString("en-IN")}
Items Count  : ${order.items?.length || 0}
Address      : ${typeof order.shippingAddress === "string" ? order.shippingAddress : JSON.stringify(order.shippingAddress || {})}
========================================
View in Admin: http://localhost:3001/orders
`;

  if (!config.resend_api_key) {
    logger.info(`[DEV EMAIL] Order Notification to ${recipients.join(", ")}:\n${summaryText}`);
    return;
  }

  const resend = new Resend(config.resend_api_key);
  const { error } = await resend.emails.send({
    from: config.mail_from,
    to: recipients,
    subject: `[TeesZone Order] #${order.orderNumber} placed by ${order.userName || "Customer"} - ₹${order.amount.toLocaleString("en-IN")}`,
    text: summaryText,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;color:#222222;max-width:620px;margin:0 auto;padding:20px;background:#f9f9f9;">
  <div style="background:#80011F;padding:20px 24px;border-radius:8px 8px 0 0;color:#ffffff;text-align:left;">
    <h2 style="margin:0;font-size:22px;letter-spacing:0.5px;">TeesZone — Order Confirmation</h2>
    <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Order #${order.orderNumber} · Confirmed via Razorpay</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#ffffff;">
    <p style="font-size:14px;margin-top:0;">A new custom apparel order has been placed successfully.</p>
    
    <div style="background:#FAF5F6;border-left:4px solid #80011F;padding:12px 16px;border-radius:4px;margin-bottom:20px;font-size:13px;line-height:1.6;">
      <strong style="color:#80011F;display:block;margin-bottom:4px;font-size:14px;">Customer Information:</strong>
      <strong>Name:</strong> ${order.userName || "Customer"}<br/>
      <strong>Email:</strong> <a href="mailto:${order.userEmail}" style="color:#80011F;">${order.userEmail || "—"}</a><br/>
      <strong>Phone:</strong> <a href="tel:${order.userPhone}" style="color:#80011F;">${order.userPhone || "—"}</a>
      ${order.shippingAddress ? `<br/><strong>Shipping Address:</strong> ${typeof order.shippingAddress === "string" ? order.shippingAddress : JSON.stringify(order.shippingAddress)}` : ""}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;">
          <th style="padding:10px 8px;text-align:left;color:#475569;">Item &amp; Specifications</th>
          <th style="padding:10px 8px;text-align:right;color:#475569;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding:14px 8px;font-weight:bold;font-size:15px;text-align:right;border-top:2px solid #e2e8f0;">Total Amount Paid:</td>
          <td style="padding:14px 8px;font-weight:900;font-size:18px;color:#80011F;text-align:right;border-top:2px solid #e2e8f0;">₹${order.amount.toLocaleString("en-IN")}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:24px;padding-top:16px;border-top:1px dashed #cbd5e1;text-align:center;font-size:12px;color:#64748b;">
      <p style="margin:0 0 8px;">To inspect high-resolution vector logos and manufacturing specs, log in to the admin panel:</p>
      <a href="http://localhost:3001/orders" style="display:inline-block;background:#80011F;color:#ffffff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:12px;">Open Admin Dashboard</a>
    </div>
  </div>
</body>
</html>`,
  });
  if (error) logger.error({ error }, "sendOrderPlacedNotification failed");
};
