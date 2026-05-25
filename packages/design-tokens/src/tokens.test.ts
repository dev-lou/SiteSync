import { describe, it, expect } from 'vitest';
import { colors, typography, spacing, radii, roleLabels } from './tokens';

describe('design-tokens', () => {
  it('colors have light and dark themes', () => {
    expect(colors.light.background).toBe('oklch(0.98 0 0)');
    expect(colors.dark.background).toBe('oklch(0.13 0.02 260)');
    expect(Object.keys(colors.light)).toEqual(Object.keys(colors.dark));
  });

  it('typography has required properties', () => {
    expect(typography.fontFamily).toContain('Inter');
    expect(typography.scale.base).toBe('1rem');
    expect(typography.weights.normal).toBe(400);
  });

  it('spacing includes common values', () => {
    expect(spacing[0]).toBe('0px');
    expect(spacing[4]).toBe('1rem');
    expect(spacing[16]).toBe('4rem');
  });

  it('radii includes all variants', () => {
    expect(radii.md).toBe('0.5rem');
    expect(radii.full).toBe('9999px');
  });

  it('roleLabels covers all roles', () => {
    expect(roleLabels.admin).toBe('Admin');
    expect(roleLabels.field_engineer).toBe('Field Engineer');
    expect(roleLabels.hse_officer).toBe('HSE Officer');
    expect(Object.keys(roleLabels).length).toBe(6);
  });
});
