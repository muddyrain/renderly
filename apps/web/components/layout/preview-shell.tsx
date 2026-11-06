import type { ReactNode } from "react";
import {
  Aperture,
  Box,
  FolderOpen,
  Image as ImageIcon,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Studio", icon: Sparkles },
  { label: "Gallery", icon: ImageIcon },
  { label: "Projects", icon: FolderOpen },
  { label: "Characters", icon: Users },
  { label: "Models", icon: Box },
  { label: "Settings", icon: Settings2 },
];

export function PreviewShell({ agent, children }: { agent: ReactNode; children: ReactNode }) {
  return (
    <div className="preview-workspace" lang="zh-CN">
      <div className="preview-notice">
        <strong>DEMO</strong>
        <span>Design system preview · 组件与布局样本 · 未连接 Agent 或 Provider</span>
      </div>

      <header className="preview-project-bar">
        <div className="flex items-center gap-3">
          <Aperture className="size-6 text-primary" aria-hidden="true" />
          <span className="text-xl font-semibold tracking-tight">Renderly</span>
        </div>
        <div className="flex min-w-0 items-center gap-3 border-l border-border pl-6">
          <span className="truncate">Design foundations</span>
          <span className="text-muted-foreground">/</span>
          <span>Studio</span>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">B0 + B1 · 开发预览</span>
      </header>

      <div className="preview-columns">
        <aside className="preview-sidebar" aria-label="工作区导航预览">
          <nav aria-label="六项导航（仅框架样本）" className="flex flex-col gap-1">
            {navigation.map(({ label, icon: Icon }, index) => (
              <Button
                key={label}
                variant={index === 0 ? "selected" : "navigation"}
                className="w-full justify-start"
                aria-current={index === 0 ? "page" : undefined}
                disabled
              >
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </nav>
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            此处为禁用导航控件样本。正式六页导航位于工作台。
          </p>
          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
            <span className="text-xs text-primary">GRAPHITE ATELIER</span>
            <span className="text-xs text-muted-foreground">石墨灰 / Sage<br />基础组件审阅</span>
          </div>
        </aside>

        <section className="preview-agent" aria-labelledby="preview-agent-title">
          <div className="preview-panel-heading">
            <Sparkles className="size-[18px] text-primary" aria-hidden="true" />
            <h2 id="preview-agent-title" className="text-base font-semibold">Creative Agent</h2>
            <span className="ml-auto text-xs text-muted-foreground">Demo 区域</span>
          </div>
          <div className="preview-panel-scroll">{agent}</div>
        </section>

        <main className="preview-canvas" aria-labelledby="preview-canvas-title">
          <div className="preview-panel-heading">
            <ImageIcon className="size-[18px]" aria-hidden="true" />
            <h1 id="preview-canvas-title" className="text-base font-semibold">Canvas</h1>
            <span className="ml-auto text-xs text-muted-foreground">组件预览 · 非生成结果</span>
          </div>
          <div className="preview-panel-scroll">{children}</div>
        </main>
      </div>
    </div>
  );
}
