import ProfileForm from "@/components/ProfileForm";
import { getT } from "@/lib/lang";

export const generateMetadata = async () => ({ title: (await getT()).meta.profile });

export default function Profile() {
  return <ProfileForm />;
}
