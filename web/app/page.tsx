import Library from "@/components/Library";

export default function Home() {
  return <Library allowUpload={process.env.ALLOW_UPLOAD === "1"} />;
}
