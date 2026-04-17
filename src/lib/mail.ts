import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const { MAILTRAP_HOST, MAILTRAP_USER, MAILTRAP_PASS, MAILTRAP_PORT } = process.env;

    if (!MAILTRAP_HOST || !MAILTRAP_USER || !MAILTRAP_PASS) {
      console.warn('Missing Mailtrap configuration. Email delivery will likely fail.');
    }

    const port = parseInt(MAILTRAP_PORT || '2525', 10);
    if (isNaN(port)) {
      console.warn(`Invalid MAILTRAP_PORT: ${MAILTRAP_PORT}. Defaulting to 2525.`);
    }

    transporter = nodemailer.createTransport({
      host: MAILTRAP_HOST,
      port: isNaN(port) ? 2525 : port,
      auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS,
      },
    });
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
  const from = process.env.MAIL_FROM || 'Cookbook <noreply@example.com>';
  const transport = getTransporter();
  return transport.sendMail({
    from,
    ...options,
  });
}

/** @internal - Only for testing */
export function resetTransporter() {
  transporter = null;
}
