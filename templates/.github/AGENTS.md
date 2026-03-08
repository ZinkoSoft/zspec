# Agent Operating Manual

This repo uses a **story-driven, spec-first, small-diff** workflow built on
`.zspec` stories and GitHub Copilot custom agents.

---

## Workflows

### `.zspec` Story Workflow (primary)

Stories live in `.zspec/stories/<story-slug>/`. Use this workflow for
feature work organized by user story with Copilot agent support.

1. **Create a story**: `zspec story "<story name>"`
2. **Analyze the codebase**: Use `@codebase-mapper` in Copilot Chat
3. **Implement**: Follow `tasks.md`, reference `.zspec/codebase/` docs
4. **Log decisions**: Update `notes.md` as you go

### zspec Workflow (existing)

For ad-hoc features or teams using the older spec-per-feature approach:

1. **Create a spec**: `zspec new "<feature name>"`
2. **Follow the zspec loop** (below)
3. **Log progress**: Append to `.zspec/logs/progress.md`

---

## zspec Default Loop

1. **Load context** — read the active spec(s) and `.zspec/memory/constitution.md`
2. **Ask bounded questions** — at most 7 critical questions; proceed with
   explicit assumptions if info is missing
3. **Plan** — 3–7 PR-sized steps (small, reviewable, easy rollback)
4. **Execute** — prefer Serena MCP tools for symbol lookup and safe edits
5. **Verify** — run tests, lint, typecheck; provide manual plan if unavailable
6. **Log** — append to `.zspec/logs/progress.md`: what changed, how to verify,
   any risks

---

## Copilot Custom Agents

Agents live in `.github/agents/`. Use them in Copilot Chat with `@agent-name`.

### User-Invocable Agents

| Agent | Purpose |
|-------|---------|
| `@codebase-mapper` | Orchestrates full codebase analysis for a story |
| `@stack-mapper` | Analyzes technology stack and integrations |
| `@arch-mapper` | Analyzes architecture and file structure |
| `@quality-mapper` | Analyzes conventions and testing patterns |
| `@concerns-mapper` | Identifies technical concerns and risks |

### Ownership Map

| Output File | Owned By |
|-------------|----------|
| `.zspec/codebase/STACK.md` | `@stack-mapper` |
| `.zspec/codebase/INTEGRATIONS.md` | `@stack-mapper` |
| `.zspec/codebase/ARCHITECTURE.md` | `@arch-mapper` |
| `.zspec/codebase/STRUCTURE.md` | `@arch-mapper` |
| `.zspec/codebase/CONVENTIONS.md` | `@quality-mapper` |
| `.zspec/codebase/TESTING.md` | `@quality-mapper` |
| `.zspec/codebase/CONCERNS.md` | `@concerns-mapper` |

### Orchestration Pattern

The `@codebase-mapper` agent delegates to the four mapper agents as subagents:

```
@codebase-mapper
  → @stack-mapper     → STACK.md, INTEGRATIONS.md
  → @arch-mapper      → ARCHITECTURE.md, STRUCTURE.md
  → @quality-mapper   → CONVENTIONS.md, TESTING.md
  → @concerns-mapper  → CONCERNS.md
```

Each agent owns its domain. Do not duplicate content across files.
Cross-reference instead.

---

## Story Structure

```
.zspec/stories/<story-slug>/
├── story.md          ← title, user story, acceptance criteria, constraints
├── context.md        ← story-specific notes; references .zspec/codebase/ for shared context
├── tasks.md          ← implementation, testing, and review checklists
└── notes.md          ← decisions, tradeoffs, risks, open questions

.zspec/codebase/          ← shared repo context (run /zspec-map-codebase to populate)
├── STACK.md            ← languages, frameworks, build tooling
├── INTEGRATIONS.md     ← APIs, databases, queues, auth, observability
├── ARCHITECTURE.md     ← layers, components, patterns, data flow
├── STRUCTURE.md        ← file/folder layout, naming, where to add files
├── CONVENTIONS.md      ← code style, naming, error handling, lint/format
├── TESTING.md          ← test framework, locations, mocking, coverage
└── CONCERNS.md         ← technical debt, risks, missing tests, security
```

---

## Engineering Principles

- **YAGNI** — build only what is needed for the current story
- **KISS** — prefer the simplest solution that meets acceptance criteria
- **Low cyclomatic complexity** — extract helpers when logic branches > 3–4
- **Readability** — code is read far more than it is written
- **Consistency** — follow existing patterns before introducing new ones
- **Maintainability** — leave the codebase easier to change than you found it

---

## Serena MCP (optional)

If MCP tools are available, prefer Serena for:
- symbol search and navigation
- file edits with guardrails
- safe refactors

Repo includes `.zspec/mcp/serena.json` and `.zspec/scripts/serena.mjs`.

---

## Skills

Skills live in `.zspec/skills/`. When a task matches a skill, apply it as constraints.

- UI/component/layout work: `.zspec/skills/frontend-design`

