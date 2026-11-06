import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

import "@/styles/tokens.css";
import "@/styles/workspace.css";
import "@/styles/studio.css";
import "@/styles/collections.css";

export const dynamic = "force-dynamic";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = process.env.RENDERLY_PROJECTS_MODE ?? "demo";
  if (mode !== "demo" && mode !== "api")
    throw new Error("Invalid projects mode");
  const workspaceId = (process.env.RENDERLY_WORKSPACE_ID ?? "").toLowerCase();
  if (
    mode === "api" &&
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(workspaceId)
  )
    throw new Error("Connected workspace ID is required");
  return (
    <WorkspaceProvider
      connection={
        mode === "api" ? { mode: "api", workspaceId } : { mode: "demo" }
      }
    >
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
