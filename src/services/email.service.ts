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
