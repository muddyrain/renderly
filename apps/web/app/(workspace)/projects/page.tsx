import { ProjectsWorkbench } from "@/components/workspace/projects-workbench";
import { workspaceMetadata } from "@/lib/workspace-pages";
export const metadata = workspaceMetadata("projects");
export default function Page() { return <ProjectsWorkbench />; }
