---
mode: agent
description: Generate a pull request description summarizing the changes in this branch against main/master, referencing the relevant spec or story.
tools:
  - run_in_terminal
  - read_file
  - list_dir
  - search_files
---

# PR Description

Generate a clear, structured pull request description for the current branch.

## Instructions

1. Run `git log --oneline main..HEAD` (or `master..HEAD`) to list the commits in this branch.
2. Run `git diff --stat main..HEAD` to see which files changed.
   - If terminal is not available, ask the user to paste the output of those two commands before continuing.
3. Look for a related spec in `specs/` (match by branch name or slug) or a story in `.zspec/stories/`.
4. Read the spec (`spec.md`) or story (`story.md`) to understand the intent.
5. Read `.github/pull_request_template.md` if it exists and use it as the output structure.
6. Generate a pull request description that includes:
   - **What**: a one-sentence summary of the change
   - **Why**: the problem or user story this solves (link to spec/story)
   - **How**: a brief description of the implementation approach
   - **Testing**: how the change was verified (tests run, manual checks)
   - **Checklist**: standard items (tests pass, lint clean, docs updated if needed)

## Output

A pull request description ready to paste into GitHub, structured and concise.
