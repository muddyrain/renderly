"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserRound } from "lucide-react";
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
import { demoImages } from "@/lib/demo/studio-fixtures";
import type { Character } from "@/types/workspace";
import { useWorkspace } from "./workspace-provider";
import { PageFrame, EmptyState, ConfirmDialog } from "./page-frame";
type CharacterDraft = Omit<Character, "id"> & { id: string | null };
export function CharactersWorkbench() {
  const { state, store } = useWorkspace();
  const router = useRouter();
  const search = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<CharacterDraft | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Character | null>(null);
  const open = (character: Character | null, button: HTMLElement) => {
    trigger.current = button;
    setError("");
    setEditor(
      character
        ? structuredClone(character)
        : {
            id: null,
            name: "",
            appearance: "",
            constraints: "",
            references: [],
            projectIds: [],
          },
    );
  };
  const characters = state.characters.filter((c) =>
    `${c.name} ${c.appearance} ${c.constraints}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const toggle = (key: "references" | "projectIds", id: string) => {
    if (editor)
      setEditor({
        ...editor,
        [key]: editor[key].includes(id)
          ? editor[key].filter((value) => value !== id)
          : [...editor[key], id],
      });
  };
  return (
    <PageFrame
      page="characters"
      action={
        <Button onClick={(e) => open(null, e.currentTarget)}>
          <Plus aria-hidden="true" />
          新建角色
        </Button>
      }
    >
      <p className="workspace-callout">
        角色是文字与氛围参考资料，不保证模型角色一致性。风景照片仅作氛围参考，不是角色成品。
      </p>
      <div className="workspace-toolbar">
        <Input
          ref={search}
          aria-label="搜索角色"
          placeholder="搜索姓名、外观或约束…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="workspace-count">{characters.length} 份资料</span>
      </div>
      {!characters.length ? (
        <EmptyState
          title={
            state.characters.length ? "没有匹配的角色" : "添加第一份角色资料"
          }
        >
          <p>填写外观与约束，在 Studio 继续时会复制到 Brief。</p>
          <Button
            variant="secondary"
            onClick={(e) =>
              state.characters.length
                ? setQuery("")
                : open(null, e.currentTarget)
            }
          >
            {state.characters.length ? "清除搜索" : "新建角色资料"}
          </Button>
        </EmptyState>
      ) : (
        <div className="workspace-character-grid">
          {characters.map((character) => (
            <article
              key={character.id}
              className="workspace-character-card"
              data-character-id={character.id}
            >
              <div className="workspace-character-identity">
                <span className="workspace-character-icon">
                  <UserRound aria-hidden="true" />
                </span>
                <div>
                  <h2>{character.name}</h2>
                  <p className="workspace-meta">角色资料 · 非生成成品</p>
                </div>
              </div>
              <dl className="workspace-info">
                <div>
                  <dt>外观描述</dt>
                  <dd>{character.appearance}</dd>
                </div>
                <div>
                  <dt>约束</dt>
                  <dd>{character.constraints}</dd>
                </div>
                <div>
                  <dt>关联项目</dt>
                  <dd>
                    {character.projectIds
                      .map(
                        (id) => state.projects.find((p) => p.id === id)?.name,
                      )
                      .filter(Boolean)
                      .join("、") || "未关联"}
                  </dd>
                </div>
              </dl>
              <p className="workspace-meta">
                氛围参考 · {character.references.length} 张
              </p>
              {!!character.references.length && (
                <div className="workspace-mood-strip" aria-label="氛围参考图">
                  {character.references.map((id) => {
                    const image = demoImages.find((item) => item.id === id);
                    return (
                      image && (
                        <figure key={id}>
                          <Image
                            src={image.src}
                            alt={`氛围参考：${image.alt}`}
                            width={180}
                            height={120}
                            unoptimized
                          />
                          <figcaption>氛围 · {image.title}</figcaption>
                        </figure>
                      )
                    );
                  })}
                </div>
              )}
              <div className="workspace-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (
                      store.queueIntent({ kind: "character", id: character.id })
                    )
                      router.push("/studio");
                  }}
                >
                  引用到 Studio
                </Button>
                <Button
                  variant="ghost"
                  onClick={(e) => open(character, e.currentTarget)}
                >
                  编辑资料
                </Button>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    trigger.current = e.currentTarget;
                    setDeleting(character);
                  }}
                >
                  删除资料
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={editor !== null}
        onOpenChange={(value) => {
          if (!value) setEditor(null);
        }}
      >
        <DialogContent
          className="workspace-character-dialog"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const target = trigger.current?.isConnected
              ? trigger.current
              : search.current;
            requestAnimationFrame(() => target?.focus());
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? "编辑角色资料" : "新建角色资料"}
            </DialogTitle>
            <DialogDescription>
              文字会复制到 Brief；之后编辑或删除资料不改变已批准快照。
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <form
              className="workspace-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (store.saveCharacter(editor.id, editor)) setEditor(null);
                else
                  setError(
                    "请填写名称、外观和约束；名称最多 120 字，外观与约束各最多 2000 字。",
                  );
              }}
            >
              <label htmlFor="character-name">
                角色名称（必填）
                <Input
                  id="character-name"
                  autoFocus
                  required
                  maxLength={120}
                  value={editor.name}
                  onChange={(e) =>
                    setEditor({ ...editor, name: e.target.value })
                  }
                />
              </label>
              <label htmlFor="character-appearance">
                外观描述（必填）
                <Textarea
                  id="character-appearance"
                  required
                  maxLength={2000}
                  value={editor.appearance}
                  onChange={(e) =>
                    setEditor({ ...editor, appearance: e.target.value })
                  }
                />
              </label>
              <label htmlFor="character-constraints">
                创作约束（必填）
                <Textarea
                  id="character-constraints"
                  required
                  maxLength={2000}
                  value={editor.constraints}
                  onChange={(e) =>
                    setEditor({ ...editor, constraints: e.target.value })
                  }
                />
              </label>
              <fieldset>
                <legend>氛围参考（可选，风景照片）</legend>
                <div className="workspace-checkbox-list">
                  {demoImages.map((image) => (
                    <label key={image.id}>
                      <input
                        type="checkbox"
                        checked={editor.references.includes(image.id)}
                        onChange={() => toggle("references", image.id)}
                      />
                      {image.title}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>关联项目（可选）</legend>
                <div className="workspace-checkbox-list">
                  {state.projects.length ? (
                    state.projects.map((p) => (
                      <label key={p.id}>
                        <input
                          type="checkbox"
                          checked={editor.projectIds.includes(p.id)}
                          onChange={() => toggle("projectIds", p.id)}
                        />
                        {p.name}
                      </label>
                    ))
                  ) : (
                    <p>暂无项目，可稍后关联。</p>
                  )}
                </div>
              </fieldset>
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
                <Button type="submit">应用角色资料</Button>
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
        title="删除角色资料？"
        description={`删除“${deleting?.name ?? ""}”；已复制的 Brief、正在审阅的文字及历史批准快照保持原值。`}
        close={() => setDeleting(null)}
        confirm={() => {
          if (deleting) store.deleteCharacter(deleting.id);
          requestAnimationFrame(() => search.current?.focus());
        }}
      />
    </PageFrame>
  );
}
