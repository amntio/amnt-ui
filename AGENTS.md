# AGENTS.md: building with AMNT UI (Ink)

For any coding agent: Claude Code, Cursor, Codex, Copilot, v0.

## 🎯 In one line

Import every UI part from `@/ui`. Write colours as roles, never values. Phone first.

## 🚀 Install into a project

```bash
npx amnt-ui add
```

It copies the parts into `src/ui`, adds the Ink preset to `tailwind.config`, imports the 3 CSS files in `globals.css` (Tailwind 3.3+ or 4) and installs the packages. If it prints "Still to do by hand", do those steps.

- Some parts only: `npx amnt-ui add button date-picker` (brings the files they need).
- Every part name: `npx amnt-ui list`.

## 🔴 Rules

1. **One source of UI.** `import { Button, DataTable } from "@/ui"`. Never add a second component library (Radix, MUI, Chakra) or a second icon set (lucide) next to it.
2. **Colours are roles.** Use `bg-surface`, `bg-surface-container`, `text-on-surface`, `text-on-surface-variant`, `bg-primary text-on-primary`, `bg-inverse-surface`, `text-error`. Never `#hex`, `rgb()`, `text-gray-500`.
3. **Type is a scale.** Use `text-display-*`, `text-headline-*`, `text-title-*`, `text-body-*`, `text-label-*` (sizes `sm`, `md`, `lg`). Never `text-[13px]`.
4. **Shapes are named.** Use `rounded-small`, `rounded-medium`, `rounded-large`, `rounded-full`. Ink draws them square on purpose.
5. **Icons:** `import { Rocket } from "@/ui/symbols"`, then `<Icon icon={Rocket} />`. To add one, put it in `scripts/icon-map.json` and run `node scripts/icons-build.mjs`.
6. **Breakpoints are window classes:** `medium:` (600), `expanded:` (840), `large:` (1200), `xlarge:` (1600). Unprefixed = phone.
7. **Every control is reachable by keyboard and has a name.** An IconButton always gets `label`; fields always get `label`.
8. **Touch targets are 48 px.** The parts already do this; don't shrink them.
9. **Separate with fill, not lines.** A card is told apart by `bg-surface-container`, not a border.
10. **Missing a part?** Build it in `ui/components/` from the existing parts, export it from `ui/index.ts`, and keep the rules above.

## 🧱 Picking a part

| Need | Use |
| --- | --- |
| The one main action | `<Button>` (filled). Others: `variant="tonal" \| "outlined" \| "text"` |
| A form field | `TextField`, `Textarea`, `Select`, `Search`, `Checkbox`, `Switch`, `RadioGroup` + `Radio`, `Slider`, `SegmentedButton` |
| A date | `DatePicker`, `DateRangePicker`, `Calendar` (values are `"YYYY-MM-DD"` strings) |
| Many of a list | `MultiSelect` (`creatable` for tags) |
| One of a long list | `Combobox` |
| A code | `CodeInput` |
| Files | `FileUpload` + `sendFile(url, file, progress)` |
| Rows of data | `DataTable` (local or `server` mode) |
| A number that matters | `Metric`, `Sparkline` |
| A chart | `LineChart`, `BarChart`, `DonutChart` |
| A list of things | `List` + `ListItem` |
| More actions | `Menu` + `MenuItem` (with `IconButton icon={MoreVertical}`) |
| A form in a popup | `Sheet` (bottom on phones, centred on desktop) |
| "Are you sure?" | `const [ui, confirm] = useConfirm()` |
| Something happened | `toast({ title, tone })`; mount `<Toaster />` once |
| A lasting problem | `Alert` |
| Nothing here yet | `EmptyState` with an `action` |
| Find anything | `CommandMenu` + `useCommandHotkey` |
| The signed-in frame | `SidebarShell` or `TopbarShell` |
| Page title + actions | `PageHeader` |
| Settings | `SettingsGroup`, `SettingRow`, `ActionRow` |

## ✅ Done means

- Seen at 360 px and on desktop, light and dark.
- Usable with the keyboard alone.
- No console errors.
- No new dependency for something a part already does.
