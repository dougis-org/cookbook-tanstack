import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const { MAILTRAP_API_TOKEN } = process.env;
    if (!MAILTRAP_API_TOKEN) {
      const msg =
        "Missing Mailtrap configuration (MAILTRAP_API_TOKEN). Email delivery disabled.";
      console.warn(msg);
      throw new Error(msg);
    }
    const rawInboxId = process.env.MAILTRAP_INBOX_ID;
    const testInboxId = rawInboxId ? parseInt(rawInboxId, 10) : undefined;
    if (testInboxId !== undefined && !Number.isFinite(testInboxId)) {
      throw new Error(`MAILTRAP_INBOX_ID "${rawInboxId}" is not a valid integer`);
    }
    transporter = nodemailer.createTransport(
      MailtrapTransport({ token: MAILTRAP_API_TOKEN, testInboxId }),
    );
  }
  return transporter;
}
export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const from = process.env.MAIL_FROM || "Cookbook App <noreply@example.com>";
  const transport = getTransporter();
  return transport.sendMail({ from, ...options });
}

/** @internal - Only for testing */
export function resetTransporter() {
  transporter = null;
}
