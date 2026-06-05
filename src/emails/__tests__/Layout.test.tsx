import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import { Layout, getBaseUrl } from '../Layout';

describe('Layout', () => {
  it('compiles with basic text children', async () => {
    const html = await render(
      <Layout previewText="Welcome test">
        <div>Hello World</div>
      </Layout>
    );
    expect(html).toContain('Hello World');
    expect(html).toContain('Welcome test');
  });

  it('contains base colors (dark background slate, light slate text)', async () => {
    const html = await render(
      <Layout>
        <div>Color Test</div>
      </Layout>
    );
    // Background slate #0f172a or #1e293b
    expect(html.toLowerCase()).toMatch(/#0f172a|#1e293b/);
    // Light slate/white text (#f8fafc or similar)
    expect(html.toLowerCase()).toMatch(/#f8fafc|#ffffff/);
  });

  it('getBaseUrl handles malformed URL strings', () => {
    const originalUrl = process.env.APP_PRIMARY_URL;
    process.env.APP_PRIMARY_URL = 'malformed-url///';
    expect(getBaseUrl()).toBe('malformed-url');
    if (originalUrl) {
      process.env.APP_PRIMARY_URL = originalUrl;
    } else {
      delete process.env.APP_PRIMARY_URL;
    }
  });

  it('renders the transaction notice footer text and a link pointing to the /account settings route', async () => {
    const html = await render(
      <Layout>
        <div>Footer Link Test</div>
      </Layout>
    );
    expect(html).toContain('transactional');
    expect(html).toContain('/account');
  });
});
