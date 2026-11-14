import { Suspense } from "react";
import Library from "@/components/Library";
import { HeaderSkeleton, LectureCardsSkeleton } from "@/components/Skeletons";
import { getT } from "@/lib/lang";

export default async function CoursePage() {
  const t = await getT();
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
          <HeaderSkeleton label={t.library.loadingCourse} />
          <LectureCardsSkeleton label={t.library.loadingLectures} />
        </main>
      }
    >
      <Library allowUpload={process.env.ALLOW_UPLOAD === "1"} />
    </Suspense>
  );
}
