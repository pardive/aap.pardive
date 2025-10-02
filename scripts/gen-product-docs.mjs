// Auto-generates Product Docs in plain English, split into multiple files.
// Output: docs/product-docs/*
// Run locally:  OPENAI_API_KEY=... npm run docs:product
// CI: uses OPENAI_API_KEY from GitHub Secrets

import fs from "fs";
import path from "path";
import { globby } from "globby";
import OpenAI from "openai";

const ROOT = process.cwd();
const CFG_PATH = path.join(ROOT, "docs/.product-docs-config.json");
const CFG = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
const OUT = path.join(ROOT, CFG.outDir);

// ---------- Light mode caps (for low RPM) ----------
if (process.env.PRODUCT_DOCS_LIGHT === "1") {
  CFG.limits = CFG.limits || {};
  CFG.limits.maxPages = Math.min(CFG.limits.maxPages || 80, 5);
  CFG.limits.maxFrontendSamples = Math.min(CFG.limits.maxFrontendSamples || 40, 10);
  CFG.limits.maxBackendSamples  = Math.min(CFG.limits.maxBackendSamples  || 40, 8);
  CFG.limits.maxDataSamples     = Math.min(CFG.limits.maxDataSamples     || 30, 6);
  console.log("⚙️  Product Docs running in LIGHT mode caps.");
}

// ---------- OpenAI client ----------
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing.");
  process.exit(1);
}

// ---------- Utilities ----------
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readFileLimited(file, limit = 60000) {
  try {
    let buf = fs.readFileSync(file);
    if (buf.length > limit) buf = buf.subarray(0, limit);
    return buf.toString("utf8");
  } catch { return ""; }
}
const chunk = (arr) => arr.map(x => `// ${x.file}\n${x.code}`).join("\n\n");

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Retry with exponential backoff on rate limits
async function ask(prompt, { maxRetries = 5 } = {}) {
  let attempt = 0;
  const baseDelay = Number(process.env.PRODUCT_DOCS_DELAY_MS || 22000); // ~3 RPM safe

  while (true) {
    try {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are a senior technical writer. Explain codebases in very simple English for non-technical readers. No jargon, no code dumps. If unknown, say 'Not detected'." },
          { role: "user", content: prompt }
        ]
      });
      return res.choices?.[0]?.message?.content || "Generation failed.";
    } catch (err) {
      const is429 = err?.status === 429 || err?.code === "rate_limit_exceeded";
      if (is429 && attempt < maxRetries) {
        attempt++;
        const wait = Math.round(baseDelay * Math.pow(1.5, attempt - 1) + Math.random() * 1000);
        console.warn(`⏳ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      console.error("❌ OpenAI error:", err?.message || err);
      throw err;
    }
  }
}

// ---------- Collect files ----------
const limits = Object.assign({
  maxFilesTotal: 300, maxBytesPerFile: 60000,
  maxPages: 80, maxFrontendSamples: 40, maxBackendSamples: 40, maxDataSamples: 30
}, CFG.limits || {});

const allFiles = (await globby(CFG.include, { ignore: CFG.exclude, gitignore: true }))
  .slice(0, limits.maxFilesTotal);

const pageFiles = (await globby(CFG.pageGlobs || [], { ignore: CFG.exclude, gitignore: true }))
  .slice(0, limits.maxPages);

const frontend = [], backend = [], data = [];
for (const f of allFiles) {
  const code = readFileLimited(path.join(ROOT, f), limits.maxBytesPerFile);
  if (!code) continue;
  const low = f.toLowerCase();
  if (low.includes("src/app") || low.includes("components") || low.includes("src/pages")) {
    if (frontend.length < limits.maxFrontendSamples) frontend.push({ file: f, code });
  } else if (low.includes("controller") || low.includes("service") || low.includes("modules") || low.includes("apps/")) {
    if (backend.length < limits.maxBackendSamples) backend.push({ file: f, code });
  } else if (low.endsWith(".sql") || low.includes("migration") || low.includes("supabase")) {
    if (data.length < limits.maxDataSamples) data.push({ file: f, code });
  }
}

// ---------- Overview ----------
ensureDir(OUT);
const overviewPrompt = `
Project: ${CFG.projectName}

Frontend hints: ${CFG.frontendHints?.join(", ") || "N/A"}
Backend hints: ${CFG.backendHints?.join(", ") || "N/A"}
Data hints: ${CFG.dataHints?.join(", ") || "N/A"}

FRONTEND SAMPLES:
${chunk(frontend)}
BACKEND SAMPLES:
${chunk(backend)}
DATA SAMPLES:
${chunk(data)}

Write a single Markdown document with:
1) TL;DR (bullets)
2) What ${CFG.projectName} is
3) Main Features
4) How the system flows (user → frontend → backend → database)
5) Security basics
6) How to run locally
7) How we deploy (Vercel, Railway, Supabase)
8) Recently changed (plain English; if unclear, say "Not detected")
Keep ~800–1200 words, very simple English.
`;
const overview = await ask(overviewPrompt);
fs.writeFileSync(
  path.join(OUT, "index.md"),
  `# ${CFG.projectName} — Product Docs (Auto-generated)\n\n_Last updated: ${new Date().toISOString()}_\n\n${overview}\n`
);

