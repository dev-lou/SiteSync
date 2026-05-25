# SiteSync Pro — Design System

## Overview

This document defines the visual language for SiteSync Pro. All components, layouts, and interactions must adhere to these tokens. Changing the colour palette or typography requires editing only `src/app.css` (CSS custom properties) and `src/lib/design/tokens.ts` (TypeScript exports).

---

## 1. Colour Tokens

All colours use the `oklch()` colour space for perceptual uniformity across light and dark modes.

### Light Palette (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.98 0 0)` | Page background |
| `--foreground` | `oklch(0.15 0.02 260)` | Primary text |
| `--primary` | `oklch(0.55 0.17 255)` | Buttons, links, active states |
| `--primary-foreground` | `oklch(0.98 0 0)` | Text on primary |
| `--secondary` | `oklch(0.95 0.03 240)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.25 0.05 240)` | Text on secondary |
| `--muted` | `oklch(0.96 0.01 260)` | Subtle backgrounds, skeletons |
| `--muted-foreground` | `oklch(0.55 0.02 260)` | Secondary text, placeholders |
| `--accent` | `oklch(0.55 0.18 280)` | Accent purple |
| `--accent-foreground` | `oklch(0.98 0 0)` | Text on accent |
| `--border` | `oklch(0.9 0.01 260)` | Card borders, dividers |
| `--input` | `oklch(0.9 0.01 260)` | Form field borders |
| `--ring` | `oklch(0.55 0.17 255)` | Focus rings |
| `--success` | `oklch(0.6 0.18 145)` | Positive states |
| `--warning` | `oklch(0.7 0.18 85)` | Warning states |
| `--danger` | `oklch(0.58 0.22 28)` | Destructive actions |

### Dark Palette (`.dark`)

| Token | Value |
|-------|-------|
| `--background` | `oklch(0.13 0.02 260)` |
| `--foreground` | `oklch(0.93 0.01 260)` |
| `--primary` | `oklch(0.65 0.15 255)` |
| `--border` | `oklch(0.22 0.02 260)` |
| `--muted` | `oklch(0.18 0.02 260)` |

*Full dark tokens in `src/app.css`. Oklch values maintain consistent hue and chroma while adjusting lightness for dark mode.*

---

## 2. Typography

### Font Family

`Inter` (Google Fonts) — loaded via `@import` in `src/app.css`.

```css
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
```

### Type Scale (Major Third: 1.25)

| Name | Size | Line Height | Letter Spacing | Weight |
|------|------|-------------|----------------|--------|
| `text-xs` | 0.75rem | 1.33 | — | 400 |
| `text-sm` | 0.875rem | 1.43 | — | 400 |
| `text-base` | 1rem | 1.6 | — | 400 |
| `text-lg` | 1.125rem | 1.56 | — | 400 |
| `text-xl` | 1.25rem | 1.4 | — | 500 |
| `text-2xl` | 1.5rem | 1.33 | -0.01em | 600 |
| `text-3xl` | 1.875rem | 1.2 | -0.02em | 600 |
| `text-4xl` | 2.25rem | 1.11 | -0.025em | 700 |
| `text-5xl` | 3rem | 1.05 | -0.03em | 700 |

### Weights

- Regular: 400 (body text, labels)
- Medium: 500 (buttons, nav items)
- Semibold: 600 (h3–h4, subheadings)
- Bold: 700 (h1–h2, display text)

---

## 3. Spacing Grid

Base unit: `4px` (0.25rem).

| Token | Value |
|-------|-------|
| `--space-1` | 0.25rem (4px) |
| `--space-2` | 0.5rem (8px) |
| `--space-3` | 0.75rem (12px) |
| `--space-4` | 1rem (16px) |
| `--space-5` | 1.25rem (20px) |
| `--space-6` | 1.5rem (24px) |
| `--space-8` | 2rem (32px) |
| `--space-10` | 2.5rem (40px) |
| `--space-12` | 3rem (48px) |
| `--space-16` | 4rem (64px) |
| `--space-20` | 5rem (80px) |
| `--space-24` | 6rem (96px) |

### Layout Grid

- Content max-width: `1200px`
- Sidebar: `240px` expanded, `64px` collapsed
- Padding: `24px` (page), `16px` (card body)

---

## 4. Border Radius

| Token | Value |
|-------|-------|
| `--radius-xs` | calc(0.5rem - 4px) = 4px |
| `--radius-sm` | calc(0.5rem - 2px) = 6px |
| `--radius-md` | 0.5rem = 8px |
| `--radius-lg` | 0.75rem = 12px |
| `--radius-xl` | 1rem = 16px |
| `--radius-2xl` | 1.25rem = 20px |

