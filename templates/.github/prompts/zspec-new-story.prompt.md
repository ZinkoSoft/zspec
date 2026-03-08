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

1. Ask the user for the story name only if nothing was provided.
2. Create the story by running the CLI command first:
   - Preferred: `zspec story "<story name>"`
   - Fallback: `npx zspec story "<story name>"`
3. Do not re-implement numbering or git logic in this prompt.
   - `zspec story` already handles git init, branch selection, and `NNNN-<slug>` auto-incrementing.
4. Read the created `.zspec/stories/<story-slug>/` files and continue from there.

## Phase 1 - Fill in story content with Serena

1. Work with these four files under `.zspec/stories/<story-slug>/`:

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

2. Research the codebase using Serena tools (`find_symbol`, `get_symbols_overview`, `search_for_pattern`) to understand relevant systems.
3. Fill these sections in `story.md` using `replace_symbol_body`:
   - `## User Story` — role, action, business value
   - `## Acceptance Criteria` — at least 3 concrete, testable criteria
   - `## Business Goal` — outcome and value delivered
4. Fill `context.md` sections with codebase findings:
   - `## Relevant Systems`, `## Touched Modules`, `## Dependencies`, `## Architectural Notes`
5. Add story-specific tasks to `tasks.md` under `## Implementation Checklist`.
6. Note any open questions or risks in `notes.md`.
7. Remind the user to run `@codebase-mapper` to populate `.zspec/codebase/` shared docs.
