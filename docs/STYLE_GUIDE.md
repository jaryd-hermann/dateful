# Dateful Style Guide

A single source of truth for spacing, colors, and typography. Use these tokens consistently to avoid squished or inconsistent layouts.

## Spacing Scale

Use CSS variables from `src/index.css`. **Never use arbitrary spacing values**—always reference the scale.

| Token | Value | Use case |
|-------|-------|----------|
| `--spacing-xs` | 0.5rem (8px) | Tight spacing within grouped elements (e.g. label + value) |
| `--spacing-sm` | 0.75rem (12px) | Between related items (e.g. progress label + bar) |
| `--spacing-md` | 1rem (16px) | Standard gap, form field internal padding |
| `--spacing-lg` | 1.5rem (24px) | Between form fields, between list items |
| `--spacing-xl` | 2rem (32px) | Between sections, padding above/below blocks |
| `--spacing-2xl` | 2.5rem (40px) | Section breaks (header → content, history → current question) |
| `--spacing-3xl` | 3rem (48px) | Major page sections, page padding |

### Guidelines

- **Question label → input**: Use `--spacing-xl` (2rem)
- **History item → next history item**: Use `--spacing-lg` (1.5rem)
- **Progress bar → content below**: Use `--spacing-xl` padding below the bar
- **History block → current question**: Use `--spacing-2xl` above the question
- **Between sections** (header, progress, history, current, footer): Use `--spacing-2xl` or `--spacing-xl`

## Colors

- `--color-bg`: Page background
- `--color-text-primary`: Primary text
- `--color-text-secondary`: Muted text, labels
- `--color-accent`: CTAs, focus states, highlights
- `--color-accent-hover`: Hover state for accent elements

## Typography

- `--font-display`: Playfair Display (headings)
- `--font-body`: DM Sans (body text)

## Usage in CSS

```css
.my-element {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
}
```

## Usage in JSX (inline)

```jsx
<div style={{ marginBottom: 'var(--spacing-xl)' }}>
```
