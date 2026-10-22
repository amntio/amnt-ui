#!/usr/bin/env node
/**
 * amnt: add AMNT UI (Ink) to a Next.js + Tailwind project.
 *
 *   npx amnt-ui add            the whole kit
 *   npx amnt-ui add button     one part, plus the files it needs
 *   npx amnt-ui list           every part you can add
 *
 * No dependencies. It reads one file (public/r/ink.json in the amnt-ui repo),
 * copies parts into <src>/ui, wires Tailwind 3 or 4 and globals.css, and
 * installs the 4 small packages the parts need.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { spawnSync } from "node:child_process";

const REGISTRY = "https://raw.githubusercontent.com/amntio/amnt-ui/main/public/r/ink.json";
const ALWAYS = ["tailwind.preset.ts", "ui/cn.ts", "ui/dom.d.ts", "ui/tokens/tokens.css", "ui/tokens/legacy.css", "ui/ui.css"];
const CSS = ["tokens/tokens.css", "tokens/legacy.css", "ui.css"];

const HELP = `AMNT UI (Ink): free design system for Next.js + Tailwind.

  npx amnt-ui add              add the whole kit
  npx amnt-ui add button table add some parts (and the files they need)
  npx amnt-ui list             show every part

Options
  --overwrite    replace files you changed (default: keep yours)
  --no-install   don't install packages
  --from <file>  read parts from this file or URL instead of GitHub

Docs: https://github.com/amntio/amnt-ui`;

const say = (s = "") => console.log(s);
const fail = (s) => { console.error(`✗ ${s}`); process.exit(1); };
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// ── args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i < 0 ? null : argv.splice(i, 2)[1]; };
const from = opt("--from") ?? process.env.AMNT_REGISTRY ?? REGISTRY;
const overwrite = argv.includes("--overwrite");
const install = !argv.includes("--no-install");
const [cmd, ...wanted] = argv.filter((a) => !a.startsWith("-"));

if (!cmd || argv.includes("--help") || argv.includes("-h") || !["add", "list"].includes(cmd)) {
    say(HELP);
    process.exit(cmd && !["add", "list"].includes(cmd) ? 1 : 0);
}

// ── the parts file ──────────────────────────────────────────────────────
async function load() {
    let text;
    try {
        if (/^https?:/.test(from)) {
            const res = await fetch(from);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            text = await res.text();
        } else text = readFileSync(from, "utf8");
    } catch (e) {
        fail(`Could not read the parts from ${from} (${e.message}). Check your connection and try again.`);
    }
    const item = JSON.parse(text);
    return { item, files: Object.fromEntries(item.files.map((f) => [f.path, f.content])) };
}

/** Each `export … from "./x"` in ui/index.ts: its names, its file, its exact text. */
function exportsOf(files) {
    const out = [];
    for (const m of files["ui/index.ts"].matchAll(/export\s+(?:\*\s+as\s+(\w+)|\{([^}]*)\})\s+from\s+"([^"]+)";\n?/g)) {
        const names = (m[1] ?? m[2]).split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("type "));
        out.push({ names, file: resolve(files, "ui", m[3]), text: m[0] });
    }
    return out;
}

/** "./primitives/Button" seen from `fromDir` → "ui/primitives/Button.tsx", or null. */
function resolve(files, fromDir, spec) {
    const p = spec.startsWith("@/ui") ? spec.slice(2) : posix.join(fromDir, spec);
    return [p, `${p}.ts`, `${p}.tsx`, `${p}/index.ts`, `${p}/index.tsx`].find((c) => c in files) ?? null;
}

/** The files `key` needs, all the way down. */
function closure(files, keys) {
    const seen = new Set();
    const visit = (key) => {
        if (seen.has(key) || key === "ui/index.ts") return;
        seen.add(key);
        for (const m of files[key].matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
            if (!/^(\.|@\/ui)/.test(m[1])) continue;
            const dep = resolve(files, posix.dirname(key), m[1]);
            if (dep) visit(dep);
        }
    };
    keys.forEach(visit);
    return seen;
}

// ── list ────────────────────────────────────────────────────────────────
const { item, files } = await load();
const exported = exportsOf(files).filter((e) => e.file);
const isPart = (n) => /^[A-Z][a-z]/.test(n);
const parts = exported.filter((e) => e.names.some(isPart));
/** "ui/primitives/Button.tsx" → "Button", "ui/layouts/index.tsx" → "layouts". */
const label = (file) => { const b = posix.basename(file).replace(/\.tsx?$/, ""); return b === "index" ? posix.basename(posix.dirname(file)) : b; };

