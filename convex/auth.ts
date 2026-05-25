import { betterAuth } from 'better-auth';
import { convex } from '@convex-dev/better-auth/plugins/convex';

export function createAuth() {
  return betterAuth({
    plugins: [convex()],
    magicLink: {
      enabled: true,
    },
  });
}
