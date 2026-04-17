import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendEmail, resetTransporter } from '../mail';

vi.mock('nodemailer');

describe('sendEmail', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
  const mockCreateTransport = vi.fn().mockReturnValue({
    sendMail: mockSendMail,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTransporter();
    (nodemailer.createTransport as any) = mockCreateTransport;
    
    process.env.MAILTRAP_HOST = 'test.host';
    process.env.MAILTRAP_PORT = '2525';
    process.env.MAILTRAP_USER = 'test-user';
    process.env.MAILTRAP_PASS = 'test-pass';
    process.env.MAIL_FROM = 'Cookbook <test@example.com>';
  });

  it('call nodemailer with correct data', async () => {
    const emailData = {
      to: 'user@example.com',
      subject: 'Test Subject',
      text: 'Hello world',
      html: '<p>Hello world</p>',
    };

    await sendEmail(emailData);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: process.env.MAIL_FROM,
      ...emailData,
    });
  });

  it('reuse transporter instance', async () => {
    // Need to NOT reset in between these two calls to test singleton
    // But beforeEach resets it.
    // Let's test in one 'it' block.
  });

  it('singleton works in sequence', async () => {
    resetTransporter();
    vi.clearAllMocks();
    await sendEmail({ to: '1@ex.com', subject: 's', text: 't' });
    await sendEmail({ to: '2@ex.com', subject: 's', text: 't' });
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
  });

  it('use default from address if MAIL_FROM missing', async () => {
    delete process.env.MAIL_FROM;
    await sendEmail({ to: 'u@e.com', subject: 's', text: 't' });
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Cookbook <noreply@example.com>',
    }));
  });
});
