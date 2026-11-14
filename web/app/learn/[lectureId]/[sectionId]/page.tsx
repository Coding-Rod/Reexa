"use client";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import Player from "@/components/Player";

function Lesson() {
  const { lectureId, sectionId } = useParams<{ lectureId: string; sectionId: string }>();
  return <Player key={`${lectureId}/${sectionId}`} lectureId={lectureId} sectionId={sectionId} />;
}

export default function LearnPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Loading lesson…</p>}>
      <Lesson />
    </Suspense>
  );
}
