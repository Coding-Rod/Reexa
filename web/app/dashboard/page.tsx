import Dashboard from "@/components/Dashboard";
import { getT } from "@/lib/lang";

export const generateMetadata = async () => ({ title: (await getT()).meta.progress });

export default function DashboardPage() {
  return <Dashboard />;
}
