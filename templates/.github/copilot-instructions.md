# GitHub Copilot Instructions

These instructions apply to all Copilot sessions in this repository.

## Workflow

This repo uses `.zspec` for story-driven development with specialized Copilot agents.

- Stories live in `.zspec/stories/<story-slug>/`
- Each story has `story.md`, `context.md`, `tasks.md`, `notes.md`, and a `codebase/` folder
- Run `zspec story "<story name>"` to create a new story scaffold
- Use the agents in `.github/agents/` to analyze and document the codebase per story

## Engineering Principles

- **YAGNI** — build only what is needed for the current story
- **KISS** — prefer the simplest solution that meets acceptance criteria
- **Low cyclomatic complexity** — break complex logic into small, named functions
- **Readability first** — code is read far more than it is written
- **Consistency** — follow existing project patterns before introducing new ones
- **Maintainability** — leave the codebase easier to change than you found it

## Code Change Rules

- Preserve existing architecture unless a change is clearly justified in `notes.md`
- Favor simple, maintainable solutions over clever or abstract ones
- Keep cyclomatic complexity low; extract helpers when a function grows beyond 3–4 logical branches
- Prefer consistency with the existing project patterns and naming conventions
- Create or update tests whenever code changes require them
- Avoid speculative abstractions — only generalize when you have two or more real use cases
- Document meaningful architectural decisions in `context.md` or `notes.md`
- Keep story outputs scoped to the relevant work; do not touch unrelated systems

## Story-Scoped Work

Before implementing anything:

1. Read the story in `.zspec/stories/<story-slug>/story.md`
2. Read `context.md` for relevant systems and architectural notes
3. Check `tasks.md` for the implementation checklist
4. Check `notes.md` for open questions, decisions, and risks

After implementing:

1. Update `tasks.md` to mark completed items
2. Record decisions and tradeoffs in `notes.md`
3. Update `context.md` if architectural understanding changed

## Clean Code

- **DRY** — Do not repeat yourself. Extract shared logic into well-named functions or classes
- **YAGNI** — Do not build features or abstractions that are not yet needed
- **KISS** — Keep solutions simple. Prefer straightforward implementations over clever ones
- **Single Responsibility** — Each class and function does one thing well
- **Separation of Concerns** — Controllers handle HTTP, services handle business logic, repositories handle data access. No layer bleeds into another
- **Clear Naming** — All method names, variable names, and class names must be self-documenting. A reader should understand purpose without needing comments
- **Clear Comments** — Only add comments where the *why* is not obvious from the code. Never comment the *what* — the code itself should express that. When a comment is needed, make it precise and useful
- **Small Functions** — Functions should do one thing. If a function needs a comment explaining what it does, it should be broken into smaller, well-named functions instead
- **No Magic Numbers** — Use named constants for all non-obvious values
- **Fail Fast** — Validate inputs early. Return or throw at the top of functions rather than nesting deeply

## Test-Driven Development

- Write tests alongside implementation, not as an afterthought
- Each new feature or bugfix must include corresponding tests
- Security-critical behavior requires dedicated security tests
- Use descriptive test names that read as specifications (e.g., `shouldRejectTokenWhenUsedFromDifferentIpAddress`)
- Keep tests independent — no shared mutable state between tests
- Prefer real dependencies via TestContainers over mocks for integration tests

## Agent Usage

Use the agents in `.github/agents/` for codebase analysis:

- `@codebase-mapper` — orchestrates full codebase analysis for a story
- `@stack-mapper` — analyzes technology stack and integrations
- `@arch-mapper` — analyzes architecture and structure
- `@quality-mapper` — analyzes conventions and testing patterns
- `@concerns-mapper` — identifies technical concerns and risks
