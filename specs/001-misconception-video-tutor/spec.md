# Feature Specification: Misconception-to-Video Tutor (Databases 2)

**Feature Branch**: `001-misconception-video-tutor`
**Created**: 2026-11-14
**Status**: Draft
**Input**: User description: "Misconception-to-video tutor for PoliMi Databases 2: topic map with past-exam importance, short check with mandatory reasoning, misconception diagnosis with citations, targeted narrated and captioned animated explanation, re-check question, independent AI judge on all generated content, demo fallbacks, error history private to the student."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Diagnose, explain visually, re-check (Priority: P1)

A Databases 2 student studying alone before the exam picks a topic (for example, concurrency
control: view- and conflict-serializability). They answer a short check. For each question they
choose an answer and write one sentence explaining their reasoning; only then is the result shown.
When they get one wrong, the tutor names the specific misconception behind the mistake (for
example, "you treat any two operations on the same object as a conflict, but two reads never
conflict"), cites the course source (file and page), and offers a short narrated, captioned
animation that explains that concept. After watching, the student gets a new question on the same
concept. Solving it marks the gap as closed.

**Why this priority**: this loop is the product. Without it there is no demo and no idea to pitch.

**Independent Test**: on a prepared topic, a tester answers one question wrong with a typical
mistaken reasoning, receives a cited diagnosis and a targeted video, answers the new question
correctly, and sees the concept marked as closed.

**Acceptance Scenarios**:

1. **Given** a student on a check question, **When** they select an answer without writing a
   reasoning sentence, **Then** the answer is not submitted and the correct answer is not revealed.
2. **Given** a submitted wrong answer with reasoning, **When** the tutor responds, **Then** it shows
   a diagnosis naming the misunderstood concept, with at least one citation (file + page) from the
   course material.
3. **Given** a diagnosis, **When** the student opens the explanation, **Then** a 30–90 second video
   with narration and captions plays, explains the concept, and does not state the answer to the
   original question.
4. **Given** the video has been offered, **When** the student continues, **Then** they receive a new
   question on the same concept that differs from the original question.
5. **Given** a correct answer to the re-check question, **When** it is submitted, **Then** the
   concept's status changes from "gap" to "closed" in the student's progress.
6. **Given** a wrong answer to the re-check question, **When** it is submitted, **Then** the concept
   stays a gap and the tutor offers another diagnosis cycle.

---

### User Story 2 - Trustworthy content: citations and AI jury (Priority: P1)

Every diagnosis, question and explanation the student sees is grounded in the course material and
has been checked by an independent AI reviewer before it is shown. The student can open any
citation and see the exact passage it came from. In the demo, the team can show the reviewer's
verdict and reason for each item.

**Why this priority**: hallucination is the main risk the judges will raise; this is the team's
answer to it and part of the Level 1 risk argument.

**Independent Test**: generate a diagnosis, question and explanation script for a prepared
mistake; confirm each carries citations that resolve to real passages and a recorded reviewer
verdict; inject a deliberately wrong or answer-leaking item and confirm it is blocked.

**Acceptance Scenarios**:

1. **Given** any generated item, **When** it is displayed, **Then** it shows at least one citation
   (source file + page or section) that opens the matching passage.
2. **Given** a generated item that contradicts its cited passage or reveals the answer to the
   original question, **When** the reviewer checks it, **Then** it is rejected and regenerated once.
3. **Given** an item rejected twice, **When** generation ends, **Then** it is withheld from the
   student, the student sees a neutral message and a fallback, and the item is flagged in a review
   log.
4. **Given** a student question the material does not support, **When** the tutor answers, **Then**
   it says the course material does not cover it instead of answering from general knowledge.

---

### User Story 3 - Topic map with exam importance (Priority: P2)

Before starting, the student sees the course topics, each with an importance tag based on how often
the topic appeared in past exams (2022–2026), and their own status per concept (not started, gap,
closed).

**Why this priority**: helps the student choose where to spend time, but the core loop works
without it.

**Independent Test**: open the topic map, confirm every topic shows an importance tag with the
number of past exams it appeared in, and that a concept closed in Story 1 shows as closed.

**Acceptance Scenarios**:

1. **Given** the indexed past exams, **When** the topic map loads, **Then** each topic shows an
   importance level (high / medium / low) and the count of past exams that include it.
2. **Given** the student closed a gap, **When** they return to the topic map, **Then** that concept
   shows as closed.

---

### User Story 4 - Demo-safe fallback (Priority: P2)

During the live pitch, if generating a video or question is slow or fails, the presenter switches
instantly to a pre-generated version of the same step without breaking the flow.

**Why this priority**: protects the demo, which carries the presentation score.

**Independent Test**: disconnect the network or force a generation failure mid-loop and confirm
the loop completes using fallbacks.

**Acceptance Scenarios**:

1. **Given** a live generation exceeds the wait limit or fails, **When** the limit is reached,
   **Then** the pre-generated item for that step is shown and labelled as cached.
2. **Given** no network, **When** the presenter runs the prepared demo path, **Then** the full loop
   completes from cached content.

---

### Edge Cases

- The student's answer is correct but the reasoning is wrong: the tutor still diagnoses the
  misconception in the reasoning.
- The student writes reasoning that is empty, off-topic or one word: the tutor asks for a real
  sentence before scoring.
- The wrong answer matches no known misconception: the tutor gives a cited concept explanation and
  says it could not identify a specific misconception.
- The student asks the tutor to just give the answer: it declines and offers a hint or the
  explanation video instead (boundary example for the deliverables).
- Course material is missing or not indexed for a topic: the topic is not offered in the map.
- Video generation succeeds but narration or captions fail: the video is not shown without
  captions; fallback is used.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST index the provided Databases 2 material (slides, exercises, past exams)
  so passages can be retrieved with their source file and page.
- **FR-002**: System MUST present a topic map derived from the indexed material, with an importance
  level per topic computed from the number of past exams containing it.
- **FR-003**: System MUST provide a short check of about 5 questions per topic, grounded in the
  course material and past exams.
- **FR-004**: System MUST require an answer plus a written reasoning sentence before scoring a
  question, and MUST NOT reveal the correct answer before that.
- **FR-005**: System MUST diagnose a wrong answer (or wrong reasoning) as a named misconception and
  cite at least one supporting passage.
- **FR-006**: System MUST produce a 30–90 second animated explanation with voiceover and captions,
  targeted at the diagnosed misconception, that explains the concept without stating the answer to
  the original question.
- **FR-007**: System MUST follow every explanation with a new question on the same concept, and mark
  the concept closed only when that question is answered correctly.
- **FR-008**: System MUST submit every generated diagnosis, question and explanation script to an
  independent AI reviewer that checks correctness against the cited passages, faithfulness, and
  answer leakage.
- **FR-009**: System MUST regenerate a rejected item once and, if rejected again, withhold it, show
  a fallback, and record it in a review log with the reviewer's reason.
- **FR-010**: System MUST refuse to answer from general knowledge when the material has no
  supporting passage, and say so.
- **FR-011**: System MUST decline requests to reveal answers and offer a hint or explanation
  instead.
- **FR-012**: System MUST keep per-concept progress (not started, gap, closed) and the student's
  error history on the student's side only; nothing is sent to lecturers.
- **FR-013**: System MUST have a pre-generated fallback for each live generation step of the demo
  path and switch to it on failure or timeout.
- **FR-014**: Every video MUST include narration and captions.

### Key Entities

- **Source passage**: a piece of course material with its file, page/section and text.
- **Topic / Concept**: a course topic and its concepts, with past-exam count and importance level.
- **Question**: prompt, options or expected answer, concept, cited passages, origin (past exam or
  generated).
- **Attempt**: the student's answer, reasoning sentence, correctness, timestamp.
- **Misconception diagnosis**: named broken idea, explanation, cited passages, reviewer verdict.
- **Explanation video**: script, narration, captions, linked misconception, reviewer verdict,
  cached or live.
- **Review record**: item reviewed, verdict, reason, attempt number.
- **Concept progress**: per student and concept: not started, gap, closed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student goes from a wrong answer to a playable targeted explanation in under
  2 minutes (live) or under 5 seconds (cached).
- **SC-002**: 100% of items shown to the student carry at least one citation that opens a real
  passage.
- **SC-003**: In a test set of deliberately wrong or answer-leaking items, the reviewer blocks at
  least 90%.
- **SC-004**: In a test with 3+ users, at least 70% answer the re-check question correctly after
  watching the explanation, versus their first attempt.
- **SC-005**: Students rate "I now understand why I was wrong" at 4/5 or higher on average.
- **SC-006**: The full demo loop completes with no network using cached content.

## Assumptions

- Single student per device; no login for the prototype.
- Questions are multiple choice plus a free-text reasoning sentence.
- The demo path uses concurrency control (serializability / 2PL) from Databases 2, which animates
  well (schedules as timelines).
- Course material is the team's own copy of the PoliMi Databases 2 slides, exercises and past
  exams, used for a non-commercial hackathon demo.
- English is the interface and content language.
- Out of scope: professor portal, personal notes, timed exams, oral exam simulation, full
  curriculum overview.
