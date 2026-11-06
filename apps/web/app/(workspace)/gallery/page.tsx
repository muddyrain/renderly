import { Image as ImageIcon } from "lucide-react";

import { WorkspaceEmptyState } from "@/components/layout/workspace-empty-state";
import { WorkspacePageHeading } from "@/components/layout/workspace-page-heading";
import { workspaceMetadata } from "@/lib/workspace-pages";

export const metadata = workspaceMetadata("gallery");

export default function GalleryPage() {
  return (
    <section className="workspace-section">
      <WorkspacePageHeading pageKey="gallery" />
      <WorkspaceEmptyState
        icon={ImageIcon}
        title="作品会在这里汇集"
        description="当前演示工作区还没有作品，素材库尚未连接。"
      />
    </section>
  );
}