### Usage

| Component | Radius |
|-----------|--------|
| Buttons (xs-sm) | `sm` |
| Buttons (md) | `md` |
| Buttons (lg-xl) | `lg` |
| Cards | `lg` |
| Inputs | `md` |
| Badges | `full` (pill) |
| Modals | `lg` |

---

## 5. Shadow Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-xs` | `0 0 0 1px oklch(0 0 0 / 0.02)` | `0 0 0 1px oklch(0 0 0 / 0.2)` |
| `--shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.04)` | `0 1px 2px oklch(0 0 0 / 0.3)` |
| `--shadow-md` | `0 4px 12px oklch(0 0 0 / 0.06)` | `0 4px 12px oklch(0 0 0 / 0.4)` |
| `--shadow-lg` | `0 8px 24px oklch(0 0 0 / 0.08)` | `0 8px 24px oklch(0 0 0 / 0.5)` |
| `--shadow-xl` | `0 12px 36px oklch(0 0 0 / 0.1)` | `0 12px 36px oklch(0 0 0 / 0.55)` |

---

## 6. Component Patterns

### Button

| Variant | BG | Hover | Border |
|---------|----|-------|--------|
| `primary` | primary | primary/90 | none |
| `secondary` | secondary | secondary/80 | none |
| `outline` | transparent | muted | border |
| `ghost` | transparent | muted | none |
| `destructive` | destructive | destructive/90 | none |

### Card

| Variant | BG | Border | Hover |
|---------|----|--------|-------|
| `default` | background | border | none |
| `interactive` | background | border | shadow-md + primary/30 border |

### Input

- Height: 36px (h-9)
- Border: input (light grey), danger on error
- Focus: ring with ring colour
- Placeholder: muted-foreground

### Badge

- Pill shape (rounded-full)
- Variants: default (primary tint), success (green), warning (amber), danger (red), outline
- Font: text-xs for sm, text-sm for md

### Toast

- Position: fixed top-right
- Animation: slideIn 0.25s ease-out
- Variants: success (green tint), error (red tint), warning (amber tint), info (blue tint)
- Auto-dismiss: 5 seconds
- Close button top-right

### Modal

- Overlay: black/50 with backdrop-blur-sm
- Animation: fadeIn 0.15s + slideUp 0.2s
- Sizes: sm (384px), md (448px), lg (512px), xl (672px), full (1024px)
- Close: Escape key + X button + overlay click

### DataTable

- Sortable columns with directional chevron
- Search input with Search icon
- Loading state: 5 skeleton rows
- Empty state: centred text
- Hover row on interactive tables

---

## 7. Theme Toggling

### Mechanism

1. `mode-watcher` package adds/removes `.dark` class on `<html>` element.
2. Tailwind v4 `@custom-variant dark (&:is(.dark *))` activates `dark:` variants when `.dark` is present.
3. CSS custom properties under `:root` (light) and `.dark` (dark) define all colour tokens.

### Adding a New Colour

1. Add CSS variable in `src/app.css` under both `:root` and `.dark`.
2. Add `@theme inline` entry in `src/app.css`.
3. Add TypeScript export in `src/lib/design/tokens.ts`.
4. Done. No other files need changes.

### Changing Typography

Edit the `@theme inline` block in `src/app.css`:
```css
--text-h1: 2.5rem;
--text-h1--line-height: 1.1;
--text-h1--letter-spacing: -0.03em;
```

Or swap `Inter` for another font:
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
--font-sans: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
```

---

## 8. Micro-interactions

| Element | Interaction |
|---------|-------------|
| Button hover | Brightness shift (90% of original) |
| Card interactive hover | Elevate shadow, tint border |
| Row hover | Background tint (muted/50) |
| Focus-visible | 2px solid ring, 2px offset |
| Skeleton | Shimmer animation (1.5s loop) |
| Toast enter | TranslateX(100%) → translateX(0) over 0.25s |
| Modal enter | Opacity 0→1 + translateY(16px→0) |
| Drag & drop | Vue TransitionGroup move class |
| Dark/light toggle | Instant (no transition on CSS vars) |

---

## 9. Accessibility

- All interactive elements have `focus-ring` class applying `focus-visible:ring`.
- Buttons have `aria-label` where text is not visible.
- Modals have `role="dialog"` + `aria-modal="true"`.
- DataTables use proper `<th scope="col">` semantics.
- Colour contrast ratios > 4.5:1 for body text in both modes.
- Touch targets minimum 44x44px on mobile.
