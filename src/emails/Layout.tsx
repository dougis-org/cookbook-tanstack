import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
} from '@react-email/components';

interface LayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export function getBaseUrl() {
  let cleanBaseUrl = process.env.APP_PRIMARY_URL || process.env.BETTER_AUTH_URL || "https://mycookbooks.app";
  try {
    cleanBaseUrl = new URL(cleanBaseUrl).origin;
  } catch {
    cleanBaseUrl = cleanBaseUrl.replace(/\/+$/, "");
  }
  return cleanBaseUrl;
}

export function Layout({ children, previewText }: LayoutProps) {
  const baseUrl = getBaseUrl();
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>
              My <span style={highlight}>CookBooks</span>
            </Heading>
          </Section>
          <Section style={card}>
            {children}
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              Sent by My CookBooks • <Link href={baseUrl} style={footerLink}>Visit Website</Link>
            </Text>
            <Text style={footerText}>
              This is a mandatory transactional email regarding your account settings. You can manage notification preferences in your <Link href={`${baseUrl}/account`} style={footerLink}>account settings</Link>.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} My CookBooks. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styling tokens
const colors = {
  bg: '#0f172a',
  cardBg: '#1e293b',
  text: '#f8fafc',
  textMuted: '#cbd5e1',
  textMutedDarker: '#94a3b8',
  cyan: '#22d3ee',
  border: '#334155',
};

const main = {
  backgroundColor: colors.bg,
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  margin: '0 auto',
  padding: '40px 0',
};

const container = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '0 20px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const logo = {
  color: colors.text,
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
};

const highlight = {
  color: colors.cyan,
};

const card = {
  backgroundColor: colors.cardBg,
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  padding: '40px 30px',
  color: colors.textMuted,
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerText = {
  color: colors.textMutedDarker,
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

const footerLink = {
  color: colors.cyan,
  textDecoration: 'underline',
};
