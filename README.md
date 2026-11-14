# AI on Campus · Reply Student Tech Clash 2026

Our team's repo for **AI on Campus**, the 2026 edition of Reply's [Student Tech Clash](https://studentclash.reply.com/) hackathon (Politecnico di Milano team).

## The event

Student Tech Clash is Reply's hackathon for university students. The schedule runs from the opening and case-study reveal, through hacking time with mentors, to a final pitch.

**Theme:** how AI can change education, training and learning. Pick a real problem that students or teachers face in learning or teaching at the university, then design and build an AI-based solution for it. Start with the problem, not the tool.

**Out of scope:** administration and logistics, such as enrolment, fees, timetables, room booking, campus services or transport. The problem must be about how students learn, how teachers teach, or how learning is assessed.

## Assignments

| Level | Status | What |
|-------|--------|------|
| 1 · Design | Required | Pick a real problem, design an AI-based solution, pitch it in 60 seconds |
| 2 · Build | Required | Build a working AI agent prototype |
| 3 · Extra | Optional (bonus) | Multi-agent system, knowledge graph and/or launch campaign |

You can win with Levels 1 and 2 alone. A strong idea and a great working prototype matter most.

### Level 1 · Design (required)

Choose a problem in one of three suggested directions, or bring another one:

- **Teaching:** understanding what students haven't grasped, adapting explanations, creating materials for diverse learners, without replacing human judgement.
  - Examples: after-class Q&A on lecture content; turning last year's slides into a first draft of the updated course; a 24/7 digital twin of the lecturer.
- **Learning:** understanding mistakes, building resilient mental models, knowing what you truly know.
  - Examples: practice questions that adapt to what you keep getting wrong; an oral exam simulator that pushes back on shaky reasoning.
- **Assessment:** revealing what students actually know, not what they can find or generate.
  - Examples: essay feedback that explains *why* an argument fails; a pre-exam readiness check that shows which gaps still matter.

Tips:
- Start from your own experience: a course where you got stuck, an exam you under-prepared for.
- Be specific: one course, one exam, one moment.
- Ask whether it would still work without AI. If yes, you probably don't need AI. If no, make that argument.
- Name the risks: who owns the student data, what happens if the tool goes down the night before an exam, which students lack reliable access.

### Level 2 · Build (required)

Build a working AI agent that demonstrates the core of the Level 1 solution. Unlike a simple chatbot, the agent must:

1. **Work with real material:** lecture notes, slides, syllabus, exam rules or past exercises, not just what the model already knows.
2. **Do something, not just say something:** take at least one action beyond replying, such as generating and scoring a quiz, tracking recurring mistakes, creating a study plan or calendar entry, or flagging a question for the lecturer.
3. **Know its limits:** help someone think without thinking for them. A tutor that guides instead of giving the answer; feedback that explains instead of rewriting.

Two paths, pick one:
- **Path A, no code / low code:** assemble the agent with ready-made AI tools. Write its instructions like a spec, with sections for ROLE, GOAL, KNOWLEDGE, RULES, PROCEDURE and MEMORY.
- **Path B, coding:** any language, any model.

Deliverables:
- [ ] Agent instructions (prompt or configuration), with a short note on the key design choices
- [ ] Description of the material the agent uses and the action(s) it can take
- [ ] Example interactions with different users and situations, including one where the agent holds its boundary
- [ ] Screenshots or an export of the agent's setup or workflow
- [ ] (Optional, recommended) Short demo video of a live interaction

Tips: build one core flow well rather than many features poorly. Use pre-trained models and existing frameworks; there's no time to train anything.

### Level 3 · Extra (optional)

Three independent paths. Do one, several or a partial one; everything counts toward evaluation.

- **Path A, multi-agent system:** extend the Problem Identifier Agent into a multi-agent workflow.
  - *Problem Identifier Agent:* interviews the user with adaptive follow-ups and produces a structured Problem Brief.
  - *Two or more Solver Agents* with distinct roles (for example learning design, technical feasibility, inclusion/risk/governance). They all receive the same brief.
  - *Independent proposals:* each covers approach, user value, required information or tools, risks, assumptions and implementation considerations.
  - *Orchestration and selection:* proposals are compared, combined or selected by an orchestrator or evaluator agent, transparent criteria or a human decision, with an explanation of why the final pick fits the problem.
  - *Clarification loop:* a solver returns targeted questions when the brief is incomplete, conflicting or vague.
  - *Human review:* a person validates the problem, reviews alternatives, approves the recommendation or stops the workflow. Assumptions and uncertainty stay visible.
- **Path B, knowledge graph:** ground the agent in a graph of courses, concepts and criteria so every answer can be explained.
- **Path C, launch campaign:** name, tagline, channels and timing to get the tool adopted at the university.

## Evaluation

Judges apply three questions at every level:

1. **Is this genuinely new, or just faster?** Speeding up an existing process is interesting; changing what's possible is the goal.
2. **Does this help someone think, or does it think for them?** Know which side of the line the idea is on.
3. **Who benefits, and who might be left out?** Every design choice includes someone and excludes someone else.

### Criteria

| Criterion | Weight |
|-----------|--------|
| Creativity & Innovation | 40% |
| Impact | 20% |
| Technical | 20% |
| Effective Presentation | 20% |

### How to present

1. **Stage 1, every team: 60-second elevator pitch.** No slides. Cover the problem (who experiences it and when), the AI-based solution, and its impact. When the minute is up, listeners should be able to repeat the idea in their own words. Be ready to defend your choices.
2. **Stage 2, top 3 teams only: slide presentation, 5 minutes max.** Problem, idea, how it works, impact. Be ready to defend your choices.

## Hand-in checklist

The presentation is required. If possible, also share the materials produced (agent, documents, prototype files).

**Level 1 · Pitch slides**
- [ ] Problem: what it is and who experiences it
- [ ] Idea: the AI solution in plain language
- [ ] Use scenario in a real moment
- [ ] Target user and context
- [ ] Success measures
- [ ] 60-second pitch rehearsed

**Level 2 · Prototype**
- [ ] Agent instructions + note on key design choices
- [ ] Description of material and action(s)
- [ ] Screenshots or export of setup / workflow
- [ ] Demo video (optional)

## Team

| Name | Role |
|------|------|
| | |

## Workflow

Built with [Spec Kit](https://github.com/github/spec-kit) (spec-driven development):

1. `/speckit-constitution`: project principles
2. `/speckit-specify`: what we build and why
3. `/speckit-plan`: tech stack and architecture
4. `/speckit-tasks`: task breakdown
5. `/speckit-implement`: build it

## Draft app

- `worker/`: Python pipeline (PDF → outline → script, notes and quiz → AI jury → voiceover + captions → ManimGL video). Run: `conda run -n 3b1b python -m worker.pipeline <pdf> --max-sections 1` (`LLM_STUB=1` without an API key).
- `web/`: Next.js app (library, player with captions, transcript, AI notes and student notes, check with diagnosis). Run: `cd web && pnpm dev`.
- Config: copy `.env.example` to `.env.local` and set `OPENROUTER_API_KEY`.
