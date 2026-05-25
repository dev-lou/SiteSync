/**
 * Format a timestamp to a human-readable date string.
 */
export function formatDate(ts: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a timestamp to a human-readable date + time string.
 */
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp as relative time ("2 hours ago", "just now", etc.)
 */
export function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(ts);
}

/**
 * Get initials (max 2 chars) from a name or ID.
 */
export function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

/**
 * Check if a timestamp is expiring within the next 24 hours.
 */
export function isExpiringSoon(expiresAt: number): boolean {
  return expiresAt < Date.now() + 86400000;
}

/**
 * Format a number as a percentage.
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Pluralize a word based on count.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || `${singular}s`;
}
