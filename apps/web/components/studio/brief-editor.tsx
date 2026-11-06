"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { briefErrors, type DemoAgent } from "@/lib/demo/demo-agent";
import { demoImages } from "@/lib/demo/studio-fixtures";
import type { CreativeBrief } from "@/types/studio";

export function BriefEditor({
  brief,
  running,
  agent,
}: {
  brief: CreativeBrief;
  running: boolean;
  agent: DemoAgent;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(brief);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const goal = useRef<HTMLTextAreaElement>(null);

  return (
    <section className="studio-brief" aria-labelledby="brief-heading">
      <div className="flex items-center justify-between gap-2">
        <h3 id="brief-heading" className="font-semibold">
          Creative Brief
        </h3>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) {
              setDraft({ ...brief, references: [...brief.references] });
              setErrors({});
            }
            setOpen(next);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" disabled={running}>
              编辑 Brief
            </Button>
          </DialogTrigger>
          <DialogContent
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              goal.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>编辑 Creative Brief</DialogTitle>
              <DialogDescription>
                仅应用到本次演示。修改目标、画幅或引用后，计划需要重新批准。
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const nextErrors = briefErrors(draft);
                setErrors(nextErrors);
                if (!Object.keys(nextErrors).length && agent.applyBrief(draft))
                  setOpen(false);
              }}
            >
              {(
                [
                  ["goal", "目标"],
                  ["subject", "主体 / 用途"],
                  ["direction", "视觉方向"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-2">
                  <label htmlFor={`brief-${key}`}>{label}</label>
                  {key === "subject" ? (
                    <Input
                      id={`brief-${key}`}
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                      aria-invalid={!!errors[key]}
                      aria-describedby={
                        errors[key] ? `brief-${key}-error` : undefined
                      }
                    />
                  ) : (
                    <Textarea
                      id={`brief-${key}`}
                      ref={key === "goal" ? goal : undefined}
                      rows={3}
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                      aria-invalid={!!errors[key]}
                      aria-describedby={
                        errors[key] ? `brief-${key}-error` : undefined
                      }
                    />
                  )}
                  {errors[key] && (
                    <p
                      id={`brief-${key}-error`}
                      className="text-xs text-destructive"
                    >
                      {errors[key]}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-2">
                <label htmlFor="brief-ratio">画幅意向</label>
                <select
                  id="brief-ratio"
                  className="studio-select"
                  value={draft.ratio}
                  onChange={(event) =>
                    setDraft({ ...draft, ratio: event.target.value })
                  }
                >
                  {["3:2", "16:9", "1:1", "9:16"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2">引用样图（本地预置）</legend>
                {demoImages.map((image) => (
                  <label key={image.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={draft.references.includes(image.id)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          references: event.target.checked
                            ? [...draft.references, image.id]
                            : draft.references.filter((id) => id !== image.id),
                        })
                      }
                    />
                    {image.title}
                  </label>
                ))}
              </fieldset>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    取消编辑
                  </Button>
                </DialogClose>
                <Button type="submit">应用到本次演示</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <dl className="studio-brief-summary">
        <div>
          <dt>目标</dt>
          <dd>{brief.goal}</dd>
        </div>
        <div>
          <dt>主体</dt>
          <dd>{brief.subject}</dd>
        </div>
        <div>
          <dt>方向</dt>
          <dd>{brief.direction}</dd>
        </div>
        <div>
          <dt>画幅意向</dt>
          <dd>{brief.ratio}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        引用样图 · {brief.references.length} 张
      </p>
      <div className="flex flex-wrap gap-2">
        {demoImages
          .filter((image) => brief.references.includes(image.id))
          .map((image) => (
            <Image
              key={image.id}
              src={image.src}
              alt={`引用：${image.alt}`}
              width={72}
              height={48}
              unoptimized
              className="studio-reference-thumb"
            />
          ))}
      </div>
    </section>
  );
}
