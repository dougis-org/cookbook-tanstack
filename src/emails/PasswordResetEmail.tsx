import { Section, Text, Button, Link } from '@react-email/components';
import { Layout } from './Layout';

interface PasswordResetEmailProps {
  url: string;
}

export function PasswordResetEmail({ url }: PasswordResetEmailProps) {
  return (
    <Layout previewText="Reset your password for My CookBooks">
      <Text style={heading}>Reset Your Password</Text>
      <Text style={paragraph}>
        We received a request to reset the password for your My CookBooks account. Click the button below to choose a new password:
      </Text>
      <Section style={btnContainer}>
        <Button href={url} style={button}>
          Reset Password
        </Button>
      </Section>
      <Text style={warningText}>
        <strong>Security Notice:</strong> For security reasons, this link is only valid for a limited time. If you did not request a password reset, you can safely ignore this email; your password will remain secure and unchanged.
      </Text>
      <Text style={paragraph}>
        If the button above doesn't work, copy and paste this link into your browser:
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

const warningText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#94a3b8',
  backgroundColor: '#1e293b',
  borderLeft: '4px solid #ef4444',
  padding: '12px 16px',
  margin: '20px 0',
  borderRadius: '0 4px 4px 0',
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
