import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import { VerificationEmail } from '../VerificationEmail';

describe('VerificationEmail', () => {
  it('renders a greeting and logo', async () => {
    const html = await render(
      <VerificationEmail url="https://example.com/verify" name="Alice" />
    );
    // Logo text "My CookBooks" is in Layout
    expect(html).toContain('My');
    expect(html).toContain('CookBooks');
    // Greeting
    expect(html).toContain('Welcome, Alice!');
  });

  it('renders a greeting with generic name if none provided', async () => {
    const html = await render(
      <VerificationEmail url="https://example.com/verify" />
    );
    expect(html).toContain('Welcome to My CookBooks!');
  });

  it('contains the verification url in the rendered HTML', async () => {
    const html = await render(
      <VerificationEmail url="https://example.com/verify?token=123" />
    );
    expect(html).toContain('href="https://example.com/verify?token=123"');
  });
});
