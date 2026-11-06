import { FolderOpen } from "lucide-react";

import { WorkspaceEmptyState } from "@/components/layout/workspace-empty-state";
import { WorkspacePageHeading } from "@/components/layout/workspace-page-heading";
import { workspaceMetadata } from "@/lib/workspace-pages";

export const metadata = workspaceMetadata("projects");

export default function ProjectsPage() {
  return (
    <section className="workspace-section">
      <WorkspacePageHeading pageKey="projects" />
      <WorkspaceEmptyState
        icon={FolderOpen}
        title="还没有项目"
        description="项目可以容纳同一创作目标下的资料与作品。当前尚未连接项目创建和保存。"
      />
    </section>
  );
}