if (cmd === "list") {
    say("Parts you can add (any name on the line works):\n");
    for (const e of parts) say(`  ${label(e.file).padEnd(18)} ${e.names.filter(isPart).join(", ")}`);
    say("\n  npx amnt-ui add DatePicker DataTable");
    process.exit(0);
}

// ── the project ─────────────────────────────────────────────────────────
const pkg = JSON.parse(read("package.json") ?? fail("No package.json here. Run this in your project folder."));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const twVersion = (() => {
    const installed = read("node_modules/tailwindcss/package.json");
    const v = installed ? JSON.parse(installed).version : deps.tailwindcss?.replace(/^[^\d]*/, "");
    return v ? Number(v.split(".")[0]) : null;
})();
if (!twVersion) fail("Tailwind CSS isn't installed. Ink needs Tailwind 3.3+ or 4.\n  New app: npx create-next-app@latest --tailwind");

// Where `@/` points (Next.js: "./src/*" or "./*"): the kit goes in <base>/ui.
const tsconfig = read("tsconfig.json") ?? read("jsconfig.json") ?? "";
const alias = tsconfig.match(/"@\/\*"\s*:\s*\[\s*"\.\/([^"*]*)\*"/);
const base = alias ? alias[1].replace(/\/$/, "") || "." : existsSync("src") ? "src" : ".";
const at = (key) => posix.join(base, key);

// ── pick the files ──────────────────────────────────────────────────────
const all = wanted.length === 0 || wanted.some((w) => ["all", "ink"].includes(norm(w)));
let pick;
if (all) pick = new Set(Object.keys(files));
else {
    const byName = new Map();
    for (const e of exported) {
        byName.set(norm(label(e.file)), e.file);
        for (const n of e.names) byName.set(norm(n), e.file);
    }
    const unknown = wanted.filter((w) => !byName.has(norm(w)));
    if (unknown.length) fail(`No part called ${unknown.join(", ")}. See them all: npx amnt-ui list`);
    pick = closure(files, [...wanted.map((w) => byName.get(norm(w))), ...ALWAYS]);
    pick.delete("ui/index.ts");
}

