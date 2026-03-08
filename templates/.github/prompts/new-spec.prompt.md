---
mode: agent
description: Create a new speckit-style spec directory (specs/NNNN-slug/) with spec.md and optionally plan.md and tasks.md.
tools:
  - run_in_terminal
  - read_file
  - edit_file
---

# New Spec

Create a new feature spec using the `zspec` CLI.

## Instructions

1. Ask for the feature name if not already provided.
2. Run the following command in the terminal:

```
npx zspec new "<feature-name>"
```

3. Open the created `specs/NNNN-<slug>/spec.md` and help the user complete:
   - **Problem**: what problem does this feature solve?
   - **Goal**: what is the desired outcome?
   - **Non-goals**: what is explicitly out of scope?
   - **Acceptance criteria**: specific, testable conditions for done (at least 3)
   - **Risks / unknowns**: what could go wrong or needs investigation?

4. Once `spec.md` is complete, optionally scaffold `plan.md` with a technical implementation plan (3–7 steps) and `tasks.md` with a detailed task breakdown.

## Output

A fully filled-in spec at `specs/NNNN-<slug>/spec.md`, and optionally `plan.md` and `tasks.md` in the same directory.
