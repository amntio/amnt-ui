---
name: amnt-ui
description: Build or change any UI with the AMNT UI (Ink) design system for Next.js + Tailwind. Use when the user asks for a page, form, table, chart, date picker, upload, menu, popup, dashboard, settings page or app shell, or mentions AMNT UI, Ink or @/ui.
---

# AMNT UI (Ink)

## 1. Is it installed?
Look for `src/ui/index.ts`. If it's missing, install it:

```bash
npx amnt add
```

It copies the parts, wires `tailwind.config` and `globals.css` (Tailwind 3.3+ or 4) and installs the packages. If it prints "Still to do by hand", do those steps. Only some parts: `npx amnt add button date-picker`; all names: `npx amnt list`.

## 2. Build with the parts
- Everything comes from `@/ui`; icons come from `@/ui/symbols` and are drawn with `<Icon icon={X} />`.
- To pick the right part, read the "Picking a part" table in https://github.com/amntio/amnt-ui/blob/main/AGENTS.md
- Short version:
  - **Dates:** DatePicker or DateRangePicker
  - **Tags:** MultiSelect
  - **Long list:** Combobox
  - **Rows:** DataTable
  - **Numbers:** Metric and the charts
  - **Popups:** Sheet, Menu, CommandMenu
  - **Signed-in frame:** SidebarShell

## 3. Rules (non-negotiable)
- Colours are roles (`bg-surface-container`, `text-on-surface`, `bg-primary text-on-primary`), never hex, `rgb()` or Tailwind palette colours.
- Type: `text-{display|headline|title|body|label}-{sm|md|lg}`. Shapes: `rounded-{small|medium|large|full}`.
- Phone first. Unprefixed classes mean phone; then `medium:`, `expanded:`, `large:`.
- Every field and icon button has a `label`. Everything works with the keyboard.
- Never add a second component library or icon set.

## 4. Before you finish
- Check the page at 360 px and on desktop, in light and dark.
- Make sure the console has no errors.
