#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const PKG = 'zspec';

function die(msg, code = 1) {
  console.error(`\n${PKG}: ${msg}`);
  process.exit(code);
}

function usage() {
  console.log(`\n${PKG} v0.1.0\n\nUsage:\n  ${PKG} init [--force]\n  ${PKG} new <feature-name>\n  ${PKG} use <skill-name>\n  ${PKG} status\n  ${PKG} mcp\n\nWhat it does:\n  - init: scaffold repo conventions (AGENTS.md, specs/, gsd/, mcp/serena.json, scripts, skills)\n  - new: create specs/NNNN-slug/ + git branch + auto-commit, print a Copilot-ready prompt\n  - use: print a skill activation prompt (e.g., frontend-design)\n  - status: summarize specs and recent log entries (one dir per feature, branch-based lifecycle)\n  - mcp: print Serena MCP client snippets and run commands\n`);
}

function repoRoot() {
  return process.cwd();
}

function templateRoot() {
  return path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'templates');
}

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeText(p, content, force = false) {
  if (exists(p) && !force) return false;
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
  return true;
}

function copyDir(srcDir, dstDir, force = false) {
  ensureDir(dstDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dst, force);
    } else {
      const content = fs.readFileSync(src);
      if (exists(dst) && !force) continue;
      ensureDir(path.dirname(dst));
      fs.writeFileSync(dst, content);
    }
  }
}

function nextSpecNumber(specsDir) {
  if (!exists(specsDir)) return '0001';
  const dirs = fs.readdirSync(specsDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d{4}-/.test(e.name))
    .map(e => Number(e.name.slice(0, 4)))
    .filter(n => !Number.isNaN(n));
  const max = dirs.length ? Math.max(...dirs) : 0;
  return String(max + 1).padStart(4, '0');
}

function slugify(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'feature';
}

function safeSh(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim(); }
  catch { return null; }
}

function cmd_init(args) {
  const force = args.includes('--force');
  const root = repoRoot();
  const tpl = templateRoot();

  copyDir(tpl, root, force);

  // If package.json exists, add scripts (non-destructive unless --force)
  const pkgPath = path.join(root, 'package.json');
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(readText(pkgPath));
      pkg.scripts ??= {};
      const scripts = {
        "gsd:repo": "node gsd/run.mjs repo:summary",
        "gsd:diff": "node gsd/run.mjs git:diff-summary",
        "gsd:plan": "node gsd/run.mjs spec:plan",
        "gsd:pr": "node gsd/run.mjs git:pr-body",
        "gsd:check": "node gsd/run.mjs checks:all",
        "spec:init": "node gsd/run.mjs spec:init",
        "spec:new": "node gsd/run.mjs spec:new",
        "spec:list": "node gsd/run.mjs spec:list",
        "spec:add-plan": "node gsd/run.mjs spec:add-plan",
        "spec:add-tasks": "node gsd/run.mjs spec:add-tasks",
        "spec:commit": "node gsd/run.mjs spec:commit",
        "spec:done": "node gsd/run.mjs spec:done",
        "spec:reject": "node gsd/run.mjs spec:reject"
      };
      for (const [k, v] of Object.entries(scripts)) {
        if (!pkg.scripts[k] || force) pkg.scripts[k] = v;
      }
      if (force) {
        pkg.devDependencies ??= {};
        // no deps for now
      }
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + os.EOL);
    } catch {
      // ignore malformed package.json
    }
  }

  // Ensure specs/ and its template dir exist
  ensureDir(path.join(root, 'specs', '0000-template'));
  ensureDir(path.join(root, 'gsd', 'memory'));

  console.log(`\n✅ Initialized ${PKG} scaffold in ${root}`);
  console.log(`\nSpec layout (speckit-style, one dir per feature):`);
  console.log(`  specs/NNNN-slug/   ← one directory per feature (git branch per feature)`);
  console.log(`    spec.md          ← requirements (spec:new)`);
  console.log(`    plan.md          ← technical plan (spec:add-plan)`);
  console.log(`    tasks.md         ← task breakdown (spec:add-tasks)`);
  console.log(`  gsd/memory/constitution.md  ← project principles`);
  console.log(`\nNext:`);
  console.log(`  1) Create a spec: ${PKG} new "add billing"  (or: npm run spec:new -- "add billing")`);
  console.log(`  2) Configure Serena MCP in your client using: ${PKG} mcp`);
}

