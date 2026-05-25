export const colors = {
  light: {
    background: 'oklch(0.98 0 0)',
    foreground: 'oklch(0.15 0.02 260)',
    primary: 'oklch(0.55 0.17 255)',
    'primary-foreground': 'oklch(0.98 0 0)',
    secondary: 'oklch(0.95 0.03 240)',
    'secondary-foreground': 'oklch(0.25 0.05 240)',
    muted: 'oklch(0.96 0.01 260)',
    'muted-foreground': 'oklch(0.55 0.02 260)',
    accent: 'oklch(0.55 0.18 280)',
    'accent-foreground': 'oklch(0.98 0 0)',
    destructive: 'oklch(0.58 0.22 28)',
    'destructive-foreground': 'oklch(0.98 0 0)',
    border: 'oklch(0.9 0.01 260)',
    input: 'oklch(0.9 0.01 260)',
    ring: 'oklch(0.55 0.17 255)',
    success: 'oklch(0.6 0.18 145)',
    warning: 'oklch(0.7 0.18 85)',
    danger: 'oklch(0.58 0.22 28)',
  },
  dark: {
    background: 'oklch(0.13 0.02 260)',
    foreground: 'oklch(0.93 0.01 260)',
    primary: 'oklch(0.65 0.15 255)',
    'primary-foreground': 'oklch(0.13 0.02 260)',
    secondary: 'oklch(0.2 0.03 260)',
    'secondary-foreground': 'oklch(0.93 0.01 260)',
    muted: 'oklch(0.18 0.02 260)',
    'muted-foreground': 'oklch(0.6 0.02 260)',
    accent: 'oklch(0.32 0.15 280)',
    'accent-foreground': 'oklch(0.93 0.01 260)',
    destructive: 'oklch(0.55 0.2 28)',
    'destructive-foreground': 'oklch(0.93 0.01 260)',
    border: 'oklch(0.22 0.02 260)',
    input: 'oklch(0.22 0.02 260)',
    ring: 'oklch(0.65 0.15 255)',
    success: 'oklch(0.5 0.15 145)',
    warning: 'oklch(0.55 0.16 85)',
    danger: 'oklch(0.55 0.2 28)',
  },
} as const;

export const typography = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  scale: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.05,
    snug: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const radii = {
  none: '0',
  xs: 'calc(0.5rem - 4px)',
  sm: 'calc(0.5rem - 2px)',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 0 0 1px oklch(0 0 0 / 0.02)',
  sm: '0 1px 2px oklch(0 0 0 / 0.04)',
  md: '0 4px 12px oklch(0 0 0 / 0.06)',
  lg: '0 8px 24px oklch(0 0 0 / 0.08)',
  xl: '0 12px 36px oklch(0 0 0 / 0.1)',
} as const;

export type UserRole =
  | 'admin'
  | 'project_manager'
  | 'procurement'
  | 'architect'
  | 'field_engineer'
  | 'hse_officer';

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  procurement: 'Procurement Officer',
  architect: 'Architect / Design Engineer',
  field_engineer: 'Field Engineer',
  hse_officer: 'HSE Officer',
};
