import { Section, Text, Button, Link } from '@react-email/components';
import { Layout } from './Layout';

interface VerificationEmailProps {
  url: string;
  name?: string;
}

export function VerificationEmail({ url, name }: VerificationEmailProps) {
  const greeting = name ? `Welcome, ${name}!` : 'Welcome to My CookBooks!';

  return (
    <Layout previewText="Verify your email address for My CookBooks">
      <Text style={heading}>{greeting}</Text>
      <Text style={paragraph}>
        Thanks for signing up for My CookBooks! To get started exploring, creating, and sharing your recipes, please verify your email address by clicking the button below.
      </Text>
      <Section style={btnContainer}>
        <Button href={url} style={button}>
          Verify Email Address
        </Button>
      </Section>
      <Text style={paragraph}>
        If the button above doesn't work, you can also copy and paste the following link into your browser:
      </Text>
      <Text style={linkText}>
        <Link href={url} style={link}>{url}</Link>
      </Text>
      <Text style={paragraph}>
        Happy cooking,
        <br />
        The My CookBooks Team
      </Text>
    </Layout>
  );
}

const heading = {
  fontSize: '24px',
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

const linkText = {
  fontSize: '14px',
  color: '#94a3b8',
  wordBreak: 'break-all' as const,
  margin: '12px 0',
};

const link = {
  color: '#22d3ee',
  textDecoration: 'underline',
};