function cmd_new(args) {
  const name = args.join(' ').trim();
  if (!name) die('missing <feature-name>.');

  const root = repoRoot();
  const specsDir = path.join(root, 'specs');
  ensureDir(specsDir);

  const n = nextSpecNumber(specsDir);
  const slug = slugify(name);
  const featureDir = `${n}-${slug}`;
  const featurePath = path.join(specsDir, featureDir);

  if (exists(featurePath)) die(`Already exists: specs/${featureDir}/`);
  ensureDir(featurePath);

  const templatePath = path.join(root, 'specs', '0000-template', 'spec.md');
  const fallback = `# ${name}\n\n- ID: ${n}\n- Date: ${new Date().toISOString().slice(0, 10)}\n- Slug: ${slug}\n\n## Problem\n\n## Goal\n\n## Non-goals\n\n## Acceptance criteria\n- [ ]\n\n## Risks / unknowns\n-\n`;
  const template = exists(templatePath) ? readText(templatePath) : fallback;
  const content = template
    .replace(/\{\{TITLE\}\}/g, name)
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{ID\}\}/g, n)
    .replace(/\{\{DATE\}\}/g, new Date().toISOString().slice(0, 10));

  const specFile = path.join(featurePath, 'spec.md');
  writeText(specFile, content, false);

  const specRel = `specs/${featureDir}/spec.md`;
  console.log(`\n🧾 Spec created: ${specRel}`);

  // Git: create feature branch and auto-commit
  const inGit = !!safeSh('git rev-parse --show-toplevel');
  if (inGit) {
    const branchExists = !!safeSh(`git branch --list "${featureDir}"`);
    if (!branchExists) {
      try {
        execSync(`git checkout -b "${featureDir}"`, { stdio: 'inherit' });
      } catch { /* warn only */ }
    }
    try {
      execSync(`git add "${specRel}"`, { stdio: 'ignore' });
      execSync(`git commit -m "spec(${featureDir}): create spec"`, { stdio: 'ignore' });
      console.log(`   committed: spec(${featureDir}): create spec`);
    } catch { /* nothing to commit */ }
  }

  console.log(`\nCopilot / agent prompt to paste once:`);
  console.log('---');
  console.log(
`Read AGENTS.md and gsd/memory/constitution.md (if present). Then open and follow the spec: ${specRel}.

Rules:
- Prefer Serena MCP tools for symbol lookup + edits when available.
- Ask at most 7 critical questions only if truly blocking; otherwise proceed with explicit assumptions.
- Produce: (1) a short implementation plan (3–7 steps), then (2) implement Step 1 as a small, reviewable diff.
- After changes: run checks (tests/lint/typecheck if present) and update gsd/logs/progress.md with what changed and how to verify.
- Use spec:add-plan and spec:add-tasks to scaffold the plan and task breakdown docs.
`);
  console.log('---');
}

function cmd_use(args) {
  const skill = (args[0] || '').trim();
  if (!skill) die('missing <skill-name> (example: frontend-design).');

  const root = repoRoot();
  const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
  console.log(`\nSkill activation prompt:`);
  console.log('---');
  console.log(
`Activate the skill "${skill}" by reading ${exists(skillPath) ? `skills/${skill}/SKILL.md` : `skills/${skill}/SKILL.md (not found—did you run init?)`}.
Then:
- Apply the skill's rules as constraints.
- Keep code production-grade and runnable.
- If requirements are missing, ask only the minimum questions, then proceed with assumptions.
`);
  console.log('---');
}

