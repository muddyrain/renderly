"use client";

import { Aperture } from "lucide-react";
import { usePathname } from "next/navigation";

import { workspacePages } from "@/lib/workspace-pages";

export function ProjectHeader() {
  const pathname = usePathname();
  const currentPage = Object.values(workspacePages).find((page) => page.href === pathname);

  return (
    <header className="workspace-project-header">
      <div className="flex items-center gap-3">
        <Aperture className="size-6 text-primary" aria-hidden="true" />
        <span className="text-xl font-semibold tracking-tight">Renderly</span>
      </div>
      <nav aria-label="当前位置" className="workspace-breadcrumb">
        <ol className="flex items-center gap-3">
          <li className="text-muted-foreground">Demo workspace</li>
          <li aria-hidden="true" className="text-muted-foreground">/</li>
          <li aria-current="page">{currentPage?.label ?? "Workspace"}</li>
        </ol>
      </nav>
      <span className="ml-auto text-xs text-muted-foreground">未连接 Provider</span>
    </header>
  );
}
