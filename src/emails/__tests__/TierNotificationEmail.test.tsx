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

  it('renders upgrade heading, limits, and pricing when changeType is upgrade', async () => {
    const html = await render(
      <TierNotificationEmail
        tier="executive-chef"
        name="Bob"
        changeType="upgrade"
      />
    );
    expect(html).toContain('Welcome to the Executive Chef tier');
    expect(html).toContain('2500 recipes');
    expect(html).toContain('200 cookbooks');
    expect(html).toContain('$9.99/mo');
    expect(html).toContain('1-click recipe imports');
  });

  it('renders downgrade message, hidden item counts when changeType is downgrade', async () => {
    const html = await render(
      <TierNotificationEmail
        tier="home-cook"
        name="Bob"
        changeType="downgrade"
        recipesHidden={15}
        cookbooksHidden={3}
      />
    );
    expect(html).toContain('Your tier has been adjusted to Home Cook');
    expect(html).toContain('15 recipes and 3 cookbooks have been hidden to comply with your new tier limits');
  });

  it('does not render hidden item counts when none are hidden', async () => {
    const html = await render(
      <TierNotificationEmail
        tier="home-cook"
        name="Bob"
        changeType="downgrade"
        recipesHidden={0}
        cookbooksHidden={0}
      />
    );
    expect(html).not.toContain('have been hidden to comply');
  });

  it('renders correct singular/plural messages when only one resource type is hidden', async () => {
    // 1 recipe hidden
    let html = await render(
      <TierNotificationEmail tier="home-cook" recipesHidden={1} cookbooksHidden={0} />
    );
    expect(html).toContain('1 recipe has been hidden to comply with your new tier limits');

    // 5 recipes hidden
    html = await render(
      <TierNotificationEmail tier="home-cook" recipesHidden={5} cookbooksHidden={0} />
    );
    expect(html).toContain('5 recipes have been hidden to comply with your new tier limits');

    // 1 cookbook hidden
    html = await render(
      <TierNotificationEmail tier="home-cook" recipesHidden={0} cookbooksHidden={1} />
    );
    expect(html).toContain('1 cookbook has been hidden to comply with your new tier limits');

    // 2 cookbooks hidden
    html = await render(
      <TierNotificationEmail tier="home-cook" recipesHidden={0} cookbooksHidden={2} />
    );
    expect(html).toContain('2 cookbooks have been hidden to comply with your new tier limits');
  });
});
