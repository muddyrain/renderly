import { GalleryWorkbench } from "@/components/workspace/gallery-workbench";
import { workspaceMetadata } from "@/lib/workspace-pages";
export const metadata = workspaceMetadata("gallery");
export default function Page() { return <GalleryWorkbench />; }
