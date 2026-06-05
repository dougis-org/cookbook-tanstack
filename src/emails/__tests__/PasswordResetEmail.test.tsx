import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import { PasswordResetEmail } from '../PasswordResetEmail';

describe('PasswordResetEmail', () => {
  it('renders a security warning', async () => {
    const html = await render(
      <PasswordResetEmail url="https://example.com/reset" />
    );
    expect(html).toContain('Reset Your Password');
    expect(html.toLowerCase()).toContain('security');
    expect(html).toContain('did not request');
  });

  it('contains the reset url in the rendered HTML', async () => {
    const html = await render(
      <PasswordResetEmail url="https://example.com/reset?token=abc" />
    );
    expect(html).toContain('href="https://example.com/reset?token=abc"');
  });
});
