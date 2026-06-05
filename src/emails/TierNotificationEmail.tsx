import { Section, Text, Button } from '@react-email/components';
import { Layout, getBaseUrl } from './Layout';
import {
  TIER_LIMITS,
  TIER_DISPLAY_NAMES,
  TIER_DESCRIPTIONS,
  TIER_PRICING,
  canImport,
  type EntitlementTier
} from '@/lib/tier-entitlements';

interface TierNotificationEmailProps {
  tier: EntitlementTier;
  name?: string;
  changeType?: 'upgrade' | 'downgrade' | 'admin-change' | 'trial-expiring';
  recipesHidden?: number;
  cookbooksHidden?: number;
  madePublic?: number;
}

export function TierNotificationEmail({
  tier,
  name,
  changeType = 'admin-change',
  recipesHidden,
  cookbooksHidden,
  madePublic,
}: TierNotificationEmailProps) {
  const displayName = TIER_DISPLAY_NAMES[tier] || tier;
  const limits = TIER_LIMITS[tier];
  const description = TIER_DESCRIPTIONS[tier];
  const pricing = TIER_PRICING[tier];

  const greeting = name ? `Hello ${name},` : 'Hello,';
  
  let title = `Your Culinary Tier is now ${displayName}`;
  let introText = `An administrator has updated your culinary tier to ${displayName}. Here is a summary of the benefits and features included in your updated tier:`;

  if (changeType === 'upgrade') {
    title = `Welcome to the ${displayName} tier`;
    introText = `Your account has been upgraded to ${displayName}. Here is a summary of the benefits and features included in your new tier:`;
  } else if (changeType === 'downgrade') {
    title = `Your tier has been adjusted to ${displayName}`;
    introText = `Your account has been adjusted to the ${displayName} tier.`;
  } else if (changeType === 'trial-expiring') {
    title = `Your Trial is Expiring Soon`;
    introText = `Your trial is expiring soon, and your tier will be adjusted to ${displayName}.`;
  }

  const preview = `Your account has been updated to the ${displayName} tier.`;
  const recipesUrl = `${getBaseUrl()}/recipes`;

  return (
    <Layout previewText={preview}>
      <Text style={heading}>{title}</Text>
      <Text style={paragraph}>{greeting}</Text>
      <Text style={paragraph}>{introText}</Text>
      
      {((recipesHidden !== undefined && recipesHidden > 0) || (cookbooksHidden !== undefined && cookbooksHidden > 0)) && (
        <Text style={paragraph}>
          {`${recipesHidden ?? 0} recipes and ${cookbooksHidden ?? 0} cookbooks have been hidden to comply with your new tier limits.`}
        </Text>
      )}

      {madePublic !== undefined && madePublic > 0 && (
        <Text style={paragraph}>
          Additionally, {madePublic} private items have been made public to comply with your new tier limits.
        </Text>
      )}
      
      <Section style={cardDetails}>
        <Text style={detailTitle}>Tier Benefits</Text>
        <Text style={detailItem}>{`• ${limits.recipes} recipes limit`}</Text>
        <Text style={detailItem}>{`• ${limits.cookbooks} cookbooks limit`}</Text>
        <Text style={detailItem}>{`• ${description}`}</Text>
        {canImport(tier) && (
          <Text style={detailItem}>• 1-click recipe imports</Text>
        )}
        {pricing.monthly !== null && (
          <Text style={detailItem}>
            • Pricing: <strong>{`$${pricing.monthly}/mo`}</strong> (or <strong>{`$${pricing.annual}/yr`}</strong>)
          </Text>
        )}
      </Section>

      <Text style={paragraph}>
        You can log in to your account now to start creating and sharing.
      </Text>
      
      <Section style={btnContainer}>
        <Button href={recipesUrl} style={button}>
          View Recipes
        </Button>
      </Section>
      
      <Text style={paragraph}>
        Happy cooking,
        <br />
        The My CookBooks Team
      </Text>
    </Layout>
  );
}

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#f8fafc',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#cbd5e1',
  margin: '16px 0',
};

const cardDetails = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '20px 0',
};

const detailTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#22d3ee',
  margin: '0 0 12px',
};

const detailItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#f8fafc',
  margin: '6px 0',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#22d3ee',
  borderRadius: '6px',
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};
