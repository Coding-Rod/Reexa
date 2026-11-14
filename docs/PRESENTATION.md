# Reexa: presentation pack (Canva)

*AI on Campus · Reply Student Tech Clash 2026 · Politecnico di Milano*

Contents: §1 context for Canva, §2 the 60-second pitch (Stage 1, no slides), §3 the 5-minute deck slide by slide (Stage 2, top 3 only), §4 the live demo script, §5 Q&A prep.

---

## 1. Context to give Canva (or any AI design tool)

**Paste this first:**

> We are designing a 9-slide pitch deck (16:9) for **Reexa**, an AI study app built in one day at the Reply Student Tech Clash 2026 ("AI on Campus") at Politecnico di Milano. Reexa turns a student's course slides into a personal playlist of short narrated, captioned video lessons with notes. After each lesson the student answers a check question **and explains their reasoning**. When they are wrong, Reexa finds the specific idea they misunderstood, explains it with a 1-minute video made for that mistake, and asks a new question to prove they got it. Every claim cites the exact slide page and is reviewed by a second AI before the student sees it. Audience: Reply judges and engineers. Scoring: creativity 40%, impact 20%, technical 20%, presentation 20%. Tone: confident, student-made, clear, not corporate. Few words per slide; big visuals.
>
> **Use this exact palette on every slide:** background #0F1D3A, accent teal #75FBF6, primary purple #8142F6, card purple #46308F with dark gradient #26255A to #1A2349, text #FFFFFF and #E8E9ED. Cards have rounded corners and a soft glassy glow. Logo: a navy "R" mark on a white rounded tile (file: `web/public/icon-512.png`). Font: a clean geometric sans (e.g. Inter or Poppins).

**Facts the deck may use** (all true as of 14 Nov 2026; don't add numbers that aren't here):

| Fact | Value |
|---|---|
| Course used for the demo | Databases 2, Politecnico di Milano |
| Course material available | 9 slide decks, ~25 past exams, exercise sheets |
| Lessons generated so far | 4 lessons, 8.5 minutes of narrated video, every one passed the AI jury (one only after the jury rejected the first version) |
| Targeted mini-video in the demo | 57 s, "Serial vs. Serializable", cites slide pages 19–20 |
| Lesson languages | 6 (EN, IT, ES, FR, DE, PT); interface in 8 (+ Turkish, Hindi) |
| Models | Claude Sonnet 5.5 writes the lessons; Claude Haiku 5.5 acts as an independent jury; prompt guard = Google Model Armor (or local rules) |
| Platforms | Web app (Vercel), installable phone app (PWA), desktop app (Electron) with an offline local-AI mode (Ollama) |
| AI cost of the whole demo content | under $1 |
| Live app | https://web-zeta-six-87.vercel.app |

---

## 2. Stage 1: 60-second pitch (no slides)

Rehearse with a timer; about 150 words. Every listener should be able to repeat the idea afterwards.

> It's the night before your Databases 2 exam. You get an exercise wrong. The solution sheet tells you *that* you're wrong, but not *why*. And ChatGPT? It hands you the answer, you copy it, and the misunderstanding comes with you into the exam.
>
> We built **Reexa**. Upload your course slides and Reexa turns them into short narrated lessons with captions and notes. After each one you answer a question and explain your reasoning. If you're wrong, Reexa finds the exact idea you misunderstood and makes you a one-minute video about that idea, built from your professor's own slides and cited page by page. A second AI checks every word before you see it. Then you prove it with a new question. It never just gives you the answer.
>
> Reexa: find the idea behind the mistake.

---

## 3. Stage 2: 5-minute deck (9 slides)

Timing column = target cumulative time. Speaker notes are written to be said out loud.

