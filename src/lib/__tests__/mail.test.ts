import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import nodemailer from 'nodemailer';
import { sendEmail, resetTransporter } from '@/lib/mail';

const mockMailtrapTransport = { name: 'mailtrap-transport-mock' };
vi.mock('mailtrap', () => ({
  MailtrapTransport: vi.fn(() => mockMailtrapTransport),
}));

vi.mock('nodemailer');

let shouldRenderThrow = false;
vi.mock('@react-email/render', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-email/render')>();
  return {
    ...original,
    render: vi.fn(async (element: React.ReactElement, options?: any) => {
      if (shouldRenderThrow) {
        throw new Error('Render error');
      }
      return original.render(element, options);
    }),
  };
});

describe('sendEmail', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTransporter();
    shouldRenderThrow = false;
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    process.env.MAILTRAP_API_TOKEN = 'test-token';
    process.env.MAIL_FROM = 'Cookbook <test@example.com>';
    delete process.env.MAILTRAP_INBOX_ID;
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
    await sendEmail({ to: '1@ex.com', subject: 's', text: 't' });
    await sendEmail({ to: '2@ex.com', subject: 's', text: 't' });
    expect(vi.mocked(nodemailer.createTransport)).toHaveBeenCalledTimes(1);
  });

  it('warns and rejects if MAILTRAP_API_TOKEN is missing', async () => {
    delete process.env.MAILTRAP_API_TOKEN;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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

  it('passes testInboxId when MAILTRAP_INBOX_ID is a valid positive integer', async () => {
    const { MailtrapTransport } = await import('mailtrap');
    process.env.MAILTRAP_INBOX_ID = '12345';
    await sendEmail({ to: 'u@e.com', subject: 's', text: 't' });
    expect(vi.mocked(MailtrapTransport)).toHaveBeenCalledWith(
      expect.objectContaining({ testInboxId: 12345 }),
    );
  });

  it('throws for a non-integer MAILTRAP_INBOX_ID', async () => {
    process.env.MAILTRAP_INBOX_ID = '123abc';
    await expect(sendEmail({ to: 'u@e.com', subject: 's', text: 't' })).rejects.toThrow(
      'MAILTRAP_INBOX_ID "123abc" must be a valid positive integer',
    );
  });

  it('throws for a zero MAILTRAP_INBOX_ID', async () => {
    process.env.MAILTRAP_INBOX_ID = '0';
    await expect(sendEmail({ to: 'u@e.com', subject: 's', text: 't' })).rejects.toThrow(
      'must be a valid positive integer',
    );
  });

  describe('with react rendering', () => {
    it('compiles a React element into the html and text fields', async () => {
      const reactEl = React.createElement('div', null, 'Hello React Email');
      await sendEmail({
        to: 'user@example.com',
        subject: 'React Subject',
        react: reactEl,
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'React Subject',
          html: expect.stringContaining('Hello React Email'),
          text: expect.stringContaining('Hello React Email'),
        })
      );
    });

    it('gracefully degrades to provided fallback text when render fails and console logs error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const badReactEl = React.createElement('div', null, 'Bad Element');

      shouldRenderThrow = true;

      await sendEmail({
        to: 'user@example.com',
        subject: 'Fail Subject',
        text: 'Fallback Text',
        react: badReactEl,
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Fail Subject',
          text: 'Fallback Text',
        })
      );
      expect(mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0].html).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email rendering failed'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      shouldRenderThrow = false;
    });
  });
});
