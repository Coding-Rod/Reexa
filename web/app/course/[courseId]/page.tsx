import { Suspense } from "react";
import Library from "@/components/Library";

export default function CoursePage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Loading course…</p>}>
      <Library allowUpload={process.env.ALLOW_UPLOAD === "1"} />
    </Suspense>
  );
}
