import { ModelsWorkbench } from "@/components/workspace/models-workbench";
import { workspaceMetadata } from "@/lib/workspace-pages";
export const metadata = workspaceMetadata("models");
export default function Page() { return <ModelsWorkbench />; }
