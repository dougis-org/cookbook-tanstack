import { Section, Text, Button } from '@react-email/components';
import { Layout, getBaseUrl } from './Layout';
import {
  TIER_LIMITS,
  TIER_DISPLAY_NAMES,
  TIER_DESCRIPTIONS,
  TIER_PRICING,
  type EntitlementTier
} from '@/lib/tier-entitlements';

interface TierNotificationEmailProps {
  tier: EntitlementTier;
  name?: string;
}

export function TierNotificationEmail({ tier, name }: TierNotificationEmailProps) {
  const displayName = TIER_DISPLAY_NAMES[tier] || tier;
  const limits = TIER_LIMITS[tier];
  const description = TIER_DESCRIPTIONS[tier];
  const pricing = TIER_PRICING[tier];

  const greeting = name ? `Hello ${name},` : 'Hello,';
  
  const title = `Your Culinary Tier is now ${displayName}`;
  const preview = `Your account has been updated to the ${displayName} tier.`;
  const recipesUrl = `${getBaseUrl()}/recipes`;

  return (
    <Layout previewText={preview}>
      <Text style={heading}>{title}</Text>
      <Text style={paragraph}>{greeting}</Text>
      <Text style={paragraph}>
        An administrator has updated your culinary tier to <strong>{displayName}</strong>. Here is a summary of the benefits and features included in your updated tier:
      </Text>
      
      <Section style={cardDetails}>
        <Text style={detailTitle}>Tier Benefits</Text>
        <Text style={detailItem}>{`• ${limits.recipes} recipes limit`}</Text>
        <Text style={detailItem}>{`• ${limits.cookbooks} cookbooks limit`}</Text>
        <Text style={detailItem}>{`• ${description}`}</Text>
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
