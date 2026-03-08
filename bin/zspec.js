#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { execSync } from 'node:child_process';

const PKG = 'zspec';

function die(msg, code = 1) {
  console.error(`\n${PKG}: ${msg}`);
  process.exit(code);
}

function usage() {
  console.log(`\n${PKG} v0.1.0\n\nUsage:\n  ${PKG} [init] [--force]\n  ${PKG} new <feature-name>\n  ${PKG} story <story-name>\n  ${PKG} use <skill-name>\n  ${PKG} status\n  ${PKG} mcp\n\nWhat it does:\n  - init (default): scaffold repo conventions (.github/, .zspec/)\n  - new: create .zspec/specs/NNNN-slug/ + git branch + auto-commit, print a Copilot-ready prompt\n  - story: create .zspec/stories/<slug>/ with story.md, context.md, tasks.md, notes.md, codebase/\n  - use: print a skill activation prompt (e.g., frontend-design)\n  - status: summarize specs and recent log entries (one dir per feature, branch-based lifecycle)\n  - mcp: check and install Serena MCP (via uv/uvx) interactively\n`);
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

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
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
        "zspec:repo": "node .zspec/run.mjs repo:summary",
        "zspec:diff": "node .zspec/run.mjs git:diff-summary",
        "zspec:plan": "node .zspec/run.mjs spec:plan",
        "zspec:pr": "node .zspec/run.mjs git:pr-body",
        "zspec:check": "node .zspec/run.mjs checks:all",
        "spec:init": "node .zspec/run.mjs spec:init",
        "spec:new": "node .zspec/run.mjs spec:new",
        "spec:list": "node .zspec/run.mjs spec:list",
        "spec:add-plan": "node .zspec/run.mjs spec:add-plan",
        "spec:add-tasks": "node .zspec/run.mjs spec:add-tasks",
        "spec:commit": "node .zspec/run.mjs spec:commit",
        "spec:done": "node .zspec/run.mjs spec:done",
        "spec:reject": "node .zspec/run.mjs spec:reject"
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

  // Ensure .zspec/specs/ and its template dir exist
  ensureDir(path.join(root, '.zspec', 'specs', '0000-template'));
  ensureDir(path.join(root, '.zspec', 'memory'));

  // Ensure .zspec/ story directories exist
  ensureDir(path.join(root, '.zspec', 'stories'));

  console.log(`\n✅ Initialized ${PKG} scaffold in ${root}`);
  console.log(`\nStory layout (.zspec-style, one dir per story):`);
  console.log(`  .zspec/stories/<story-slug>/   ← one directory per story`);
  console.log(`    story.md     ← user story, acceptance criteria (zspec story)`);
  console.log(`    context.md   ← relevant systems, architectural notes`);
  console.log(`    tasks.md     ← implementation and review checklists`);
  console.log(`    notes.md     ← decisions, tradeoffs, risks`);
  console.log(`    codebase/    ← STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS`);
  console.log(`\nSpec layout (speckit-style, one dir per feature):`);
  console.log(`  .zspec/specs/NNNN-slug/   ← one directory per feature (git branch per feature)`);
  console.log(`    spec.md          ← requirements (spec:new)`);
  console.log(`    plan.md          ← technical plan (spec:add-plan)`);
  console.log(`    tasks.md         ← task breakdown (spec:add-tasks)`);
  console.log(`  .zspec/memory/constitution.md  ← project principles`);
  console.log(`\nCopilot agents (.github/agents/):`);
  console.log(`  @codebase-mapper  ← orchestrates codebase analysis for a story`);
  console.log(`  @stack-mapper     ← analyzes stack and integrations`);
  console.log(`  @arch-mapper      ← analyzes architecture and structure`);
  console.log(`  @quality-mapper   ← analyzes conventions and testing`);
  console.log(`  @concerns-mapper  ← identifies technical concerns`);
  console.log(`\nCopilot Chat prompts (.github/prompts/):`);
  console.log(`  new-story         ← scaffold a new story`);
  console.log(`  map-codebase      ← analyze codebase for a story`);
  console.log(`  new-spec          ← create a new feature spec`);
  console.log(`  implement-story   ← implement a story end-to-end`);
  console.log(`  pr-description    ← generate a PR description`);
  console.log(`\nNext:`);
  console.log(`  1) Create a story: ${PKG} story "add billing"`);
  console.log(`  2) Or create a spec: ${PKG} new "add billing"  (or: npm run spec:new -- "add billing")`);
  console.log(`  3) Configure Serena MCP in your client using: ${PKG} mcp`);
}

