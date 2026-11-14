import CourseForm from "@/components/CourseForm";

export const metadata = { title: "Add a course" };

export default function NewCourse() {
  return <CourseForm allowUpload={process.env.ALLOW_UPLOAD === "1"} />;
}
