import { WorkspaceShell } from "@/components/layout/workspace-shell";

import "@/styles/tokens.css";
import "@/styles/workspace.css";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
