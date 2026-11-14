import { Suspense } from "react";
import Library from "@/components/Library";
import { getT } from "@/lib/lang";

export default async function CoursePage() {
  const t = await getT();
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">{t.library.loadingCourse}</p>}>
      <Library allowUpload={process.env.ALLOW_UPLOAD === "1"} />
    </Suspense>
  );
}