function cmd_status() {
  const root = repoRoot();
  const specsDir = path.join(root, 'specs');
  const logs = path.join(root, 'gsd', 'logs', 'progress.md');

  console.log(`\n📌 ${PKG} status (${root})\n`);

  if (exists(specsDir)) {
    const dirs = fs.readdirSync(specsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && /^\d{4}-/.test(e.name) && e.name !== '0000-template')
      .map(e => e.name)
      .sort();
    const currentBranch = safeSh('git rev-parse --abbrev-ref HEAD') || '';
    const mergedRaw = safeSh('git branch --merged main 2>/dev/null') || safeSh('git branch --merged master 2>/dev/null') || '';
    const mergedSet = new Set(mergedRaw.split('\n').map(l => l.trim().replace(/^\*\s*/, '')));

    console.log(`Specs (${dirs.length}):`);
    for (const dir of dirs.slice(-10)) {
      const specFile = path.join(specsDir, dir, 'spec.md');
      let title = dir;
      if (exists(specFile)) {
        const h1 = readText(specFile).split('\n').find(l => l.startsWith('# '));
        if (h1) title = h1.replace(/^#\s*/, '');
      }
      const branchExists = !!safeSh(`git branch --list "${dir}"`);
      let state = branchExists
        ? (dir === currentBranch ? '▶ current' : mergedSet.has(dir) ? '✓ done' : '○ active')
        : 'no-branch';
      console.log(`  ${dir.slice(0, 4)}  [${state}]  ${title}`);
    }
  } else {
    console.log('No specs/ directory found (run init?).');
  }

  console.log('');
  if (exists(logs)) {
    const lines = readText(logs).trim().split(/\r?\n/);
    const tail = lines.slice(Math.max(0, lines.length - 20));
    console.log('Recent progress log:');
    console.log(tail.map(l => `  ${l}`).join('\n'));
  } else {
    console.log('No progress log found at gsd/logs/progress.md');
  }

  console.log('');
  console.log('Tip: run `node gsd/run.mjs repo:summary` to give agents instant context.');
}

function cmd_mcp() {
  const root = repoRoot();
  console.log(`\n🧠 Serena MCP (default)\n`);
  console.log(`This scaffold includes mcp/serena.json and scripts/serena.mjs.`);
  console.log(`Serena can be launched via stdio subprocess or as an HTTP/SSE server; clients differ. Serena docs: https://oraios.github.io/serena/ (see "Running Serena" and "Connecting Your MCP Client").`);
  console.log(`\nRecommended (most reliable) install/run path is via Python uv/uvx (per many Serena guides), but you can adapt.`);

  console.log(`\n1) Stdio mode (client launches Serena as subprocess)`);
  console.log(`   Command (example):`);
  console.log(`     node scripts/serena.mjs stdio`);

  console.log(`\n2) HTTP/SSE mode (you start Serena; client connects to URL)`);
  console.log(`   Start server:`);
  console.log(`     node scripts/serena.mjs http --port 9123`);
  console.log(`   Then configure client server URL to: http://127.0.0.1:9123`);

  console.log(`\nNote:`);
  console.log(`- scripts/serena.mjs uses SERENA_CMD env var if set (e.g., 'uvx serena' or 'serena').`);
  console.log(`- If Serena isn't installed yet, install it first (see Serena docs).`);
}

const argv = process.argv.slice(2);
const cmd = argv.shift();

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

switch (cmd) {
  case 'init':
    cmd_init(argv);
    break;
  case 'new':
    cmd_new(argv);
    break;
  case 'use':
    cmd_use(argv);
    break;
  case 'status':
    cmd_status();
    break;
  case 'mcp':
    cmd_mcp();
    break;
  default:
    usage();
    die(`unknown command: ${cmd}`);
}
