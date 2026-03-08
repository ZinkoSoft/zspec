---
mode: agent
description: Create a new speckit-style spec directory (specs/NNNN-slug/) with spec.md and optionally plan.md and tasks.md.
tools:
  - create_file
  - mcp_oraios_serena_find_symbol
  - mcp_oraios_serena_replace_symbol_body
  - read_file
  - list_dir
  - run_in_terminal
---

# New Spec

Create a new feature spec in two phases: scaffold the file, then fill in content using Serena's symbol tools.

## Phase 1 — Scaffold spec file

1. Ask for the feature name if not already provided.
2. Derive the slug: lowercase, spaces and special characters replaced by `-`, max 60 chars.
3. Determine the next spec number: list `.zspec/specs/`, find the highest `NNNN-*` directory number, increment by 1, zero-pad to 4 digits. Start at `0001` if none exist.
4. Create `.zspec/specs/<NNNN>-<slug>/spec.md` using `create_file`:

```markdown
# <feature-name>

- ID: <NNNN>
- Date: <YYYY-MM-DD>
- Slug: <slug>

## Problem

<!-- What problem does this feature solve? -->

## Goal

<!-- What is the desired outcome? -->

## Non-goals

<!-- What is explicitly out of scope? -->

## Acceptance criteria

- [ ]

## Risks / unknowns

-
```

5. If `run_in_terminal` is available, also run `git checkout -b <NNNN>-<slug>` to create a feature branch.

## Phase 2 — Fill in spec content with Serena

Once the file exists, use **`mcp_oraios_serena_replace_symbol_body`** to write content into each section. Markdown headings (`##`) are symbols — use `find_symbol` to locate them by name path, then `replace_symbol_body` to overwrite the section body.

6. Help the user complete the following sections via `replace_symbol_body`:
   - `## Problem` — what problem does this feature solve?
   - `## Goal` — what is the desired outcome?
   - `## Non-goals` — what is explicitly out of scope?
   - `## Acceptance criteria` — specific, testable conditions for done (at least 3)
   - `## Risks / unknowns` — what could go wrong or needs investigation?
7. Once `spec.md` is complete, optionally scaffold `plan.md` with a technical implementation plan (3–7 steps) and `tasks.md` with a detailed task breakdown.

## Output

A fully filled-in spec at `specs/<NNNN>-<slug>/spec.md`, and optionally `plan.md` and `tasks.md` in the same directory.
