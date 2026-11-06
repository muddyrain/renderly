import type { Metadata } from "next";

export const workspacePages = {
  studio: { href: "/studio", label: "Studio", description: "与 Agent 一起探索创作方向，在画布中查看作品。" },
  gallery: { href: "/gallery", label: "Gallery", description: "集中查看、整理和回顾你的视觉作品。" },
  projects: { href: "/projects", label: "Projects", description: "按创作目标组织项目，让想法与作品有处可寻。" },
  characters: { href: "/characters", label: "Characters", description: "为角色整理描述与参考资料。" },
  models: { href: "/models", label: "Models", description: "查看生成服务的连接状态与可用模型。" },
  settings: { href: "/settings", label: "Settings", description: "查看工作区和创作偏好。" },
} as const;

export type WorkspacePageKey = keyof typeof workspacePages;

export function workspaceMetadata(key: WorkspacePageKey): Metadata {
  const page = workspacePages[key];
  return { title: `${page.label} — Renderly`, description: page.description };
}
