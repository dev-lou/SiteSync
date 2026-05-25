import { getAuthConfigProvider } from '@convex-dev/better-auth/plugins/convex';
import type { AuthConfig } from '@convex-dev/better-auth';

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
