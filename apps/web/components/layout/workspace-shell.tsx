"use client";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import type { ReactNode } from "react";

import { DemoNotice } from "@/components/layout/demo-notice";
import { ProjectHeader } from "@/components/layout/project-header";
import { Sidebar } from "@/components/layout/sidebar";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const reduce = useMotionPreference();
  return (
    <div className="renderly-theme workspace-shell" lang="zh-CN" data-reduced-motion={reduce}>
      <a href="#workspace-main" className="workspace-skip-link">跳至页面内容</a>
      <DemoNotice />
      <ProjectHeader />
      <div className="workspace-body">
        <Sidebar />
        <main id="workspace-main" className="workspace-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
