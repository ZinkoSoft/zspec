---
mode: agent
description: Scaffold a new zspec story with story.md, context.md, tasks.md, notes.md, and codebase/ docs.
tools:
  - run_in_terminal
  - read_file
  - list_dir
---

# New Story

Scaffold a new story using the `zspec` CLI.

## Instructions

1. Ask the user for the story name if not already provided.
2. Run the following command in the terminal:

```
npx zspec story "<story-name>"
```

3. Open `.zspec/stories/<story-slug>/story.md` and help the user fill in:
   - **User Story**: the role, action, and business value
   - **Acceptance Criteria**: concrete, testable criteria (at least 3)
4. Remind the user to run `@codebase-mapper` next to populate the `codebase/` docs.

## Output

A fully scaffolded story directory at `.zspec/stories/<story-slug>/` containing:

- `story.md` — user story and acceptance criteria
- `context.md` — relevant systems and architectural notes
- `tasks.md` — implementation and review checklists
- `notes.md` — decisions, tradeoffs, and risks
- `codebase/` — STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS
