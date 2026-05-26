import { createClient } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { betterAuth } from 'better-auth';
import authConfig from './auth.config';
import { env } from './shared/env';

export const authComponent = createClient<DataModel>(components.betterAuth);

export function createAuth(ctx: any) {
  return betterAuth({
    baseURL: env('SITE_URL') || 'http://localhost:3000',
    trustedOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
}
