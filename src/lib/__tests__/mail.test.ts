import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendEmail, resetTransporter } from '../mail';

vi.mock('nodemailer');

describe('sendEmail', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTransporter();
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);

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

  it('singleton works in sequence', async () => {
    resetTransporter();
    vi.clearAllMocks();
    await sendEmail({ to: '1@ex.com', subject: 's', text: 't' });
    await sendEmail({ to: '2@ex.com', subject: 's', text: 't' });
    expect(vi.mocked(nodemailer.createTransport)).toHaveBeenCalledTimes(1);
  });

  it('warns if environment variables are missing', async () => {
    delete process.env.MAILTRAP_HOST;
    delete process.env.MAILTRAP_USER;
    delete process.env.MAILTRAP_PASS;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    resetTransporter();
    await sendEmail({ to: 'u@e.com', subject: 's', text: 't' });
    
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing Mailtrap configuration'));
    warnSpy.mockRestore();
  });

  it('handles invalid port by defaulting to 2525', async () => {
    process.env.MAILTRAP_PORT = 'invalid';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    resetTransporter();
    await sendEmail({ to: 'u@e.com', subject: 's', text: 't' });
    
    expect(vi.mocked(nodemailer.createTransport)).toHaveBeenCalledWith(expect.objectContaining({
      port: 2525
    }));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid MAILTRAP_PORT'));
    warnSpy.mockRestore();
  });

  it('use default from address if MAIL_FROM missing', async () => {
    delete process.env.MAIL_FROM;
    await sendEmail({ to: 'u@e.com', subject: 's', text: 't' });
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Cookbook <noreply@example.com>',
    }));
  });
});
