<!--
Sync Impact Report
- Version change: template → 1.0.0 (initial ratification)
- Principles: I. Grounded, Never Invented; II. AI as Jury; III. Help Thinking, Not Substitute;
  IV. One Core Loop; V. Demo-Safe; VI. Accessibility and Privacy; VII. Simplicity
- Added sections: Scope and Constraints, Development Workflow
- Removed sections: none
- Templates: no template edits (templates read the constitution at runtime)
- Deferred TODOs: none (product name still open, not a governance field)
-->

# AI on Campus Tutor Constitution

## Core Principles

### I. Grounded, Never Invented

- Every explanation, quiz item, diagnosis and video script MUST cite its source: file name plus
  page (slides, exams, exercises) or section, from the indexed Databases 2 course material.
- Retrieval works NotebookLM-style: answers are built from retrieved passages, not from model memory.
- A claim with no supporting passage MUST NOT be shown to the student; the system says it cannot
  answer from the course material instead.

Rationale: hallucination and source mismatch are the main risks of AI study tools. Citations let
the student and the lecturer check every statement.

### II. AI as Jury

- Generated content (misconception diagnosis, quiz items, video scripts) MUST pass an independent
  LLM judge before it reaches the student. The judge receives the content and its cited passages
  and checks correctness, faithfulness to sources, and that the answer is not leaked.
- Content that fails is regenerated once; if it fails again it is withheld and flagged.
- The judge verdict and reason are logged and viewable in the demo.

Rationale: a second, independent check catches errors the generator cannot see in its own output.

### III. Help Thinking, Not Substitute (NON-NEGOTIABLE)

- The system MUST NOT reveal a quiz answer before the student has attempted it and explained
  their reasoning.
- Targeted videos explain the misunderstood concept, never the solution of the specific question.
- A gap counts as closed only when the student solves a new question on the same concept.

Rationale: this is the line the judges evaluate ("does it help someone think, or think for them?").

### IV. One Core Loop

- The product is one loop: diagnose the misconception → generate a targeted visual explanation
  (ManimGL animation + voiceover + captions) → re-check with a new question.
- Features outside the loop (professor portal, notes, timed exams, oral exam simulation,
  curriculum overview) are out of scope for the build and appear only as vision in the pitch.

Rationale: the brief rewards one core flow done well over many features done poorly.

### V. Demo-Safe

- Every live generation step MUST have a pre-generated fallback (cached video, cached quiz) that
  the demo can switch to instantly.
- Generated outputs are cached and reusable offline.
- The full loop MUST run on the demo laptop before the pitch.

Rationale: a one-day prototype fails on stage from slow renders and network issues, not from ideas.

### VI. Accessibility and Privacy

- Every video ships with narration and captions (SRT).
- The student's error history stays with the student (local storage or the student's own
  session); nothing is shared with lecturers unless the student opts in.
- Only course material the user uploaded or provided is indexed.

Rationale: visual explanations must not exclude students with hearing or bandwidth limits, and
error history is sensitive learning data.

### VII. Simplicity

- Use the smallest stack that works. Reuse the existing pipeline (ManimGL scenes + Kokoro TTS +
  SRT captions) and patterns from the ds_live Next.js study app where they fit.
- No speculative abstractions, no features "for later", no model training.

Rationale: one day, one coding agent; every extra component is a demo risk.

## Scope and Constraints

- Event: Reply Student Tech Clash 2026, "AI on Campus" (Levels 1 and 2 required).
- Course for the prototype: Politecnico di Milano, Databases 2 (slides, exercises, ~30 past exams).
- Team: 4 people; implementation by one coding agent; deadline: end of work on the event day.
- Out of scope: university administration and logistics problems.

## Development Workflow

- Spec Kit flow: specify → clarify (only if blocking) → plan → tasks → implement, in one core-loop
  slice first.
- A demo of the loop must work end to end before any nice-to-have work starts.
- Every generated-content path is checked against Principles I–III before it is called done.

## Governance

This constitution overrides other practices for this repo. Amendments are made by the team in
conversation, recorded here with a version bump (MAJOR: principle removed or redefined; MINOR:
principle or section added; PATCH: wording). Specs, plans and tasks MUST state how they satisfy
Principles I–V; any deviation needs a written justification in the plan's complexity section.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
