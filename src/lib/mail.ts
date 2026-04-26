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
    transporter = nodemailer.createTransport(
      MailtrapTransport({
        token: MAILTRAP_API_TOKEN,
        sandbox: process.env.MAILTRAP_USE_SANDBOX === "true",
        testInboxId: process.env.MAILTRAP_INBOX_ID
          ? parseInt(process.env.MAILTRAP_INBOX_ID)
          : undefined,
      }),
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
