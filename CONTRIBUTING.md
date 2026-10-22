# Contributing to AMNT UI

Thanks for helping. Small, focused pull requests get merged fastest.

## 🐛 Found a bug?

[Open a bug report](https://github.com/amntio/amnt-ui/issues/new?template=bug_report.yml). Include:
- the part (for example `DatePicker`)
- what you did, what you expected, what happened
- Next.js and Tailwind versions, light or dark, phone or desktop

## 💡 Want a new part?

[Open a part request](https://github.com/amntio/amnt-ui/issues/new?template=feature_request.yml) first, so we can agree on the shape before you build it.

## 🛠️ Making a change

1. Fork the repo and make a branch: `git checkout -b fix/date-picker-focus`
2. Read [AGENTS.md](AGENTS.md). Every part follows those rules.
3. Make the change in `ui/`.
4. Rebuild the parts file: `npm run registry`
5. If you touched the CLI: `node cli/test.mjs`
6. Open a pull request and fill in the checklist.

## ✅ A part is done when

- it works with the **keyboard** only
- every control has a **name** for screen readers
- touch targets are **48 px**
- it uses **colour roles** (`bg-surface`, `text-on-surface`), never fixed colours
- it looks right at **360 px** wide, in **light and dark**
- it imports nothing new: no second component or icon library

## 📝 Commit messages

Short and plain, saying what changed for the user:
- ✅ `DatePicker: keep focus on the chosen day after closing`
- ❌ `fix stuff`

## 📜 Licence

By contributing, you agree your work is released under the [MIT licence](LICENSE).

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).
