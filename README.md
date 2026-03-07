# zspec

**zspec** is a CLI scaffold that combines two complementary workflows into one tool:

- **GSD** (*GetShitDone*) — a pragmatic, log-driven productivity workflow that keeps teams moving with small diffs, explicit assumptions, and continuous progress logging.
- **GitHub Speckit** — a spec-first, directory-per-feature specification system inspired by GitHub's internal [spec-kit](https://github.com/github/spec-kit), where every feature lives in its own `specs/NNNN-slug/` directory and its lifecycle is tracked through git branches.

On top of these two, **zspec** wires in [**Serena MCP**](https://oraios.github.io/serena/) — a Model Context Protocol server for AI agents — so that Copilot, Claude, or any MCP-capable agent can navigate and edit your codebase with structured tools instead of raw file reads.

---

## Table of contents

- [Why zspec?](#why-zspec)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Commands](#commands)
  - [init](#init)
  - [new](#new)
  - [use](#use)
  - [status](#status)
  - [mcp](#mcp)
- [Repo layout after init](#repo-layout-after-init)
- [The GSD workflow](#the-gsd-workflow)
- [The Speckit workflow](#the-speckit-workflow)
- [Serena MCP integration](#serena-mcp-integration)
- [Skills](#skills)
- [npm scripts](#npm-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Why zspec?

Modern software teams work with AI coding assistants every day. Those assistants produce better results when they have:

1. **Clear specs** — a written description of what to build, why, and what "done" looks like.
2. **A defined workflow** — a short loop that drives tasks to completion without endless back-and-forth.
3. **Structured tool access** — MCP tooling so the agent can search symbols, read files, and make safe edits.

zspec gives you all three with a single `npx zspec init` command.

---

## Installation

```bash
# Use without installing (recommended for initial scaffold)
npx zspec init

# Or install globally
npm install -g zspec

# Or as a dev dependency
npm install --save-dev zspec
```

**Requires Node.js ≥ 18.**

---

## Quick start

```bash
# 1. Scaffold conventions into your repo
npx zspec init

# 2. Create a spec for a new feature
zspec new "add billing"

# 3. Paste the printed Copilot prompt into your AI assistant

# 4. Check status at any time
zspec status

# 5. Set up Serena MCP in your client
zspec mcp
```

---

## Commands

### `init`

```
zspec init [--force]
```

Scaffolds the following into your current working directory:

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Agent operating manual (default loop, rules, Serena guidance) |
| `specs/0000-template/` | Spec/plan/tasks templates for new features |
| `gsd/run.mjs` | GSD task runner (spec lifecycle, git helpers, repo summary) |
| `gsd/logs/progress.md` | Progress log appended by agents after each session |
| `gsd/checklists/definition-of-done.md` | Checklist agents verify before closing a feature |
| `gsd/memory/` | Persistent agent memory (constitution, project principles) |
| `mcp/serena.json` | Serena MCP client config |
| `scripts/serena.mjs` | Serena launcher script (stdio or HTTP/SSE) |
| `skills/` | Optional skill modules for specialized tasks |
| `.github/` | PR template + issue templates (feature, bug) |

If a `package.json` is present in the repo root, `init` also injects GSD and spec npm scripts (see [npm scripts](#npm-scripts)).

Use `--force` to overwrite existing files (default: skip files that already exist).

---

### `new`

```
zspec new <feature-name>
```

Creates a new spec directory and optionally a git branch for the feature.

**What it does:**

1. Computes the next spec number (`NNNN`) by scanning `specs/` for existing numbered directories.
2. Slugifies the feature name (lowercase, hyphens, max 60 chars).
3. Creates `specs/NNNN-slug/spec.md` from the template in `specs/0000-template/spec.md` (falls back to a built-in template if not present).
4. If the current directory is a git repo, creates a feature branch named `NNNN-slug` and commits the new spec.
5. Prints a **Copilot-ready prompt** you can paste directly into your AI assistant to kick off the feature.

**Example:**

```bash
zspec new "user authentication"
# Creates: specs/0001-user-authentication/spec.md
# Branch:  0001-user-authentication
# Prints:  agent prompt
```

---

### `use`

```
zspec use <skill-name>
```

Prints a skill activation prompt for your AI assistant. Skills live in `skills/<skill-name>/SKILL.md` after `init`.

**Built-in skills (scaffolded by init):**

| Skill | Purpose |
|-------|---------|
| `gsd-core` | Small diffs, verification-first, progress logging |
| `speckit-core` | Clear specs with goals, non-goals, and acceptance criteria |
| `frontend-design` | UI/component/layout conventions |

**Example:**

```bash
zspec use frontend-design
# Prints: skill activation prompt to paste into your AI assistant
```

---

### `status`

```
zspec status
```

Summarizes the current state of the repo:

- Lists the most recent 10 specs (by directory name) with their branch status:
  - `▶ current` — the currently checked-out branch
  - `○ active` — branch exists but not yet merged
  - `✓ done` — branch merged into `main`/`master`
  - `no-branch` — spec files exist but no associated git branch
- Prints the last 20 lines of `gsd/logs/progress.md` if present.

---

### `mcp`

```
zspec mcp
```

Prints setup instructions for connecting Serena MCP to your AI client, including:

- **Stdio mode**: client spawns Serena as a subprocess via `scripts/serena.mjs stdio`
- **HTTP/SSE mode**: you run Serena as a server, client connects to `http://127.0.0.1:9123`

See the [Serena docs](https://oraios.github.io/serena/) for client-specific configuration.

---

## Repo layout after init

```
.
├── AGENTS.md                          # Agent operating manual
├── specs/
│   ├── 0000-template/                 # Template files for new specs
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   ├── 0001-add-billing/              # One directory per feature
│   │   ├── spec.md                    # Requirements (zspec new)
│   │   ├── plan.md                    # Technical plan (spec:add-plan)
│   │   └── tasks.md                   # Task breakdown (spec:add-tasks)
│   └── 0002-auth-flow/
│       └── spec.md
├── gsd/
│   ├── run.mjs                        # GSD task runner
│   ├── logs/
│   │   └── progress.md                # Append-only progress log
│   ├── checklists/
│   │   └── definition-of-done.md
│   ├── memory/
│   │   └── constitution.md            # Project principles
│   └── playbooks/
│       └── add-endpoint.md
├── mcp/
│   └── serena.json                    # Serena MCP client config
├── scripts/
│   └── serena.mjs                     # Serena launcher
└── skills/
    ├── gsd-core/SKILL.md
    ├── speckit-core/SKILL.md
    └── frontend-design/SKILL.md
```

---

## The GSD workflow

GSD (*GetShitDone*) is a lightweight loop designed to keep AI-assisted development moving without thrash:

1. **Load context** — read the active spec(s) and the Definition of Done.
2. **Ask bounded questions** — at most 7 critical questions; proceed with explicit assumptions if info is missing.
3. **Plan** — 3–7 PR-sized steps (small, reviewable, easy to roll back).
4. **Execute** — prefer Serena MCP tools for symbol lookup, references, and safe edits.
5. **Verify** — run `tests`, `lint`, `typecheck` if present; provide a manual verification plan otherwise.
6. **Log** — append a short entry to `gsd/logs/progress.md`: what changed, how to verify, any risks.

The GSD task runner (`node gsd/run.mjs`) provides spec lifecycle commands:

```bash
node gsd/run.mjs spec:new "feature name"   # create spec
node gsd/run.mjs spec:add-plan             # scaffold plan.md
node gsd/run.mjs spec:add-tasks            # scaffold tasks.md
node gsd/run.mjs spec:list                 # list all specs with status
node gsd/run.mjs spec:done                 # merge instructions
node gsd/run.mjs repo:summary              # instant repo context for agents
node gsd/run.mjs git:pr-body               # generate PR body from active spec
```

---

## The Speckit workflow

zspec uses GitHub's [spec-kit](https://github.com/github/spec-kit) approach: **one directory per feature, one git branch per feature**. Lifecycle is tracked through git, not folder renames.

**Creating a spec:**

```bash
zspec new "user authentication"
# → specs/0001-user-authentication/spec.md
# → git branch: 0001-user-authentication
```

**Filling in the spec** (`spec.md` template sections):

- **Problem** — what are we fixing/building, and why now?
- **Goal** — what does success look like? (measurable outcomes)
- **Non-goals** — explicitly what we are NOT doing
- **Constraints** — tech, performance, security, timeline
- **Proposed solution** — high-level design + alternatives considered
- **Acceptance criteria** — checkboxes, each verifiable
- **Risks / unknowns**

**Adding a plan and tasks:**

```bash
node gsd/run.mjs spec:add-plan    # creates specs/0001-.../plan.md
node gsd/run.mjs spec:add-tasks   # creates specs/0001-.../tasks.md
```

**Completing a feature:**

```bash
node gsd/run.mjs spec:done        # switch to main + print merge instructions
# Merge the branch, then:
git branch -d 0001-user-authentication
```

**Rejecting a feature:**

```bash
node gsd/run.mjs spec:reject      # delete branch; spec files kept for reference
```

---

## Serena MCP integration

[Serena](https://oraios.github.io/serena/) is an open-source MCP server that gives AI agents structured access to your codebase:

- **Symbol search** — find classes, functions, variables by name
- **File navigation** — open, read, navigate files with context
- **Safe edits** — make targeted code edits with agent guardrails

**Setup after `zspec init`:**

```bash
# Print setup instructions for your MCP client
zspec mcp

# Option 1: Stdio mode (client manages process lifecycle)
node scripts/serena.mjs stdio

# Option 2: HTTP/SSE mode
node scripts/serena.mjs http --port 9123
# Configure client URL: http://127.0.0.1:9123
```

The `mcp/serena.json` file contains a pre-built Serena client config. The `SERENA_CMD` environment variable overrides the Serena binary (useful with `uvx serena` or custom installs).

---

## Skills

Skills are constraint files that agents apply when working on specific types of tasks. They live in `skills/<skill-name>/SKILL.md`.

**Activating a skill:**

```bash
zspec use frontend-design
# Prints an activation prompt to paste into your AI assistant
```

**Creating a custom skill:**

```bash
mkdir -p skills/my-skill
cat > skills/my-skill/SKILL.md << 'EOF'
# my-skill

Purpose: describe what this skill does.

Rules:
- rule one
- rule two
EOF
```

---

## npm scripts

`zspec init` injects the following scripts into your `package.json` (non-destructive unless `--force`):

| Script | Command |
|--------|---------|
| `spec:new` | `node gsd/run.mjs spec:new` |
| `spec:list` | `node gsd/run.mjs spec:list` |
| `spec:init` | `node gsd/run.mjs spec:init` |
| `spec:add-plan` | `node gsd/run.mjs spec:add-plan` |
| `spec:add-tasks` | `node gsd/run.mjs spec:add-tasks` |
| `spec:commit` | `node gsd/run.mjs spec:commit` |
| `spec:done` | `node gsd/run.mjs spec:done` |
| `spec:reject` | `node gsd/run.mjs spec:reject` |
| `gsd:repo` | `node gsd/run.mjs repo:summary` |
| `gsd:diff` | `node gsd/run.mjs git:diff-summary` |
| `gsd:plan` | `node gsd/run.mjs spec:plan` |
| `gsd:pr` | `node gsd/run.mjs git:pr-body` |
| `gsd:check` | `node gsd/run.mjs checks:all` |

Usage:

```bash
npm run spec:new -- "my feature"
npm run spec:list
npm run gsd:repo
```

---

## Contributing

1. Fork the repo and create a feature branch.
2. Run `zspec init` in a temp directory to smoke-test your changes.
3. Run tests: `npm test`
4. Submit a PR with a filled-out PR template.

---

## License

MIT
