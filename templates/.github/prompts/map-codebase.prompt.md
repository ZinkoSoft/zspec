---
mode: agent
description: Analyze the repository and populate shared codebase context docs in .zspec/codebase/ (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS). No story required.
tools:
  - read_file
  - list_dir
  - search_files
  - run_in_terminal
---

# Map Codebase

Analyze this repository and build shared codebase context in `.zspec/codebase/`.
Do not ask for a story slug — this is a repo-level analysis.

## Instructions

1. Scan the repository root: package files, lock files, config files, CI config, major directories.
2. Delegate analysis to the specialized agents by invoking each in turn:
   - `@stack-mapper` → writes `.zspec/codebase/STACK.md` and `INTEGRATIONS.md`
   - `@arch-mapper` → writes `.zspec/codebase/ARCHITECTURE.md` and `STRUCTURE.md`
   - `@quality-mapper` → writes `.zspec/codebase/CONVENTIONS.md` and `TESTING.md`
   - `@concerns-mapper` → writes `.zspec/codebase/CONCERNS.md`
3. Do not duplicate content across files — cross-reference instead.
4. When all seven files are written, print a one-paragraph summary of the key findings.

## Output

Seven files in `.zspec/codebase/`: `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`.
