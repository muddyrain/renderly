import { workspacePages, type WorkspacePageKey } from "@/lib/workspace-pages";

export function WorkspacePageHeading({ pageKey }: { pageKey: WorkspacePageKey }) {
  const page = workspacePages[pageKey];

  return (
    <div className="workspace-page-heading">
      <h1 className="text-xl font-semibold">{page.label}</h1>
      <p className="text-sm text-muted-foreground">{page.description}</p>
    </div>
  );
}