// ── write ───────────────────────────────────────────────────────────────
/** `@/ui/x` → a relative path, so the parts work without the `@/` alias. */
const relImports = (key, text) =>
    text.replace(/(["'])@\/ui(\/[^"']*)?\1/g, (_, q, sub = "") => {
        const r = posix.relative(posix.dirname(key), `ui${sub}`) || ".";
        return q + (r.startsWith(".") ? r : `./${r}`) + q;
    });

const done = { added: [], same: [], kept: [] };
const put = (path, text, force = false) => {
    const old = read(path);
    if (old === text) return done.same.push(path);
    if (old !== null && !overwrite && !force) return done.kept.push(path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    done.added.push(path);
};

for (const key of pick) if (key !== "ui/index.ts") put(at(key), relImports(key, files[key]));

// ui/index.ts exports only the parts that are on disk, so `@/ui` always builds.
let index = files["ui/index.ts"];
for (const e of exportsOf(files)) if (!e.file || !existsSync(at(e.file))) index = index.replace(e.text, "");
put(at("ui/index.ts"), index.replace(/\n{3,}/g, "\n\n"), true);

say(`✓ ${done.added.length} files written to ${at("ui")}${done.same.length ? `, ${done.same.length} already up to date` : ""}`);
if (done.kept.length) say(`• Kept ${done.kept.length} files you changed (use --overwrite to replace): ${done.kept.slice(0, 4).join(", ")}${done.kept.length > 4 ? " …" : ""}`);

// ── Tailwind config ─────────────────────────────────────────────────────
const todo = [];
const presetPath = `./${at("tailwind.preset")}`;
const configFile = ["ts", "mts", "js", "mjs", "cjs"].map((x) => `tailwind.config.${x}`).find(existsSync);
const uiGlob = `./${at("ui")}/**/*.{ts,tsx}`;
// .mts on Tailwind 4: Node then loads it as a module without a warning.
const madeConfig = twVersion >= 4 ? "tailwind.config.mts" : "tailwind.config.ts";

if (!configFile) {
    const content = base === "." ? ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx}", uiGlob] : [`./${base}/**/*.{ts,tsx,mdx}`];
    writeFileSync(madeConfig, `import ink from "${presetPath}";\n\nexport default {\n  presets: [ink],\n  content: ${JSON.stringify(content)},\n};\n`);
    say(`✓ Made ${madeConfig} with the Ink preset`);
} else {
    let cfg = read(configFile);
    const esm = /^\s*(import|export)\s/m.test(cfg);
    const content = cfg.match(/^([ \t]*)(content\s*:\s*\[)(\s*\n([ \t]*))?/m);
    if (cfg.includes("tailwind.preset")) say(`✓ ${configFile} already has the Ink preset`);
    else if (esm && content && !/\bpresets\s*:/.test(cfg)) {
        const [whole, pad, open, multi, inner] = content;
        cfg = cfg.replace(whole, `${pad}presets: [ink],\n${pad}${open}${multi ? `\n${inner}"${uiGlob}",\n${inner}` : `"${uiGlob}", `}`);
        writeFileSync(configFile, `import ink from "${presetPath}";\n${cfg}`);
        say(`✓ Added the Ink preset to ${configFile}`);
    } else todo.push(`In ${configFile}: import ink from "${presetPath}", add \`presets: [ink]\`, and add "${uiGlob}" to content.`);
}

// ── globals.css ─────────────────────────────────────────────────────────
const cssFile = [...new Set([at("app/globals.css"), "app/globals.css", at("styles/globals.css"), "styles/globals.css"])].find(existsSync);
const cssTo = (dir) => { const r = posix.relative(dir, at("ui")); return r.startsWith(".") ? r : `./${r}`; };
const BODY = `\n/* AMNT UI: the page takes Ink's colours and font (dark mode = class="dark" on <html>). */
body {
  background: rgb(var(--md-sys-color-surface-rgb));
  color: rgb(var(--md-sys-color-on-surface-rgb));
  font-family: var(--md-sys-typescale-font);
}\n`;

if (!cssFile) todo.push(`At the top of your global CSS file: ${CSS.map((c) => `@import "<path to ${at("ui")}>/${c}";`).join(" ")}${twVersion >= 4 ? ` Then, after @import "tailwindcss": @config "<path to ${configFile ?? madeConfig}>";` : ""}`);
else {
    let css = read(cssFile);
    if (css.includes("tokens/tokens.css")) say(`✓ ${cssFile} already imports Ink`);
    else {
        const lines = CSS.map((c) => `@import "${cssTo(posix.dirname(cssFile))}/${c}";`).join("\n");
        css = `${lines}\n${css}`;
        if (twVersion >= 4 && !/@config\s/.test(css)) {
            const cfgRel = posix.relative(posix.dirname(cssFile), configFile ?? madeConfig);
            const tw = css.match(/^@import\s+["']tailwindcss["'];?[ \t]*$/m);
            const line = `@config "${cfgRel}";`;
            css = tw ? css.replace(tw[0], `${tw[0]}\n${line}`) : `${css}\n${line}\n`;
        }
        writeFileSync(cssFile, css + BODY);
        say(`✓ Wired ${cssFile} (Tailwind ${twVersion})`);
    }
}

// ── packages ────────────────────────────────────────────────────────────
const missing = (list = []) => list.filter((d) => !deps[d.replace(/(.)@.*$/, "$1")]);
const need = missing(item.dependencies), needDev = missing(item.devDependencies);
if (need.length || needDev.length) {
    const pm = existsSync("pnpm-lock.yaml") ? "pnpm" : existsSync("yarn.lock") ? "yarn" : existsSync("bun.lock") || existsSync("bun.lockb") ? "bun" : "npm";
    const add = pm === "npm" ? "install" : "add";
    const dev = pm === "bun" ? "-d" : "-D";
    const runs = [need.length && [add, ...need], needDev.length && [add, dev, ...needDev]].filter(Boolean);
    for (const args of runs) {
        const line = `${pm} ${args.join(" ")}`;
        if (!install) { todo.push(`Install: ${line}`); continue; }
        say(`… ${line}`);
        const r = spawnSync(pm, args, { stdio: "inherit", shell: process.platform === "win32" });
        if (r.status !== 0) process.exitCode = 1, todo.push(`This install failed, run it yourself: ${line}`);
    }
}

// ── what's next ─────────────────────────────────────────────────────────
if (todo.length) {
    say("\nStill to do by hand:");
    todo.forEach((t, i) => say(`  ${i + 1}. ${t}`));
}
say(`
Use it:
  import { Button } from "@/ui";
  import { Rocket } from "@/ui/symbols";

Optional font (Martian Mono), in app/layout.tsx:
  import { Martian_Mono } from "next/font/google";
  const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-brand" });
  <html className={mono.variable}>`);
