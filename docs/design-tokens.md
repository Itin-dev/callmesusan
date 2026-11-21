# Design tokens

Source of truth: Figma [Design-Project](https://www.figma.com/design/oOu7PPG4eIaWZPFVOELCCI/Design-Project?node-id=0-1),
variable collection **Psst tokens** (one mode, light only). Code: [`apps/web/src/index.css`](../apps/web/src/index.css).

Rule: use the Tailwind classes below. No raw hex values and no `text-[13px]` in components.
If Figma changes, update the `--psst-*` raw tokens in `index.css` and this table.

## Colours

| Figma variable | Hex | shadcn / Tailwind class | Used for |
|----------------|-----|-------------------------|----------|
| `color/bg` | `#e6f0f0` | `bg-background` | App background (mint grey) |
| `color/surface` | `#ffffff` | `bg-card`, `bg-popover`, `bg-secondary` | Cards, sheets, outlined pills |
| `color/surface-muted` | `#f2f7f7` | `bg-muted`, `bg-accent` | Receipt badge, hover, active tab pill |
| `color/text` | `#0b3c49` | `text-foreground` | Main text (dark petrol) |
| `color/text-muted` | `#5b7a82` | `text-muted-foreground` | Secondary text |
| `color/accent` | `#ffcc00` | `bg-primary` + `text-primary-foreground` | Yellow CTAs, highlights |
| `color/psst` | `#0b3c49` | `bg-psst`, `ring` | Psst card, Psst chat bubble, Psst button |
| `color/on-psst` | `#ffffff` | `text-psst-foreground` | Text on Psst surfaces |
| `color/income` | `#0097b2` | `text-income`, `chart-1` | Income amounts and chart |
| `color/expense` | `#0b4f5c` | `text-expense`, `chart-3` | Expense amounts and chart |
| `color/negative` | `#c0392b` | `text-negative`, `destructive` | Negative balance, errors |
| `color/border` | `#d5e3e4` | `border-border`, `border-input` | Card and input borders |
| `color/camera` | `#0e1416` | `bg-camera` + `text-camera-foreground` | Scan screens |
| `color/paper-line` | `#c7cccf` | `bg-paper-line` | Receipt skeleton lines |

## Typography

Font: **Figtree** (`@fontsource-variable/figtree`). Figma has no text styles, so the scale comes from the text layers.

| Class | Size / weight | Used for |
|-------|---------------|----------|
| `text-display` | 28 / 700 | Big amounts (`CHF 47.80`) |
| `text-title` | 20 / 600 | Screen titles (`Home`, `Analytics`) |
| `text-heading` | 16 / 600 | Card headings, account names |
| `text-body` | 15 / 400 | Body text, buttons (add `font-semibold` for buttons) |
| `text-small` | 13 / 400 | Secondary text, chips, chat |
| `text-caption` | 11 / 400 | Tab labels, IBAN, meta |

Tailwind defaults (`text-xs` 12, `text-sm` 14, `text-lg` 18) also match Figma sizes.

## Radius

`--radius` = 16 px (cards). `rounded-sm` 8 · `rounded-md` 12 · `rounded-lg` 16 · `rounded-xl` 20 ·
`rounded-2xl` 24 · `rounded-3xl` 28 · `rounded-4xl` 38 (phone sheet). Buttons, chips and tab pills: `rounded-full`.

## Accessibility notes

- `text-muted-foreground` on `bg-background` is about 3.9:1, which is below WCAG AA for small text.
  Use muted text on white cards (about 4.6:1), or `text-foreground` on the mint background.
- `text-income` on white is about 3.5:1. Use it for large amounts (18 px+ or 14 px bold), chart fills and icons, not small body text.
- Yellow (`primary`) always needs `text-primary-foreground` (petrol), never white text.