// ---------- Pages ----------
const PAGES_DIR = path.join(OUT, "pages");
ensureDir(PAGES_DIR);

function routeFromFile(f) {
  const p = f.replace(/\\/g, "/");
  if (p.includes("/src/app/")) {
    let seg = p.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
    if (seg.endsWith("/index")) seg = seg.slice(0, -6);
    seg = seg.replace(/\/\(.*?\)\//g, "/"); // strip group segments
    seg = seg.replace(/\[[^\]]+\]/g, ":param"); // dynamic -> :param
    return "/" + seg.replace(/^\/+/, "");
  }
  if (p.includes("/src/pages/")) {
    let seg = p.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, "");
    if (seg.endsWith("/index")) seg = seg.slice(0, -6);
    seg = seg.replace(/\[[^\]]+\]/g, ":param");
    if (!seg.startsWith("/")) seg = "/" + seg;
    return seg;
  }
  return "/unknown";
}

const pageTOC = [];
for (const f of pageFiles) {
  const code = readFileLimited(path.join(ROOT, f), limits.maxBytesPerFile);
  if (!code) continue;
  const route = routeFromFile(f);
  pageTOC.push(route);

  const pagePrompt = `
Summarize this Next.js page for a non-technical reader.

ROUTE: ${route}
FILE: ${f}

CODE (truncated):
${code}

Write Markdown with:
- Title: "${route}" Page — What it does
- Brief purpose in plain English
- Key elements a user sees
- Inputs/forms and what happens on submit
- Where data likely comes from/goes to
- "How to test this page" checklist (3–6 bullets)
~200–350 words.
`;
  const md = await ask(pagePrompt);
  const destDir = path.join(PAGES_DIR, route === "/" ? "_root" : route);
  ensureDir(destDir);
  fs.writeFileSync(
    path.join(destDir, "index.md"),
    `# ${route} Page (Auto-generated)\n\n_Last updated: ${new Date().toISOString()}_\n\n${md}\n`
  );
}

fs.writeFileSync(
  path.join(PAGES_DIR, "index.md"),
  `# Pages — Table of Contents (Auto-generated)\n\n_Last updated: ${new Date().toISOString()}_\n\n${pageTOC.sort().map(r => `- [${r}](.${r === "/" ? "/_root" : r}/index.md)`).join("\n")}\n`
);

// ---------- Code docs ----------
const CODE_DIR = path.join(OUT, "code");
ensureDir(CODE_DIR);

async function summarizeSet(title, arr, hint) {
  const prompt = `
Summarize these files for non-technical readers.
Focus: what they do, why they exist, how they connect.

HINT: ${hint}

FILES (truncated):
${chunk(arr)}

Write Markdown:
- H1: ${title}
- Intro paragraph
- Bulleted responsibilities & flows
- Where this is used
- Risks & gotchas (2–5 bullets)
- How to test (3–6 bullets)
Length: 300–600 words.
`;
  return ask(prompt);
}

const frontendMd = await summarizeSet(
  "Frontend (UI & Components) — Overview (Auto-generated)",
  frontend,
  (CFG.frontendHints || []).join(", ")
);
fs.writeFileSync(path.join(CODE_DIR, "frontend.md"), `# Frontend (UI & Components)\n\n_Last updated: ${new Date().toISOString()}_\n\n${frontendMd}\n`);

const backendMd = await summarizeSet(
  "Backend (APIs & Logic) — Overview (Auto-generated)",
  backend,
  (CFG.backendHints || []).join(", ")
);
fs.writeFileSync(path.join(CODE_DIR, "backend.md"), `# Backend (APIs & Logic)\n\n_Last updated: ${new Date().toISOString()}_\n\n${backendMd}\n`);

const dataMd = await summarizeSet(
  "Data Model (Supabase/Postgres) — Overview (Auto-generated)",
  data,
  (CFG.dataHints || []).join(", ")
);
fs.writeFileSync(path.join(CODE_DIR, "data-model.md"), `# Data Model (Supabase/Postgres)\n\n_Last updated: ${new Date().toISOString()}_\n\n${dataMd}\n`);

console.log(`✅ Product Docs generated in ${OUT}`);
