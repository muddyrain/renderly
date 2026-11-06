import { StudioWorkbench } from "@/components/studio/studio-workbench";
import { workspaceMetadata } from "@/lib/workspace-pages";

export const metadata = workspaceMetadata("studio");

export default function StudioPage() {
  return <StudioWorkbench />;
}
