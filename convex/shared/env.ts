/**
 * Centralized, typed environment variable accessor.
 *
 * Convex runs in a Cloudflare Workers–like edge runtime where `process.env`
 * is not available.  Convex injects env vars as global `process` with an
 * optional `env` property on the first invocation of a function.
 *
 * Use `env()` instead of raw `(process as any).env?.KEY` throughout the
 * codebase to keep env access consistent, testable, and easy to audit.
 */

/** Known project environment variables with their string values. */
export interface EnvVars {
  /** Base URL of the SvelteKit front end (used for auth redirects). */
  SITE_URL: string;
  /** Google Gemini API key for photo analysis (optional — gracefully degrades). */
  GEMINI_API_KEY?: string;
}

/**
 * Safely read an environment variable at runtime.
 *
 * Returns `undefined` if the variable is not set.
 *
 * @example
 *   env("SITE_URL")           // → "http://localhost:5173" | undefined
 *   env("GEMINI_API_KEY")     // → "AIza..."              | undefined
 */
export function env<K extends keyof EnvVars>(key: K): EnvVars[K] | undefined {
  return (process as { env?: Record<string, string> }).env?.[key] as EnvVars[K] | undefined;
}

/**
 * Read a *required* environment variable at runtime.
 *
 * Throws a clear error if the variable is missing — use this for env vars
 * without which the app cannot function.
 *
 * @example
 *   envRequired("SITE_URL")   // → "http://localhost:5173"  | throws
 */
export function envRequired<K extends keyof EnvVars>(key: K): EnvVars[K] {
  const value = env(key);
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable "${key}". ` +
        'Check your Convex environment variable settings or .env.local file.',
    );
  }
  return value;
}
