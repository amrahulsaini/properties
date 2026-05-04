import nodemailer from "nodemailer";
import twilio from "twilio";
import { defaultBranding } from "@/lib/brand";
import { getEnv, isEmailConfigured, isWhatsAppConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/format";

interface AdvanceBookingNotificationPayload {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  village: string;
  surveyNumber: string;
  area: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentAt: string;
}

export function buildAdvanceBookingMessage(
  payload: AdvanceBookingNotificationPayload,
) {
  const subject =
    "Advance Booking Confirmation - Samarth Developers Pro Pvt. Ltd.";
  const body = [
    `प्रिय ${payload.customerName},`,
    "",
    `आपल्या इसारत रकमेचा ${formatCurrency(payload.advanceAmount)} आज ${formatDate(payload.paymentAt)} रोजी स्वीकार करण्यात आला आहे.`,
    "",
    `संबंधित प्लॉट / जमीन: ${payload.village} - सर्व्हे नं. ${payload.surveyNumber}, एरिया ${payload.area}.`,
    "",
    `ठरलेली एकूण किंमत ${formatCurrency(payload.totalAmount)}, उर्वरित रक्कम ${formatCurrency(payload.remainingAmount)}.`,
    "",
    "अधिकृत पुष्टीसाठी PDF मेमो सोबत जोडला आहे.",
    "",
    `- ${defaultBranding.invoiceHeader}`,
    `GSTIN: ${defaultBranding.gstin}`,
  ].join("\n");

  return { subject, body };
}

export async function sendAdvanceBookingNotifications(
  payload: AdvanceBookingNotificationPayload,
) {
  const { subject, body } = buildAdvanceBookingMessage(payload);
  const results = {
    email: "skipped",
    whatsapp: "skipped",
    subject,
    body,
  };

  if (isEmailConfigured() && payload.customerEmail) {
    const env = getEnv();
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: payload.customerEmail,
      subject,
      text: body,
    });

    results.email = "sent";
  }

  if (isWhatsAppConfigured() && payload.customerPhone) {
    const env = getEnv();
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      from: env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${payload.customerPhone}`,
      body,
    });

    results.whatsapp = "sent";
  }

  return results;
}
