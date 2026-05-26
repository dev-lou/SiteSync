import { json } from '@sveltejs/kit';
import https from 'node:https';

const CONVEX_URL = process.env.CONVEX_URL || 'https://resilient-lemur-480.convex.site';

export async function GET() {
  const results: Record<string, unknown> = {
    nodeVersion: process.version,
    fetchType: typeof fetch,
    configuredConvexUrl: CONVEX_URL,
  };

  // Test 1: fetch to convex.site/health
  try {
    const res = await fetch(`${CONVEX_URL}/health`);
    results.fetchHealthStatus = res.status;
    results.fetchHealthBody = await res.text();
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    results.fetchHealthError = e.message;
    results.fetchHealthCause = e.cause instanceof Error ? e.cause.message : e.cause;
  }

  // Test 2: fetch to convex.site/api/auth/session
  try {
    const res = await fetch(`${CONVEX_URL}/api/auth/session`, {
      redirect: 'manual',
    });
    results.fetchSessionStatus = res.status;
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    results.fetchSessionError = e.message;
    results.fetchSessionCause = e.cause instanceof Error ? e.cause.message : e.cause;
  }

  // Test 3: https module to convex.site/health
  try {
    const body = await new Promise<string>((resolve, reject) => {
      const req = https.get(`${CONVEX_URL}/health`, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('timeout'));
      });
      req.end();
    });
    results.httpsHealthBody = body;
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    results.httpsHealthError = e.message;
  }

  // Test 4: DNS check
  try {
    const url = new URL(CONVEX_URL);
    results.hostname = url.hostname;
  } catch (err: unknown) {
    results.urlParseError = String(err);
  }

  return json(results);
}