function cmd_new(args) {
  const name = args.join(' ').trim();
  if (!name) die('missing <feature-name>.');

  const root = repoRoot();
  const specsDir = path.join(root, '.zspec', 'specs');
  ensureDir(specsDir);

  const n = nextSpecNumber(specsDir);
  const slug = slugify(name);
  const featureDir = `${n}-${slug}`;
  const featurePath = path.join(specsDir, featureDir);

  if (exists(featurePath)) die(`Already exists: .zspec/specs/${featureDir}/`);
  ensureDir(featurePath);

  const templatePath = path.join(root, '.zspec', 'specs', '0000-template', 'spec.md');
  const fallback = `# ${name}\n\n- ID: ${n}\n- Date: ${new Date().toISOString().slice(0, 10)}\n- Slug: ${slug}\n\n## Problem\n\n## Goal\n\n## Non-goals\n\n## Acceptance criteria\n- [ ]\n\n## Risks / unknowns\n-\n`;
  const template = exists(templatePath) ? readText(templatePath) : fallback;
  const content = template
    .replace(/\{\{TITLE\}\}/g, name)
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{ID\}\}/g, n)
    .replace(/\{\{DATE\}\}/g, new Date().toISOString().slice(0, 10));

  const specFile = path.join(featurePath, 'spec.md');
  writeText(specFile, content, false);

  const specRel = `.zspec/specs/${featureDir}/spec.md`;
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
`Read .github/AGENTS.md and .zspec/memory/constitution.md (if present). Then open and follow the spec: ${specRel}.

Rules:
- Prefer Serena MCP tools for symbol lookup + edits when available.
- Ask at most 7 critical questions only if truly blocking; otherwise proceed with explicit assumptions.
- Produce: (1) a short implementation plan (3–7 steps), then (2) implement Step 1 as a small, reviewable diff.
- After changes: run checks (tests/lint/typecheck if present) and update .zspec/logs/progress.md with what changed and how to verify.
- Use spec:add-plan and spec:add-tasks to scaffold the plan and task breakdown docs.
`);
  console.log('---');
}

