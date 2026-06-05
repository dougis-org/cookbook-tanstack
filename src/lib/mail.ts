import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import { render } from "@react-email/render";
import type React from "react";

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
    let testInboxId: number | undefined;
    if (rawInboxId !== undefined) {
      if (!/^[1-9]\d*$/.test(rawInboxId)) {
        throw new Error(
          `MAILTRAP_INBOX_ID "${rawInboxId}" must be a valid positive integer`,
        );
      }
      testInboxId = Number(rawInboxId);
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
  text?: string;
  html?: string;
  react?: React.ReactElement;
}

export async function sendEmail(options: SendEmailOptions) {
  const from = process.env.MAIL_FROM || "Cookbook App <noreply@example.com>";
  const transport = getTransporter();

  const { react, ...restOptions } = options;
  let html = restOptions.html;
  let text = restOptions.text;

  if (react) {
    try {
      const renderedHtml = await render(react);
      const renderedText = await render(react, { plainText: true });
      html = renderedHtml;
      text = renderedText;
    } catch (error) {
      console.error("Email rendering failed, falling back to text options:", error);
      html = restOptions.html;
      text = restOptions.text;
    }
  }

  if (!html && !text) {
    throw new Error("Email body content must be provided (either react, html, or text)");
  }

  return transport.sendMail({
    from,
    ...restOptions,
    html,
    text,
  });
}

/** @internal - Only for testing */
export function resetTransporter() {
  transporter = null;
}
