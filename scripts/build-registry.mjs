/**
 * Build public/r/ink.json: every part of the kit in one file. `npx amnt-ui add`
 * (cli/amnt.mjs) reads it from GitHub. It is plain JSON (name, files with
 * path + content, dependencies) in the common "registry item" shape, so other
 * tools that take a component URL can read it too.
 *
 *   node scripts/build-registry.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
});

const files = walk("ui")
    .filter((p) => /\.(tsx?|css|json)$/.test(p))
    .sort()
    .map((path) => ({ path, type: "registry:file", target: `src/${path}`, content: readFileSync(path, "utf8") }));
files.push({ path: "tailwind.preset.ts", type: "registry:file", target: "tailwind.preset.ts", content: readFileSync("tailwind.preset.ts", "utf8") });

const item = {
    name: "ink",
    type: "registry:block",
    title: "AMNT UI (Ink)",
    description: "The whole Ink design system: 50+ components, tokens, 339 icons, app shells. Next.js + Tailwind 3.3+ or 4.",
    dependencies: ["clsx@2.1.1", "tailwind-merge@1.14.0"],
    devDependencies: ["tailwindcss-animate@1.0.7", "@tailwindcss/typography@0.5.20"],
    docs: "Easiest: npx amnt-ui add (wires Tailwind and globals.css for you). By hand: npm i -D tailwindcss-animate @tailwindcss/typography. Tailwind 4: make tailwind.config.ts with `presets: [ink]` (import ink from './src/tailwind.preset') and content ['./src/**/*.{ts,tsx}'], then at the top of globals.css: @import '../ui/tokens/tokens.css'; @import '../ui/tokens/legacy.css'; @import '../ui/ui.css'; @import 'tailwindcss'; @config '../../tailwind.config.ts'. Tailwind 3: add the preset and the three @imports. Full steps: github.com/amntio/amnt-ui#install",
    files,
};
writeFileSync("public/r/ink.json", JSON.stringify(item) + "\n");
writeFileSync(
    "public/r/registry.json",
    JSON.stringify({ name: "amnt-ui", homepage: "https://github.com/amntio/amnt-ui", items: [{ name: item.name, type: item.type, title: item.title, description: item.description }] }, null, 2) + "\n",
);
console.log(`✅ public/r/ink.json: ${files.length} files, ${(JSON.stringify(item).length / 1024).toFixed(0)} KB`);
