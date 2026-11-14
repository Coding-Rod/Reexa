// Content contract: specs/001-misconception-video-tutor/plan.md

export type Citation = { file: string; page: number; quote: string };
export type Passage = { file: string; page: number; text: string };

export type QuizItem = {
  id: string;
  concept: string;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
  citations: Citation[];
};

// What the client gets before answering: no answer, no explanation.
export type PublicQuestion = Pick<QuizItem, "id" | "concept" | "question" | "options"> & {
  token?: string; // generated re-check questions carry their answer encrypted
};

export type Jury = {
  verdict: "pass" | "flagged";
  reason: string;
  model: string;
  attempts: number;
};

export type Section = {
  id: string;
  lecture_id: string;
  title: string;
  video: string;
  captions: string;
  duration: number;
  transcript: { start: number; end: number; text: string }[];
  notes_md: string;
  citations: Citation[];
  passages: Passage[];
  jury: Jury;
  quiz: QuizItem[];
};

export type PublicSection = Omit<Section, "quiz"> & { quiz: PublicQuestion[] };

export type SectionRef = { id: string; title: string; duration: number; path: string };

export type Lecture = {
  id: string;
  title: string;
  source: string;
  status: "processing" | "ready" | "failed";
  language?: string;
  sections: SectionRef[];
};

export type Manifest = {
  course: { id: string; title: string };
  lectures: Lecture[];
};

export type DiagnoseRequest = {
  lectureId: string;
  sectionId: string;
  questionId?: string;
  token?: string;
  chosenIndex: number;
  reasoning: string;
  language?: string;
};

export type DiagnoseResponse = {
  correct: boolean;
  correctIndex: number;
  concept: string;
  misconception: string | null;
  explanation: string;
  citations: Citation[];
  jury: Jury;
  recheck: PublicQuestion | null;
  source: "llm" | "stub";
};