### Slide 1: Title (0:00 → 0:15)
- **On slide:** logo, **Reexa**, tagline *"Find the idea behind the mistake."*, small line: *AI on Campus · Reply Student Tech Clash 2026 · Team ⟨name⟩*
- **Visual:** the R logo large, centered, with a soft teal glow on the navy background.
- **Say:** "Hi, we're ⟨team⟩. This is Reexa."
- **Canva prompt:** *Title slide, centered white rounded-tile logo with a navy R, product name "Reexa" in large white bold sans, tagline below in teal #75FBF6, faint purple radial glow behind the logo, background #0F1D3A.*

### Slide 2: The moment (0:15 → 0:50)
- **On slide:** *"You got it wrong. But why?"* and one small card: a wrong exam answer with a red ✗ and the solution sheet saying only "Answer: B".
- **Say:** "Every PoliMi student knows this moment. Databases 2, the night before the exam. You get a concurrency exercise wrong. The solution sheet says B. Not why. You re-read the same slides that didn't work the first time. And if you ask a chatbot, it gives you the answer: you copy it, and the misconception survives until the exam."
- **Visual:** dark card styled like an exam sheet; teal handwritten-style question mark.

### Slide 3: The insight (0:50 → 1:15)
- **On slide:** three short lines:
  1. A wrong answer is a symptom. The broken idea is the cause.
  2. Slides explain things once, one way.
  3. Chatbots answer *for* you, not *with* you.
- **Say:** "Our insight: the wrong answer isn't the problem, it's a symptom. Students need three things nobody gives them at 11 pm: a diagnosis of *which idea* is broken, a different explanation of that idea, and proof that they've fixed it."
- **Visual:** three purple glass cards in a row with icons (stethoscope / play / check).

### Slide 4: What Reexa does (1:15 → 1:50)
- **On slide:** the loop as a circle of 5 steps: **Upload slides → Watch your playlist → Check + explain your reasoning → Diagnosis + 1-minute targeted video → New question**
- **Say:** "You upload your course material: slides, notes, past exams. Reexa builds your personal playlist: short narrated videos with captions, a transcript and notes, all in your language. After each lesson: a check. You can't just click an option; you have to explain why. That's how Reexa finds the misconception and makes you a video about exactly that idea. Then a new question closes the gap."
- **Visual:** circular flow diagram, teal arrows, purple glass step cards; the "1-minute video" step highlighted with the selection colour #8142F6.

### Slide 5: Live demo (1:50 → 3:00)
- **On slide:** just *"Live demo"* plus the URL, small. (Switch to the browser.)
- **Say:** follow §4 below. If anything fails, switch to the backup screenshots on slide 5b.
- **Slide 5b (hidden, backup):** 3 screenshots: the lesson player with captions and notes; the diagnosis card ("What went wrong in the reasoning"); the targeted video with its "Verified by AI jury" badge.

### Slide 6: Trust by design (3:00 → 3:40)
- **On slide:** four cards:
  - **Cited:** every claim links to its slide page.
  - **Checked:** a second AI (the jury) reviews every lesson, quiz and diagnosis; failures are regenerated or withheld.
  - **Guarded:** student instructions are screened by Google Model Armor before any AI sees them.
  - **Honest:** never reveals an answer before you try; the video explains the idea, not the answer.
- **Say:** "AI study tools hallucinate, so we designed against it. Everything is grounded in your slides and cited page by page. An independent AI jury reviews every item. One of our real lessons was *rejected* by the jury and regenerated before it reached a student. Student instructions pass a prompt-injection guard. And Reexa won't hand you the answer: ask it to, and it refuses and asks you to try and explain your thinking first."
- **Visual:** 2×2 card grid; a small "Verified by AI jury ✓" badge in teal.

### Slide 7: How it works (3:40 → 4:05)
- **On slide:** pipeline diagram: **PDF → page-by-page extraction → outline → script, notes, quiz (Claude Sonnet) → AI jury (Claude Haiku) → voice + captions → animation (ManimGL) → your playlist**. Below it, three platform chips: **Web · Phone (PWA) · Desktop with offline local AI**.
- **Say:** "Under the hood: we extract every page with its number, Claude writes the lesson script, notes and quiz, a second model judges it, then we generate the voice-over, captions and a 3Blue1Brown-style animation from fixed visual templates, so renders never break. It runs on the web, installs on your phone, and the desktop app can run the tutor on a local model, offline and private."
- **Visual:** horizontal flow with small icons; teal connectors.

