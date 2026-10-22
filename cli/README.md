# amnt-ui

Add **AMNT UI (Ink)**, a free design system, to a Next.js + Tailwind project.

```bash
npx amnt-ui add
```

## What it does

1. Copies the parts into `src/ui` (or `ui` if you have no `src` folder).
2. Wires Tailwind 3.3+ or 4: the Ink preset in `tailwind.config`, three imports in `globals.css`.
3. Installs the 4 small packages the parts need.

Your own changed files are kept. Run it again any time to update.

## Commands

| Command | Does |
| --- | --- |
| `npx amnt-ui add` | the whole kit |
| `npx amnt-ui add button date-picker` | some parts, plus the files they need |
| `npx amnt-ui list` | every part |

Options: `--overwrite` (replace files you changed), `--no-install` (skip packages), `--from <file or URL>`.

## Then

```tsx
import { Button } from "@/ui";
import { Rocket } from "@/ui/symbols";
```

## Safe to run

- **No dependencies.** One readable file: [amnt.mjs](https://github.com/amntio/amnt-ui/blob/main/cli/amnt.mjs).
- It only writes inside your project, and never deletes a file.
- The parts come from [github.com/amntio/amnt-ui](https://github.com/amntio/amnt-ui) (`public/r/ink.json`).

MIT · AMNT.IO LTD
