import { headers } from 'next/headers';

/**
 * Server-side IP extraction from request headers.
 * Works in Next.js Route Handlers and Server Components.
 */
export async function getUserIp(): Promise<string> {
  const headersList = await headers();

  // Prioritized header checks (proxy-aware)
  const candidates = [
    headersList.get('cf-connecting-ip'),     // Cloudflare
    headersList.get('x-real-ip'),            // Nginx
    headersList.get('x-forwarded-for'),      // Proxy chains
    headersList.get('x-client-ip'),
  ];

  for (const candidate of candidates) {
    if (candidate) {
      // x-forwarded-for can be a comma-separated list — take the first
      const ip = candidate.split(',')[0].trim();
      if (ip && ip !== '::1' && ip !== '127.0.0.1') return ip;
    }
  }

  return '127.0.0.1';
}