function cmd_story(args) {
  const name = args.join(' ').trim();
  if (!name) die('missing <story-name>.');

  const root = repoRoot();
  const slug = slugify(name);
  const storyDir = path.join(root, '.zspec', 'stories', slug);

  if (exists(storyDir)) die(`Already exists: .zspec/stories/${slug}/`);
  ensureDir(storyDir);
  ensureDir(path.join(storyDir, 'codebase'));

  const tplDir = path.join(root, '.zspec', 'templates');
  const date = new Date().toISOString().slice(0, 10);

  function renderTpl(tplFile, fallback) {
    const p = path.join(tplDir, tplFile);
    const content = exists(p) ? readText(p) : fallback;
    return content
      .replace(/\{\{TITLE\}\}/g, name)
      .replace(/\{\{SLUG\}\}/g, slug)
      .replace(/\{\{DATE\}\}/g, date);
  }

  const storyMd = renderTpl('story.md',
    `# ${name}\n\n- **Story slug**: \`${slug}\`\n- **Date**: ${date}\n- **Status**: draft\n\n## User Story\n\n> As a **[role]**, I want to **[action]** so that **[business value]**.\n\n## Acceptance Criteria\n\n- [ ]\n`);
  const contextMd = renderTpl('context.md',
    `# Context: ${name}\n\n## Relevant Systems\n\n## Touched Modules\n\n## Dependencies\n\n## Architectural Notes\n`);
  const tasksMd = renderTpl('tasks.md',
    `# Tasks: ${name}\n\n## Implementation Checklist\n\n- [ ]\n\n## Testing Checklist\n\n- [ ]\n\n## Review Checklist\n\n- [ ] All acceptance criteria met\n- [ ] Lint and tests pass\n`);
  const notesMd = renderTpl('notes.md',
    `# Notes: ${name}\n\n## Open Questions\n\n## Decisions\n\n## Risks\n`);

  const codebaseTpls = ['STACK.md', 'INTEGRATIONS.md', 'ARCHITECTURE.md', 'STRUCTURE.md', 'CONVENTIONS.md', 'TESTING.md', 'CONCERNS.md'];
  const codebaseFallbacks = {
    'STACK.md': `# Stack: ${name}\n\nGenerated by \`@stack-mapper\`.\n`,
    'INTEGRATIONS.md': `# Integrations: ${name}\n\nGenerated by \`@stack-mapper\`.\n`,
    'ARCHITECTURE.md': `# Architecture: ${name}\n\nGenerated by \`@arch-mapper\`.\n`,
    'STRUCTURE.md': `# Structure: ${name}\n\nGenerated by \`@arch-mapper\`.\n`,
    'CONVENTIONS.md': `# Conventions: ${name}\n\nGenerated by \`@quality-mapper\`.\n`,
    'TESTING.md': `# Testing: ${name}\n\nGenerated by \`@quality-mapper\`.\n`,
    'CONCERNS.md': `# Concerns: ${name}\n\nGenerated by \`@concerns-mapper\`.\n`,
  };

  writeText(path.join(storyDir, 'story.md'), storyMd, false);
  writeText(path.join(storyDir, 'context.md'), contextMd, false);
  writeText(path.join(storyDir, 'tasks.md'), tasksMd, false);
  writeText(path.join(storyDir, 'notes.md'), notesMd, false);
  for (const f of codebaseTpls) {
    writeText(path.join(storyDir, 'codebase', f), renderTpl(`codebase/${f}`, codebaseFallbacks[f]), false);
  }

  const storyRel = `.zspec/stories/${slug}/story.md`;
  console.log(`\n📖 Story created: .zspec/stories/${slug}/`);
  console.log(`   story.md · context.md · tasks.md · notes.md · codebase/`);

  console.log(`\nCopilot / agent prompt to paste once:`);
  console.log('---');
  console.log(
`Read AGENTS.md and .github/copilot-instructions.md. Then open the story: ${storyRel}.

Next steps:
1. Use @codebase-mapper in Copilot Chat to analyze the codebase for this story.
   Example: @codebase-mapper story-slug: ${slug}
2. Review the generated codebase/ docs (STACK, ARCHITECTURE, CONCERNS, etc.).
3. Fill in context.md with relevant systems and notes.
4. Implement tasks in tasks.md as small, reviewable diffs.
5. Record decisions and tradeoffs in notes.md.
`);
  console.log('---');
}

function cmd_use(args) {
  const skill = (args[0] || '').trim();
  if (!skill) die('missing <skill-name> (example: frontend-design).');

  const root = repoRoot();
  const skillPath = path.join(root, '.zspec', 'skills', skill, 'SKILL.md');
  console.log(`\nSkill activation prompt:`);
  console.log('---');
  console.log(
`Activate the skill "${skill}" by reading ${exists(skillPath) ? `.zspec/skills/${skill}/SKILL.md` : `.zspec/skills/${skill}/SKILL.md (not found—did you run init?)`}.
Then:
- Apply the skill's rules as constraints.
- Keep code production-grade and runnable.
- If requirements are missing, ask only the minimum questions, then proceed with assumptions.
`);
  console.log('---');
}

function cmd_status() {
  const root = repoRoot();
  const specsDir = path.join(root, '.zspec', 'specs');
  const logs = path.join(root, '.zspec', 'logs', 'progress.md');

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
    console.log('No .zspec/specs/ directory found (run init?).');
  }

  console.log('');
  if (exists(logs)) {
    const lines = readText(logs).trim().split(/\r?\n/);
    const tail = lines.slice(Math.max(0, lines.length - 20));
    console.log('Recent progress log:');
    console.log(tail.map(l => `  ${l}`).join('\n'));
  } else {
    console.log('No progress log found at .zspec/logs/progress.md');
  }

  console.log('');
  console.log('Tip: run `node .zspec/run.mjs repo:summary` to give agents instant context.');
}

