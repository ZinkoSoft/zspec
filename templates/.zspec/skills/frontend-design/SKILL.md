# frontend-design (skill)

Purpose: generate **distinctive, production-grade** frontend UI code that avoids generic “AI default” design.

## When to activate
Use this skill when the task involves any of:
- UI/UX design, layout, styling, components, design systems
- building pages, flows, dashboards, landing pages
- visual polish, motion, typography, theming

## Core rules

1) **Pick a design direction before coding**
- Identify: purpose, audience, context of use.
- Choose a concrete aesthetic (examples: brutalist, editorial, retro-futurist, luxury minimal, playful maximal).
- Write a short “design brief” (3–6 bullets) before implementation.

2) **Avoid generic patterns**
- Avoid default gradients, default system fonts, cookie-cutter cards.
- Avoid “everything is rounded + purple + shadow + hero section” unless it truly fits.

3) **Use real, shippable code**
- Output runnable code (not pseudo-code).
- Handle empty/loading/error states.
- Respect accessibility basics: contrast, focus states, labels, keyboard nav.

4) **Typography and spacing are the UI’s physics**
- Use a deliberate type scale.
- Use consistent spacing and layout rhythm.
- Use constraints: max widths, grids, responsive breakpoints.

5) **Motion with restraint**
- Prefer subtle transitions and purposeful motion.
- No gratuitous 4-second animations.

6) **Make it inspectable**
- Document key tokens (colors, spacing, type) in comments or a small theme section.
- Include a quick manual verification checklist.

## Intake (bounded questions)
Ask only what you must. If missing, proceed with assumptions.
- Platform: web app? marketing? internal tool?
- Tech constraints: framework, UI lib, CSS approach.
- Brand constraints: colors, typography, tone.
- Target users and environment (desktop-heavy? mobile-first?).

## Deliverables
- A short design brief.
- A component/page implementation.
- A small note: how to run, how to verify, what’s next.

