# Agent Operating Manual (GSD + Speckit)

This repo uses a **spec-first, small-diff** workflow.

## Default loop

1) **Load context**
- Read the active spec(s) in `specs/active/`.
- Read the Definition of Done in `gsd/checklists/definition-of-done.md`.
- Prefer running: `node gsd/run.mjs repo:summary` for quick repo context.

2) **Ask bounded questions (only if truly blocking)**
- Ask **at most 7** critical questions.
- If info is missing, proceed with explicit assumptions in the spec/log.

3) **Plan**
- Produce 3–7 steps.
- Each step should be **PR-sized** (small, reviewable, easy rollback).

4) **Execute**
- Prefer **Serena MCP tools** for symbol lookup, references, and edits when available.
- Make changes in small diffs.

5) **Verify**
- Run whatever checks exist (`tests`, `lint`, `typecheck`).
- If you cannot run checks, say why and provide a manual verification plan.

6) **Log**
- Append a short entry to `gsd/logs/progress.md` with:
  - what changed
  - how to verify
  - any risks/unknowns

## Serena-first (MCP)

If MCP tools are available, use Serena for:
- symbol search
- file navigation
- safe edits/refactors

Repo includes `mcp/serena.json` and `scripts/serena.mjs` as a starting point.

## Skills

Skills live in `skills/`. When a task matches a skill, apply it as constraints.

- UI/component/layout work: `skills/frontend-design`

