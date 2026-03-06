# Quiz IA — Interface Design System

## Direction & Feel
Learning app for serious study sessions. Dense, focused, no decoration. Dark-first but with a clean light mode.
**Palette origin**: Deep-night sky (dark) / morning notebook paper (light).

## Theme Architecture
Three-mode toggle: `system` (OS default) | `light` | `dark`.
- **Source of truth**: `index.css` — edit CSS variables here to retheme the entire app.
- **Store**: `store/themeStore.ts` — Zustand persisted to `localStorage` key `quiz-ia-theme`.
- **Hook**: `hooks/useTheme.ts` — call once in `App.tsx` to sync class on `<html>`.
- **Component**: `components/ThemeToggle.tsx` — 3-button pill (Sun / Monitor / Moon).
- **Anti-flash**: inline `<script>` in `<head>` applies `html.dark` before React mounts.

## Color Tokens (index.css)
All semantic colors are CSS custom properties. Tailwind slate-* classes are overridden
via `!important` rules in `index.css` to map to these variables.

| Token            | Light          | Dark           | Use                        |
|------------------|----------------|----------------|----------------------------|
| `--bg-primary`   | `#F8FAFC`      | `#0A0F1F`      | Page background            |
| `--bg-elevated`  | `#F1F5F9`      | `#253347`      | Inputs, chips, hover states|
| `--bg-surface`   | `#FFFFFF`      | `#1E293B`      | Cards, modals, panels      |
| `--border`       | `#E2E8F0`      | `#334155`      | Standard borders           |
| `--border-soft`  | `#F1F5F9`      | `#1E293B`      | Section dividers           |
| `--ink-1`        | `#0F172A`      | `#E2E8F0`      | Primary text               |
| `--ink-2`        | `#1E293B`      | `#CBD5E1`      | Medium emphasis            |
| `--ink-3`        | `#475569`      | `#94A3B8`      | Labels, descriptions       |
| `--ink-4`        | `#64748B`      | `#64748B`      | Metadata, counts           |
| `--ink-muted`    | `#94A3B8`      | `#475569`      | Disabled, placeholder      |
| `--action`       | `#F59E0B`      | `#F59E0B`      | Primary CTA (amber, same)  |
| `--action-hover` | `#D97706`      | `#D97706`      | Hover/pressed action       |
| `--action-text`  | `#0F172A`      | `#0A0F1F`      | Text on action background  |
| `--success`      | `#10B981`      | `#10B981`      | Correct, completion        |
| `--error`        | `#EF4444`      | `#EF4444`      | Incorrect, destructive     |
| `--info`         | `#3B82F6`      | `#3B82F6`      | Info, neutral links        |

## Depth Strategy
Borders-only. No dramatic shadows. Subtle `border-slate-800` (→ `--border`) separates surfaces.
Modals use `shadow-2xl` but no colored shadows.

## Spacing
Base unit: 4px (Tailwind default). Scale used: 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12.

## Typography
No custom typeface — system font stack via Tailwind.
- Headings: `font-black` or `font-bold`, tight tracking.
- Body: `text-slate-200` (→ `--ink-1`).
- Labels/meta: `text-slate-400` (→ `--ink-3`), `text-xs uppercase tracking-widest`.

## Primary Color (Tailwind config)
`primary: { DEFAULT: "#F59E0B", foreground: "#0F172A" }` — amber.
All `bg-primary`, `text-primary`, `border-primary` classes use amber in both themes.

## ThemeToggle Placement
- **Home / Browse**: header of `QuizBrowserMain` (top-right of h2 row).
- **Quiz creation form**: inline with "Volver al historial" button row.
- **Refinement stage**: `absolute top-4 right-4` in full-screen container.
- **Results stage**: `absolute top-4 right-4` in full-screen container.
- **Active quiz**: inside the quiz header's right-side buttons group.
