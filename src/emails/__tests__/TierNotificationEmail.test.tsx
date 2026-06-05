import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import { TierNotificationEmail } from '../TierNotificationEmail';

describe('TierNotificationEmail', () => {
  it('renders correct limits for Executive Chef', async () => {
    const html = await render(
      <TierNotificationEmail tier="executive-chef" name="Bob" />
    );
    expect(html).toContain('Executive Chef');
    expect(html).toContain('2500 recipes');
    expect(html).toContain('200 cookbooks');
  });

  it('renders pricing information matching the upgraded tier', async () => {
    const html = await render(
      <TierNotificationEmail tier="executive-chef" name="Bob" />
    );
    expect(html).toContain('$9.99/mo');
    expect(html).toContain('$99.99/yr');
  });

  it('renders pricing and limits for Sous Chef', async () => {
    const html = await render(
      <TierNotificationEmail tier="sous-chef" />
    );
    expect(html).toContain('Sous Chef');
    expect(html).toContain('500 recipes');
    expect(html).toContain('25 cookbooks');
    expect(html).toContain('$5.99/mo');
  });
});