### Slide 8: Impact: who benefits, who might be left out (4:05 → 4:35)
- **On slide:** two columns.
  - **Benefits:** students studying alone; visual learners; students in a second language (6 lesson languages); anyone stuck the night before the exam.
  - **Left out → what we did:** deaf or hard-of-hearing → captions and transcript always; blind or low-vision → narration plus a text transcript; no reliable internet → desktop offline mode and local AI; privacy → notes and progress stay on the student's device; name never sent to the AI.
- **Say:** "Who benefits: the student alone with the material, especially visual learners and those studying in a second language. Who might be left out, and what we did about it: captions and narration on every video, an offline desktop mode, and data that stays on your device."
- **Success measures (small, bottom):** re-check accuracy after the video · time from mistake to explanation < 2 min · 100% of claims cited.

### Slide 9: What's next + close (4:35 → 5:00)
- **On slide:** roadmap chips: *Offline lecture downloads · Native mobile apps · Progress synced to your account · "Sources differ" alerts when slides and notes disagree · Professor view of common misconceptions (opt-in)*. Then the tagline again, big: **Reexa: find the idea behind the mistake.** Plus the URL and a QR code.
- **Say:** "Next: offline downloads, native mobile apps, synced progress, and conflict alerts when your slides and notes disagree. And with the student's consent, a professor view showing which misconceptions are most common, so teaching improves too. Reexa: find the idea behind the mistake. Thank you."

---

## 4. Live demo script (70 seconds)

Run it on the laptop (local dev or the live URL), signed in if Google sign-in is configured, browser zoom 110%, dark theme.

1. **Courses → Databases 2 → Concurrency, lesson 2** ("Schedules and View-Serializability"). *Say:* "This is a lesson Reexa generated from the real course slides."
2. Play 5 seconds of the video with captions on; click a transcript line to jump. Open **AI Notes** and click a citation chip to show the slide quote. *Say:* "Every claim cites its slide page."
3. Open **Check → question 1**. Choose *"It must run each transaction in one contiguous block"*. Reasoning: *"serializable means the transactions run one after another without any interleaving."* Submit.
4. Show the **diagnosis** ("confuses serializable with serial") and the **Verified by AI jury** badge.
5. Click **"▶ Watch a 1-minute video on this misconception"** and play 10 seconds. *Say:* "This video was made for this mistake, from slides 19 and 20."
6. Answer the **re-check** correctly → *"Concept closed ✓"*. Optionally open **My progress**.
7. *(If time:)* click **"Just show me the answer"** to show the refusal.

**Backup:** if the network fails, the demo path is cached; if the browser fails, use slide 5b screenshots.

---

## 5. Q&A prep (the judges' three questions)

- **"Is this new, or just faster?"** Slides-to-video alone would be faster. The new part is the loop: diagnosing *the idea behind* a wrong answer from the student's own reasoning, then generating an explanation that did not exist before that mistake, grounded in that course's material.
- **"Does it help someone think, or think for them?"** It requires reasoning before revealing anything, refuses to give answers, explains concepts not solutions, and only closes a gap after a *new* question is solved.
- **"Who benefits, who is left out?"** See slide 8: captions, narration and transcripts; 6 lesson languages; an offline desktop mode; data kept on the device.
- **"What if the AI is wrong?"** It is grounded in the slides, cited page by page, and reviewed by an independent jury; items failing twice are withheld and flagged. The demo includes a lesson the jury rejected once.
- **"Cost?"** All demo content cost under $1 in AI calls; there's an hourly cap on the shared key; local models cost nothing.
- **"Copyright of slides?"** Only material the student or professor uploads is used, for that person's own study.
- **Honest limits:** progress lives in the browser for now (no cross-device sync yet); generating a new lesson takes a few minutes, so the demo uses pre-generated videos.
