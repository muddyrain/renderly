"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { assetArtwork } from "@/lib/demo/workspace-store";
import type { Project } from "@/types/workspace";
import { useWorkspace } from "./workspace-provider";
import { PageFrame, EmptyState, ConfirmDialog } from "./page-frame";
export function ProjectsWorkbench() {
  const { state, store } = useWorkspace();
  const router = useRouter();
  const search = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{
    id: string | null;
    name: string;
    description: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Project | null>(null);
  const open = (project: Project | null, button: HTMLElement) => {
    trigger.current = button;
    setError("");
    setEditor(
      project ? { ...project } : { id: null, name: "", description: "" },
    );
  };
  const projects = state.projects.filter((p) =>
    `${p.name} ${p.description}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <PageFrame
      page="projects"
      action={
        <Button onClick={(e) => open(null, e.currentTarget)}>
          <Plus aria-hidden="true" />
          新建项目
        </Button>
      }
    >
      <div className="workspace-toolbar">
        <Input
          ref={search}
          aria-label="搜索项目"
          placeholder="搜索项目名称或描述…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="workspace-count">{projects.length} 个项目</span>
      </div>
      {!projects.length ? (
        <EmptyState
          title={state.projects.length ? "没有匹配的项目" : "从一个项目开始"}
        >
          <p>项目组织当前会话中的作品；新建项目最初没有作品。</p>
          <Button
            variant="secondary"
            onClick={(e) =>
              state.projects.length ? setQuery("") : open(null, e.currentTarget)
            }
          >
            {state.projects.length ? "清除搜索" : "创建第一个项目"}
          </Button>
        </EmptyState>
      ) : (
        <div className="workspace-project-grid">
          {projects.map((project) => {
            const assets = state.assets.filter(
              (a) => a.projectId === project.id,
            );
            return (
              <article
                className="workspace-project-card"
                key={project.id}
                data-project-id={project.id}
              >
                <div className="workspace-project-cover">
                  {assets.length ? (
                    assets.slice(0, 3).map((asset) => {
                      const { image } = assetArtwork(asset);
                      return (
                        <Image
                          key={asset.id}
                          src={image.src}
                          alt={image.alt}
                          width={240}
                          height={160}
                          unoptimized
                        />
                      );
                    })
                  ) : (
                    <>
                      <FolderOpen aria-hidden="true" />
                      <span>新项目 · 暂无作品</span>
                    </>
                  )}
                </div>
                <div className="workspace-card-copy">
                  <h2>{project.name}</h2>
                  <p>{project.description || "还没有项目描述。"}</p>
                  <span className="workspace-meta">
                    {assets.length} 件作品 ·{" "}
                    {
                      state.characters.filter((c) =>
                        c.projectIds.includes(project.id),
                      ).length
                    }{" "}
                    份角色资料
                    {state.activeProjectId === project.id ? " · 当前项目" : ""}
                  </span>
                  <div className="workspace-actions">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (store.selectProject(project.id))
                          router.push("/studio");
                      }}
                    >
                      打开 Studio
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => open(project, e.currentTarget)}
                    >
                      编辑项目
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        trigger.current = e.currentTarget;
                        setDeleting(project);
                      }}
                    >
                      删除项目
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Dialog
        open={editor !== null}
        onOpenChange={(value) => {
          if (!value) setEditor(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const target = trigger.current?.isConnected
              ? trigger.current
              : search.current;
            requestAnimationFrame(() => target?.focus());
          }}
        >
          <DialogHeader>
            <DialogTitle>{editor?.id ? "编辑项目" : "新建项目"}</DialogTitle>
            <DialogDescription>
              名称支持中文，最多 120 字。取消不改变当前项目。
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <form
              className="workspace-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const ok = editor.id
                  ? store.renameProject(
                      editor.id,
                      editor.name,
                      editor.description,
                    )
                  : store.createProject(editor.name, editor.description);
                if (ok) setEditor(null);
                else setError("请填写 1–120 字的项目名称，描述最多 1000 字。");
              }}
            >
              <label htmlFor="project-name">
                项目名称（必填）
                <Input
                  id="project-name"
                  autoFocus
                  required
                  maxLength={120}
                  value={editor.name}
                  onChange={(e) =>
                    setEditor({ ...editor, name: e.target.value })
                  }
                />
              </label>
              <label htmlFor="project-description">
                项目描述
                <Textarea
                  id="project-description"
                  maxLength={1000}
                  value={editor.description}
                  onChange={(e) =>
                    setEditor({ ...editor, description: e.target.value })
                  }
                />
              </label>
              {error && (
                <p role="alert" className="workspace-error">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditor(null)}
                >
                  取消编辑
                </Button>
                <Button type="submit">
                  {editor.id ? "应用项目" : "创建项目"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleting !== null}
        focusAfterClose={() =>
          trigger.current?.isConnected ? trigger.current : search.current
        }
        title="删除项目？"
        description={`“${deleting?.name ?? ""}”的作品将移至未归属；角色资料保留并移除项目关联。若是当前项目，将取消正在运行的演示。`}
        close={() => setDeleting(null)}
        confirm={() => {
          if (deleting) store.deleteProject(deleting.id);
          requestAnimationFrame(() => search.current?.focus());
        }}
      />
    </PageFrame>
  );
}
