---
mode: agent
description: Implement a story end-to-end: read story docs, ask blocking questions, produce an implementation plan, then implement Step 1 as a small reviewable diff.
tools:
  - read_file
  - list_dir
  - search_files
  - mcp_oraios_serena_find_symbol
  - mcp_oraios_serena_get_symbols_overview
  - mcp_oraios_serena_replace_symbol_body
  - mcp_oraios_serena_insert_after_symbol
  - edit_file
  - run_in_terminal
---

# Implement Story

Drive end-to-end implementation of a `.zspec` story following the project's engineering principles.

## Instructions

1. Resolve the story slug automatically before asking the user:
    - If terminal tools are available:
       - Run `git rev-parse --is-inside-work-tree`.
       - If that fails, run `git init` and continue.
       - Get current branch with `git branch --show-current`.
       - If current branch matches `^\d{4}-[a-z0-9][a-z0-9-]*$` and `.zspec/stories/<branch>/` exists, use it.
       - If branch does not map to a story directory, derive candidate slug from zspec binary:
          - Preferred: `zspec story-next "<generated short story name>"`
          - Fallback: `npx zspec story-next "<generated short story name>"`
          - If that candidate story exists in `.zspec/stories/`, use it; otherwise fall back to latest numbered existing story.
    - If terminal tools are unavailable or branch lookup fails, scan `.zspec/stories/` for directories matching `^\d{4}-` and select the highest numeric prefix.
    - This should mirror `zspec story` numbering semantics.
    - If no numbered story exists, ask the user for a story name and create one via `/zspec-new-story` first.
2. Read the story documents in order:
   - `.zspec/stories/<story-slug>/story.md` — user story and acceptance criteria
   - `.zspec/stories/<story-slug>/context.md` — relevant systems and architectural notes
   - `.zspec/stories/<story-slug>/tasks.md` — implementation checklist
   - `.zspec/stories/<story-slug>/notes.md` — open questions, decisions, risks
   - `.zspec/stories/<story-slug>/codebase/` — STACK, ARCHITECTURE, CONVENTIONS, TESTING, CONCERNS
3. Also read `AGENTS.md` and `.github/copilot-instructions.md` for project-level rules.
4. Ask at most **7 critical questions** — only questions that are truly blocking. State explicit assumptions for everything else.
5. Produce a short **implementation plan** (3-7 numbered steps).
6. Implement **Step 1** as a small, focused, reviewable diff.
   - **Prefer Serena MCP tools** for all code edits: use `replace_symbol_body` to replace a function/method/class, `insert_after_symbol` to add new code after an existing symbol. Use `edit_file` only as a fallback when the change doesn't map cleanly to a symbol.
7. After changes:
   - Run available checks (tests, lint, typecheck)
   - Update `tasks.md` to mark completed items
   - Record any decisions or tradeoffs in `notes.md`

## Engineering Principles

- **YAGNI** — build only what is needed for the current story
- **KISS** — prefer the simplest solution that meets acceptance criteria
- **Readability first** — code is read far more than it is written
- **Consistency** — follow existing patterns before introducing new ones

## Output

Step 1 implemented as a diff, checks passing, and `tasks.md` updated.
