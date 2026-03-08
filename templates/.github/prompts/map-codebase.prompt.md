---
mode: agent
description: Analyze the codebase for a given story slug and populate the codebase/ docs (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS).
tools:
  - read_file
  - list_dir
  - search_files
  - run_in_terminal
---

# Map Codebase for Story

Analyze this repository and populate the `codebase/` documentation folder for a specific story.

## Instructions

1. Ask for the story slug (the folder name under `.zspec/stories/`) if not provided.
2. Read `.zspec/stories/<story-slug>/story.md` to understand the scope.
3. Delegate analysis to the specialized agents by invoking:
   - `@stack-mapper story-slug: <story-slug>` → writes `STACK.md` and `INTEGRATIONS.md`
   - `@arch-mapper story-slug: <story-slug>` → writes `ARCHITECTURE.md` and `STRUCTURE.md`
   - `@quality-mapper story-slug: <story-slug>` → writes `CONVENTIONS.md` and `TESTING.md`
   - `@concerns-mapper story-slug: <story-slug>` → writes `CONCERNS.md`
4. After all agents complete, update `.zspec/stories/<story-slug>/context.md` with a summary of:
   - The key systems and modules touched by this story
   - The most important architectural decisions
   - Any concerns or risks identified

## Output

All seven codebase docs populated in `.zspec/stories/<story-slug>/codebase/` and an updated `context.md`.
