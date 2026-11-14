import CourseForm from "@/components/CourseForm";
import { getT } from "@/lib/lang";

export const generateMetadata = async () => ({ title: (await getT()).meta.addCourse });

export default function NewCourse() {
  return <CourseForm allowUpload={process.env.ALLOW_UPLOAD === "1"} />;
}
