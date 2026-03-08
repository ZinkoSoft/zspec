---
mode: agent
description: Scaffold a new zspec story with story.md, context.md, tasks.md, notes.md.
tools:
  - create_file
  - mcp_oraios_serena_find_symbol
  - mcp_oraios_serena_replace_symbol_body
  - read_file
  - list_dir
  - run_in_terminal
---

# New Story

Scaffold a new story in two phases: create via CLI (source of truth), then fill in content using Serena's symbol tools.

## Phase 0 - Create story via CLI (required)

1. Do not ask the user for a story name.
2. Generate a short story name automatically from available context (request text, current work, or most relevant code area), then normalize it to a slug base.
3. Resolve the exact next story slug from the zspec binary first:
   - Preferred: `zspec story-next "<generated short story name>"`
   - Fallback: `npx zspec story-next "<generated short story name>"`
4. Target story slug format must be `NNNN-<generated-short-story-name>`.
5. Create the story via CLI using the generated short story name:
   - Preferred: `zspec story "<generated short story name>"`
   - Fallback: `npx zspec story "<generated short story name>"`
   - `zspec story` handles git init, branch creation (`git checkout -b <NNNN-slug>`), and `NNNN-<slug>` auto-incrementing automatically.
6. If terminal tools are unavailable or command execution is blocked, do not stop and do not ask the user to change settings. Instead, continue with an in-prompt fallback:
   - Compute next story number by scanning `.zspec/stories/` directories that match `^\d{4}-`.
   - Create `<story-slug>` as `NNNN-<normalized-name-slug>`.
   - Create a git branch for the story first by running `git checkout -b <story-slug>` via `run_in_terminal`. If that also fails, note in `notes.md` that git branch creation was skipped due to unavailable terminal tools.
   - Create `.zspec/stories/<story-slug>/story.md`, `context.md`, `tasks.md`, `notes.md` directly with `create_file`.
   - Create `.zspec/stories/<story-slug>/codebase/` stub files: `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md` — each with a placeholder comment `<!-- Run @codebase-mapper to populate this file. -->`.
7. Do not re-implement numbering or git logic when CLI execution succeeds.
   - `zspec story` already handles git init, branch selection, and `NNNN-<slug>` auto-incrementing.
8. Read the created `.zspec/stories/<story-slug>/` files and continue from there.

## Phase 1 - Fill in story content with Serena

1. Work with these four files under `.zspec/stories/<story-slug>/`:
2. Load shared codebase context before writing story content:
   - Read `.zspec/codebase/*.md` (for example: `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`).
   - If the folder is missing or mostly empty, note that context is incomplete and continue with explicit assumptions.

**`.zspec/stories/<story-slug>/story.md`**
```markdown
# <TITLE>

- **Story slug**: `<story-slug>`
- **Date**: <DATE>
- **Status**: draft

## User Story

> As a **[role]**, I want to **[action]** so that **[business value]**.

## Business Goal

<!-- What outcome does this deliver? -->

## Acceptance Criteria

- [ ] <!-- Criterion 1 -->
- [ ] <!-- Criterion 2 -->
- [ ] <!-- Criterion 3 -->

## Constraints

<!-- Technical, performance, security, or timeline constraints -->

## Assumptions

<!-- Things we're treating as true without full confirmation -->

## Scope Notes

<!-- What's explicitly out of scope for this story? -->
```

**`.zspec/stories/<story-slug>/context.md`**
```markdown
# Context: <TITLE>

## Relevant Systems

<!-- Which services, modules, or subsystems does this story touch? -->

## Touched Modules

<!-- List the specific files or directories most relevant to this story -->

## Dependencies

<!-- Internal modules and external services this story depends on -->

## Related Integrations

<!-- Third-party APIs, auth providers, queues, or storage involved -->

## Architectural Notes

<!-- Key architectural decisions or constraints relevant to this story. -->
```

**`.zspec/stories/<story-slug>/tasks.md`**
```markdown
# Tasks: <TITLE>

## Implementation Checklist

- [ ] Run `@codebase-mapper` to populate `codebase/` before starting
- [ ] Review `codebase/CONCERNS.md` for risks before writing code

## Testing Checklist

- [ ] Unit tests for new or changed logic
- [ ] Integration tests for affected API or data paths
- [ ] Edge cases documented and covered

## Review Checklist

- [ ] All acceptance criteria from `story.md` are met
- [ ] No unrelated code changed
- [ ] Lint and tests pass
- [ ] `tasks.md` updated with completed items
- [ ] `notes.md` updated with decisions and tradeoffs

## Follow-up Items

<!-- Things deferred to a future story or tech-debt backlog -->
```

**`.zspec/stories/<story-slug>/notes.md`**
```markdown
# Notes: <TITLE>

## Open Questions

<!-- Questions that must be resolved before or during implementation -->

## Decisions

<!-- Record decisions made during this story with brief rationale -->

## Tradeoffs

<!-- What did we trade away to keep this story simple or fast? -->

## Risks

<!-- Implementation risks identified. Cross-reference CONCERNS.md for
     codebase-level risks; record story-specific risks here. -->

## Implementation Notes
```

Once the files exist, use **`mcp_oraios_serena_replace_symbol_body`** to write content into each section. Markdown headings (`##`, `###`) are symbols - use `find_symbol` to locate them by name path, then `replace_symbol_body` to overwrite the section body.

3. Research the codebase using Serena tools (`find_symbol`, `get_symbols_overview`, `search_for_pattern`) to understand relevant systems.
4. Fill these sections in `story.md` using `replace_symbol_body`:
   - `## User Story` — role, action, business value
   - `## Acceptance Criteria` — at least 3 concrete, testable criteria
   - `## Business Goal` — outcome and value delivered
5. Fill `context.md` sections with codebase findings from both `.zspec/codebase/*.md` and repository inspection:
   - `## Relevant Systems`, `## Touched Modules`, `## Dependencies`, `## Architectural Notes`
6. Add story-specific tasks to `tasks.md` under `## Implementation Checklist`.
7. Note any open questions or risks in `notes.md`.
8. Remind the user to run `@codebase-mapper` to populate or refresh `.zspec/codebase/` shared docs when needed.
