#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Spec directory layout (speckit-style, per github/spec-kit)
//
//   specs/
//     0000-template/          ← templates for new features
//       spec.md
//       plan.md
//       tasks.md
//     0001-add-billing/       ← one directory per feature
//       spec.md               ← created by spec:new  (git branch: 0001-add-billing)
//       plan.md               ← created by spec:add-plan
//       tasks.md              ← created by spec:add-tasks
//     0002-auth-flow/
//       ...
//   gsd/
//     memory/
//       constitution.md       ← project principles (like speckit's constitution)
//     logs/progress.md
//     checklists/definition-of-done.md
//
// Lifecycle is tracked via git branches (not folders):
//   active   = branch exists and is not merged
//   done     = branch merged to main
//   rejected = branch deleted / abandoned
// ---------------------------------------------------------------------------

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
}

function safeSh(cmd) {
  try { return sh(cmd); } catch { return null; }
}

function walk(dir, maxDepth = 3, depth = 0, out = []) {
  if (depth > maxDepth) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const ent of entries) {
    if (['node_modules', '.git', 'dist', 'build'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    const rel = path.relative(process.cwd(), p);
    out.push(rel + (ent.isDirectory() ? '/' : ''));
    if (ent.isDirectory()) walk(p, maxDepth, depth + 1, out);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const SPEC_TEMPLATE = `# {{TITLE}}

- ID: {{ID}}
- Date: {{DATE}}
- Slug: {{SLUG}}

## Problem
What are we trying to fix/build, and why now?

## Goal
What does success look like? (Be specific; include measurable outcomes if possible.)

## Non-goals
What are we explicitly *not* doing in this change?

## Constraints
- Tech constraints (language, frameworks, infra, compatibility)
- Performance/security constraints
- Timeline/rollout constraints

## Proposed solution
High-level design. Include alternatives considered and why rejected.

## Acceptance criteria
- [ ]
- [ ]
- [ ]

## Risks / unknowns
-
`;

const PLAN_TEMPLATE = `# Plan: {{TITLE}}

- ID: {{ID}}
- Date: {{DATE}}

## Tech stack choices
-

## Architecture
High-level approach and key components.

## Implementation steps
1)
2)
3)

## Test plan
- Unit:
- Integration:
- E2E/Manual:

## Rollout / rollback
- Rollout steps:
- Rollback steps:

## Dependencies / integration points
-

## Open questions
-
`;

const TASKS_TEMPLATE = `# Tasks: {{TITLE}}

- ID: {{ID}}
- Date: {{DATE}}

## Task breakdown

### Phase 1 —
- [ ]

### Phase 2 —
- [ ]

## Parallel tasks [P]
- [ ]

## Checkpoints
- [ ] Phase 1 complete and verified
- [ ] All tasks done, checks passing
`;

const CONSTITUTION_TEMPLATE = `# Project Constitution

Governing principles for this project. The AI agent reads this before
every session to ensure consistency.

## Code quality
-

## Testing standards
-

## Architecture principles
-

## Performance / security
-

## What we don't do
-
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SPEC_ROOT = () => path.join(process.cwd(), 'specs');

function slugify(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'spec';
}

function specDirs() {
  const root = SPEC_ROOT();
  if (!exists(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d{4}-/.test(e.name))
    .map(e => e.name)
    .sort();
}

function nextSpecId() {
  const dirs = specDirs();
  const max = dirs.reduce((m, d) => Math.max(m, Number(d.slice(0, 4))), 0);
  return String(max + 1).padStart(4, '0');
}

function resolveFeatureDir(token) {
  const dirs = specDirs();
  if (!token) {
    // prefer current git branch if it matches a feature dir
    const branch = safeSh('git rev-parse --abbrev-ref HEAD');
    if (branch && dirs.includes(branch)) return branch;
    return dirs[dirs.length - 1] || null;
  }
  return dirs.find(d => d === token || d.startsWith(token) || d.includes(token)) || null;
}

function readSpecTitle(featureDir) {
  const p = path.join(SPEC_ROOT(), featureDir, 'spec.md');
  if (!exists(p)) return featureDir;
  const h1 = fs.readFileSync(p, 'utf8').split('\n').find(l => l.startsWith('# '));
  return h1 ? h1.replace(/^#\s*/, '') : featureDir;
}

function activeSpecPath() {
  const branch = safeSh('git rev-parse --abbrev-ref HEAD');
  const dirs = specDirs();
  let featureDir = (branch && dirs.includes(branch)) ? branch : dirs[dirs.length - 1];
  if (!featureDir) return null;
  const sp = path.join(SPEC_ROOT(), featureDir, 'spec.md');
  return exists(sp) ? sp : null;
}

function fillTemplate(tpl, vars) {
  return tpl
    .replace(/\{\{TITLE\}\}/g, vars.title)
    .replace(/\{\{SLUG\}\}/g, vars.slug)
    .replace(/\{\{ID\}\}/g, vars.id)
    .replace(/\{\{DATE\}\}/g, vars.date);
}

function autoCommit(relPath, message) {
  try {
    sh(`git add "${relPath}"`);
    sh(`git commit -m "${message}"`);
    console.log(`  committed: ${message}`);
  } catch {
    // nothing to commit or not a git repo — silently skip
  }
}

// ---------------------------------------------------------------------------
// Repo commands
// ---------------------------------------------------------------------------

function repoSummary() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');
  const hasPkg = exists(pkgPath);
  const gitRoot = safeSh('git rev-parse --show-toplevel');
  const branch = safeSh('git rev-parse --abbrev-ref HEAD');
  const status = safeSh('git status --porcelain');

  console.log('# Repo summary');
  console.log('');
  console.log(`- Path: ${cwd}`);
  if (gitRoot) console.log(`- Git: yes (${branch || 'unknown branch'})`);
  else console.log('- Git: no');
  if (typeof status === 'string') console.log(`- Dirty: ${status.length ? 'yes' : 'no'}`);
  console.log(`- package.json: ${hasPkg ? 'yes' : 'no'}`);

  if (hasPkg) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log(`- Name: ${pkg.name || '(none)'}`);
      const scripts = pkg.scripts ? Object.keys(pkg.scripts) : [];
      if (scripts.length) console.log(`- Scripts: ${scripts.slice(0, 12).join(', ')}${scripts.length > 12 ? '…' : ''}`);
    } catch { /* ignore */ }
  }

  console.log('');
  console.log('## Tree (depth<=2)');
  const tree = walk(cwd, 2).slice(0, 200);
  for (const line of tree) console.log(`- ${line}`);
  if (tree.length === 200) console.log('- …');
}

function diffSummary() {
  const diff = safeSh('git diff --stat');
  console.log(diff ? diff : '(no git diff / not a git repo)');
}

// ---------------------------------------------------------------------------
// Spec commands
// ---------------------------------------------------------------------------

function specInit() {
  const root = SPEC_ROOT();
  const tplDir = path.join(root, '0000-template');
  const memDir = path.join(process.cwd(), 'gsd', 'memory');
  let created = [];

  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(tplDir, { recursive: true });
  fs.mkdirSync(memDir, { recursive: true });

  const files = {
    [path.join(tplDir, 'spec.md')]: SPEC_TEMPLATE,
    [path.join(tplDir, 'plan.md')]: PLAN_TEMPLATE,
    [path.join(tplDir, 'tasks.md')]: TASKS_TEMPLATE,
    [path.join(memDir, 'constitution.md')]: CONSTITUTION_TEMPLATE,
  };

  for (const [p, content] of Object.entries(files)) {
    if (!exists(p)) {
      fs.writeFileSync(p, content, 'utf8');
      created.push(path.relative(process.cwd(), p));
    }
  }

  if (created.length) {
    console.log('spec:init — created:');
    for (const c of created) console.log(`  + ${c}`);
  } else {
    console.log('spec:init — already set up, nothing changed.');
  }
  console.log('');
  console.log('Layout:');
  console.log('  specs/NNNN-slug/      ← one directory per feature');
  console.log('    spec.md             ← requirements (spec:new)');
  console.log('    plan.md             ← technical plan (spec:add-plan)');
  console.log('    tasks.md            ← task breakdown (spec:add-tasks)');
  console.log('  gsd/memory/constitution.md  ← project principles');
  console.log('');
  console.log('Lifecycle is tracked via git branches (one branch per feature).');
}

function specNew(args) {
  const name = args.join(' ').trim();
  if (!name) { console.error('Usage: spec:new <feature-name>'); process.exit(1); }

  const root = SPEC_ROOT();
  fs.mkdirSync(root, { recursive: true });

  const id = nextSpecId();
  const slug = slugify(name);
  const featureDir = `${id}-${slug}`;
  const featurePath = path.join(root, featureDir);

  if (exists(featurePath)) {
    console.error(`Already exists: specs/${featureDir}/`);
    process.exit(1);
  }

  fs.mkdirSync(featurePath);

  const tplPath = path.join(root, '0000-template', 'spec.md');
  const tpl = exists(tplPath) ? fs.readFileSync(tplPath, 'utf8') : SPEC_TEMPLATE;
  const content = fillTemplate(tpl, { title: name, slug, id, date: new Date().toISOString().slice(0, 10) });
  const specFile = path.join(featurePath, 'spec.md');
  fs.writeFileSync(specFile, content, 'utf8');
  console.log(`Created: specs/${featureDir}/spec.md`);

  // Git: create feature branch and auto-commit spec.md
  if (safeSh('git rev-parse --show-toplevel')) {
    const existing = safeSh(`git branch --list "${featureDir}"`);
    if (!existing) {
      try {
        sh(`git checkout -b "${featureDir}"`);
        console.log(`  branch: ${featureDir}`);
      } catch (e) {
        console.warn(`  (could not create branch: ${e.message})`);
      }
    }
    autoCommit(`specs/${featureDir}/spec.md`, `spec(${featureDir}): create spec`);
  }
}

function specAddDoc(args, docType) {
  const token = (args[0] || '').trim();
  const featureDir = resolveFeatureDir(token);
  if (!featureDir) {
    console.error(`No spec found${token ? ` matching: ${token}` : ''}. Run spec:new first.`);
    process.exit(1);
  }

  const destPath = path.join(SPEC_ROOT(), featureDir, `${docType}.md`);
  if (exists(destPath)) {
    console.log(`Already exists: specs/${featureDir}/${docType}.md`);
    return;
  }

  const tplPath = path.join(SPEC_ROOT(), '0000-template', `${docType}.md`);
  const fallback = docType === 'plan' ? PLAN_TEMPLATE : TASKS_TEMPLATE;
  const tpl = exists(tplPath) ? fs.readFileSync(tplPath, 'utf8') : fallback;

  const title = readSpecTitle(featureDir);
  const id = featureDir.slice(0, 4);
  const content = fillTemplate(tpl, { title, slug: featureDir.slice(5), id, date: new Date().toISOString().slice(0, 10) });

  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`Created: specs/${featureDir}/${docType}.md`);
  autoCommit(`specs/${featureDir}/${docType}.md`, `spec(${featureDir}): add ${docType}`);
}

function specList() {
  const dirs = specDirs();
  if (!dirs.length) {
    console.log('No specs found. Run: node gsd/run.mjs spec:new <name>');
    return;
  }

  const currentBranch = safeSh('git rev-parse --abbrev-ref HEAD') || '';
  const mergedRaw = safeSh('git branch --merged main 2>/dev/null') || safeSh('git branch --merged master 2>/dev/null') || '';
  const mergedSet = new Set(mergedRaw.split('\n').map(l => l.trim().replace(/^\*\s*/, '')));

  console.log('');
  for (const dir of dirs) {
    if (dir === '0000-template') continue;
    const title = readSpecTitle(dir);
    const branchExists = !!safeSh(`git branch --list "${dir}"`);

    let status;
    if (!branchExists) status = 'no-branch';
    else if (dir === currentBranch) status = '▶ current';
    else if (mergedSet.has(dir)) status = '✓ done';
    else status = '○ active';

    const files = fs.readdirSync(path.join(SPEC_ROOT(), dir))
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .join(', ');

    console.log(`  ${dir.slice(0, 4)}  [${status}]  ${title}`);
    console.log(`         files: ${files || '(empty)'}  branch: ${branchExists ? dir : '—'}`);
  }
  console.log('');
}

function specCommit(args) {
  const token = (args[0] || '').trim();
  const featureDir = resolveFeatureDir(token);
  if (!featureDir) { console.error('No matching spec found.'); process.exit(1); }
  if (!safeSh('git rev-parse --show-toplevel')) { console.error('Not a git repository.'); process.exit(1); }

  try {
    sh(`git add "specs/${featureDir}/"`);
    const msg = `spec(${featureDir}): update`;
    sh(`git commit -m "${msg}"`);
    console.log(`Committed: ${msg}`);
  } catch {
    console.log('Nothing to commit.');
  }
}

function specDone(args) {
  const token = (args[0] || '').trim();
  const featureDir = resolveFeatureDir(token);
  if (!featureDir) { console.error('No matching spec found.'); process.exit(1); }

  const inGit = !!safeSh('git rev-parse --show-toplevel');
  if (!inGit) { console.log(`Not a git repo. Manually merge feature: ${featureDir}`); return; }

  const mainBranch = safeSh('git branch --list main') ? 'main' : 'master';
  console.log(`Feature: ${featureDir}`);
  console.log(`To mark as done, merge the feature branch into ${mainBranch}:`);
  console.log(`  git checkout ${mainBranch}`);
  console.log(`  git merge --no-ff ${featureDir}`);
  console.log(`  git branch -d ${featureDir}`);
  console.log('');
  console.log(`Switching to ${mainBranch}...`);
  try { sh(`git checkout "${mainBranch}"`); console.log(`On ${mainBranch}.`); }
  catch (e) { console.warn(`  Could not switch: ${e.message}`); }
}

function specReject(args) {
  const token = (args[0] || '').trim();
  const featureDir = resolveFeatureDir(token);
  if (!featureDir) { console.error('No matching spec found.'); process.exit(1); }

  const inGit = !!safeSh('git rev-parse --show-toplevel');
  if (inGit) {
    const currentBranch = safeSh('git rev-parse --abbrev-ref HEAD');
    if (currentBranch === featureDir) {
      try { sh('git checkout -'); } catch { /* ignore */ }
    }
    const branchExists = !!safeSh(`git branch --list "${featureDir}"`);
    if (branchExists) {
      try {
        sh(`git branch -D "${featureDir}"`);
        console.log(`Deleted branch: ${featureDir}`);
      } catch (e) { console.warn(`Could not delete branch: ${e.message}`); }
    }
  }
  console.log(`Rejected: ${featureDir}`);
  console.log(`Spec files remain in specs/${featureDir}/ for reference.`);
}

function specPlan() {
  const sp = activeSpecPath();
  if (!sp) {
    console.log('No active spec found. Run: spec:new <name> or checkout a feature branch.');
    return;
  }
  const md = fs.readFileSync(sp, 'utf8');
  const title = (md.match(/^#\s+(.+)$/m) || [])[1] || path.basename(path.dirname(sp));
  const featureDir = path.basename(path.dirname(sp));

  console.log(`# Plan skeleton for: ${title}`);
  console.log('');
  console.log('1) Confirm acceptance criteria + constraints');
  console.log('2) Identify touched modules + integration points');
  console.log('3) Implement smallest vertical slice (PR-sized)');
  console.log('4) Add/adjust tests');
  console.log('5) Run checks and document verification');
  console.log('');
  console.log(`(Source: specs/${featureDir}/spec.md)`);
  console.log('');
  console.log(`Tip: run  node gsd/run.mjs spec:add-plan  to scaffold a plan.md`);
}

function prBody() {
  const sp = activeSpecPath();
  const featureDir = sp ? path.basename(path.dirname(sp)) : null;
  const specRel = featureDir ? `specs/${featureDir}/spec.md` : null;
  const diff = safeSh('git diff --stat') || '(no diff)';

  console.log('## Why');
  console.log('- ');
  console.log('');
  console.log('## What changed');
  console.log('- ');
  console.log('');
  console.log('## How to verify');
  console.log('- ');
  console.log('');
  if (specRel) {
    console.log('## Spec');
    console.log(`- ${specRel}`);
    console.log('');
  }
  console.log('## Diff summary');
  console.log('```');
  console.log(diff);
  console.log('```');
}

function checksAll() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const cmds = [];
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const s = pkg.scripts || {};
      if (s.test) cmds.push('npm test');
      if (s.lint) cmds.push('npm run lint');
      if (s.typecheck) cmds.push('npm run typecheck');
      if (!cmds.length) cmds.push('npm test');
    } catch { cmds.push('npm test'); }
  } else {
    cmds.push('git status');
  }

  for (const c of cmds) {
    console.log(`\n$ ${c}`);
    const out = safeSh(c);
    if (out) console.log(out);
    else console.log('(command failed or produced no output)');
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const cmd = process.argv[2];
const cmdArgs = process.argv.slice(3);

switch (cmd) {
  case 'repo:summary':   repoSummary(); break;
  case 'git:diff-summary': diffSummary(); break;
  case 'git:pr-body':    prBody(); break;
  case 'checks:all':     checksAll(); break;

  case 'spec:init':      specInit(); break;
  case 'spec:new':       specNew(cmdArgs); break;
  case 'spec:list':      specList(); break;
  case 'spec:add-plan':  specAddDoc(cmdArgs, 'plan'); break;
  case 'spec:add-tasks': specAddDoc(cmdArgs, 'tasks'); break;
  case 'spec:commit':    specCommit(cmdArgs); break;
  case 'spec:done':      specDone(cmdArgs); break;
  case 'spec:reject':    specReject(cmdArgs); break;
  case 'spec:plan':      specPlan(); break; // prints plan skeleton for AI

  default:
    console.log('Usage: node gsd/run.mjs <command>');
    console.log('');
    console.log('Spec lifecycle (one git branch per feature):');
    console.log('  spec:init               set up specs/ + gsd/memory/ structure');
    console.log('  spec:new <name>         create specs/NNNN-slug/ + branch + auto-commit');
    console.log('  spec:add-plan [id]      scaffold specs/NNNN-slug/plan.md + auto-commit');
    console.log('  spec:add-tasks [id]     scaffold specs/NNNN-slug/tasks.md + auto-commit');
    console.log('  spec:commit [id]        commit all changes in a feature spec dir');
    console.log('  spec:list               list all specs with branch / merge status');
    console.log('  spec:done [id]          switch to main and print merge instructions');
    console.log('  spec:reject [id]        delete feature branch (files kept for reference)');
    console.log('  spec:plan               print AI plan skeleton for the active spec');
    console.log('');
    console.log('Repo / git:');
    console.log('  repo:summary            print repo context (git, package.json, tree)');
    console.log('  git:diff-summary        print git diff --stat');
    console.log('  git:pr-body             generate a PR body from active spec + diff');
    console.log('  checks:all              run test/lint/typecheck scripts');
    process.exit(1);
}
