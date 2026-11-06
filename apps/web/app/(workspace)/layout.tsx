import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

import "@/styles/tokens.css";
import "@/styles/workspace.css";
import "@/styles/studio.css";
import "@/styles/collections.css";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider><WorkspaceShell>{children}</WorkspaceShell></WorkspaceProvider>;
}
