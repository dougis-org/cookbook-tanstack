import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendEmail, resetTransporter } from '@/lib/mail';

const mockMailtrapTransport = { name: 'mailtrap-transport-mock' };
vi.mock('mailtrap', () => ({
  MailtrapTransport: vi.fn(() => mockMailtrapTransport),
}));

vi.mock('nodemailer');

describe('sendEmail', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTransporter();
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    process.env.MAILTRAP_API_TOKEN = 'test-token';
    process.env.MAIL_FROM = 'Cookbook <test@example.com>';
  });

  it('calls sendMail with correct data', async () => {
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

  it('singleton works in sequence', async () => {
    resetTransporter();
    vi.clearAllMocks();
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);
    await sendEmail({ to: '1@ex.com', subject: 's', text: 't' });
    await sendEmail({ to: '2@ex.com', subject: 's', text: 't' });
    expect(vi.mocked(nodemailer.createTransport)).toHaveBeenCalledTimes(1);
  });

  it('warns and rejects if MAILTRAP_API_TOKEN is missing', async () => {
    delete process.env.MAILTRAP_API_TOKEN;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resetTransporter();
    await expect(sendEmail({ to: 'u@e.com', subject: 's', text: 't' })).rejects.toThrow('Missing Mailtrap configuration');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing Mailtrap configuration'));
    warnSpy.mockRestore();
  });

  it('uses default from address if MAIL_FROM is missing', async () => {
    delete process.env.MAIL_FROM;
    await sendEmail({ to: 'u@e.com', subject: 's', text: 't' });
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Cookbook App <noreply@example.com>',
    }));
  });
});
