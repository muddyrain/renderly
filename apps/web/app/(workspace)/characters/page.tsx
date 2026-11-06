import { Users } from "lucide-react";

import { WorkspaceEmptyState } from "@/components/layout/workspace-empty-state";
import { WorkspacePageHeading } from "@/components/layout/workspace-page-heading";
import { workspaceMetadata } from "@/lib/workspace-pages";

export const metadata = workspaceMetadata("characters");

export default function CharactersPage() {
  return (
    <section className="workspace-section">
      <WorkspacePageHeading pageKey="characters" />
      <WorkspaceEmptyState
        icon={Users}
        title="角色资料尚未添加"
        description="在这里收集角色描述与参考图。当前演示工作区尚未连接角色资料库。"
      />
    </section>
  );
}