async function cmd_mcp() {
  console.log('\n🧠 Serena MCP Setup\n');

  // ── Step 1: check for uvx ────────────────────────────────────────────────
  const hasUvx = !!safeSh('which uvx 2>/dev/null');

  if (!hasUvx) {
    console.log('Serena MCP requires uv/uvx to run. uv is a fast Python package runner');
    console.log('that installs and executes tools like Serena in an isolated environment,');
    console.log('without touching your global Python setup.\n');
    console.log('zspec uses it to launch Serena MCP — which gives AI assistants like GitHub');
    console.log('Copilot the ability to navigate your codebase symbolically:\n');
    console.log('  • search for functions, classes, and symbols by name');
    console.log('  • make targeted edits without reading entire files');
    console.log('  • understand imports, references, and file structure\n');

    const answer = await prompt('uvx is not installed. Install uv now? [y/N] ');
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\nInstalling uv...\n');
      try {
        execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', { stdio: 'inherit' });
        console.log('\n✅ uv installed.');
        console.log('   Restart your terminal (or run: source ~/.zshrc / source ~/.bashrc)');
        console.log('   then run `npx zspec mcp` again to continue.\n');
      } catch {
        console.log('\n❌ Installation failed.');
        console.log('   Install manually: https://docs.astral.sh/uv/getting-started/installation/\n');
      }
    } else {
      console.log('\nSkipped. Install uv when ready: https://docs.astral.sh/uv/getting-started/installation/');
      console.log('Then run `npx zspec mcp` again.\n');
    }
    return;
  }

  console.log('✅ uvx is available.\n');

  // ── Step 2: check if serena is installed as a uv tool ───────────────────
  const toolList = safeSh('uv tool list 2>/dev/null') || '';
  const serenaInstalled = toolList.toLowerCase().includes('serena');

  if (!serenaInstalled) {
    console.log('Serena MCP is not yet installed.\n');
    console.log('Serena is a Model Context Protocol (MCP) server that connects AI assistants');
    console.log('to your codebase. Without it, agents read whole files to find code. With');
    console.log('Serena, they can:\n');
    console.log('  • jump directly to a symbol (function, class, variable) by name');
    console.log('  • find all references to a symbol across the entire codebase');
    console.log('  • make precise, symbol-scoped edits using fewer tokens');
    console.log('  • understand architecture without reading every file\n');

    const answer = await prompt('Install Serena MCP now? (uv tool install serena) [y/N] ');
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\nInstalling Serena MCP...\n');
      try {
        execSync('uv tool install serena', { stdio: 'inherit' });
        console.log('\n✅ Serena MCP installed.\n');
      } catch {
        console.log('\n❌ Installation failed. Try manually:');
        console.log('   uv tool install serena');
        console.log('   Serena docs: https://oraios.github.io/serena/\n');
        return;
      }
    } else {
      console.log('\nSkipped. Run `npx zspec mcp` again when ready.\n');
      return;
    }
  } else {
    console.log('✅ Serena MCP is installed.\n');
  }

  // ── Both ready — show client config ─────────────────────────────────────
  console.log('Serena is ready. Configure your AI client (e.g. VS Code, Cursor, Claude Desktop):\n');
  console.log('  Stdio mode (recommended — client spawns Serena):');
  console.log('    command: uvx');
  console.log('    args:    ["serena", "--transport", "stdio", "--project-root", "/path/to/project"]\n');
  console.log('  Or use the scaffold helper:');
  console.log('    node .zspec/scripts/serena.mjs stdio');
  console.log('    node .zspec/scripts/serena.mjs http --port 9123\n');
  console.log('  Full docs: https://oraios.github.io/serena/');
}

(async () => {
  const argv = process.argv.slice(2);
  const cmd = argv.shift();

  if (cmd === '--help' || cmd === '-h') {
    usage();
    process.exit(0);
  }

  switch (cmd) {
    case undefined:
    case 'init':
      cmd_init(argv);
      break;
    case 'new':
      cmd_new(argv);
      break;
    case 'story':
      cmd_story(argv);
      break;
    case 'use':
      cmd_use(argv);
      break;
    case 'status':
      cmd_status();
      break;
    case 'mcp':
      await cmd_mcp();
      break;
    default:
      usage();
      die(`unknown command: ${cmd}`);
  }
})().catch(e => die(e.message));
