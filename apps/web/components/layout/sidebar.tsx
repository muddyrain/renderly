"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { Box, FolderOpen, Image as ImageIcon, Settings2, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { workspacePages } from "@/lib/workspace-pages";
import { useMotionPreference } from "@/hooks/use-motion-preference";

const icons = {
  studio: Sparkles,
  gallery: ImageIcon,
  projects: FolderOpen,
  characters: Users,
  models: Box,
  settings: Settings2,
};

export function Sidebar() {
  const pathname = usePathname();
  const reduceMotion = useMotionPreference();

  return (
    <aside className="workspace-sidebar" aria-label="工作区">
      <LayoutGroup id="workspace-navigation">
        <nav aria-label="工作区导航" className="flex flex-col gap-1">
          {Object.entries(workspacePages).map(([key, page]) => {
            const Icon = icons[key as keyof typeof icons];
            const active = page.href === pathname;

            return (
              <Button key={key} asChild variant="navigation" className="workspace-nav-link">
                <Link href={page.href} aria-current={active ? "page" : undefined}>
                  {active && (reduceMotion ? (
                    <span className="workspace-nav-selection" aria-hidden="true" />
                  ) : (
                    <motion.span
                      className="workspace-nav-selection"
                      layoutId="selection"
                      initial={false}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      aria-hidden="true"
                    />
                  ))}
                  <Icon aria-hidden="true" />
                  <span>{page.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </LayoutGroup>
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <span className="text-xs text-primary">演示工作区</span>
        <p className="text-xs text-muted-foreground">浏览创作空间。<br />内容不会保存。</p>
        {process.env.NODE_ENV === "development" && (
          <nav aria-label="开发对照入口" className="mt-2 flex flex-col gap-1">
            <Button asChild variant="navigation" size="sm" className="justify-start">
              <Link href="/design-system">组件预览</Link>
            </Button>
          </nav>
        )}
      </div>
    </aside>
  );
}
