"use client";

import { useProjectConnection } from "@/components/workspace/workspace-provider";
import { useRef, useState } from "react";
import { AgentPanel } from "./agent-panel";
import { CanvasPanel } from "./canvas-panel";
import { useDemoAgent } from "@/hooks/use-demo-agent";
import { selectedArtwork } from "@/lib/demo/studio-fixtures";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function StudioWorkbench() {
  const { state, agent } = useDemoAgent();
  const { connected } = useProjectConnection();
  const composer = useRef<HTMLTextAreaElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const resetConfirmed = useRef(false);
  const [resetMode, setResetMode] = useState<boolean | null>(null);
  const requestReset = (preset: boolean, trigger: HTMLElement) => {
    if (
      !state.brief &&
      !state.draft &&
      !state.messages.length &&
      !state.result &&
      state.phase !== "running"
    ) {
      agent.reset(preset);
      requestAnimationFrame(() => composer.current?.focus());
      return;
    }
    returnFocus.current = trigger;
    resetConfirmed.current = false;
    setResetMode(preset);
  };
  return (
    <div className="studio-workbench" data-demo-phase={state.phase}>
      <h1 className="sr-only">Studio</h1>
      <AgentPanel
        state={state}
        agent={agent}
        inputRef={composer}
        requestReset={requestReset}
      />
      <CanvasPanel
        key={state.session}
        state={state}
        agent={agent}
        loadExample={(trigger) => requestReset(true, trigger)}
        continueFromImage={() => {
          const { image } = selectedArtwork(state);
          if (state.brief)
            agent.applyBrief({ ...state.brief, references: [image.id] });
          if (!state.draft)
            agent.setDraft(`参考预置样图“${image.title}”，我想继续探索：`);
          requestAnimationFrame(() => composer.current?.focus());
        }}
      />
      <Dialog
        open={resetMode !== null}
        onOpenChange={(open) => {
          if (!open) setResetMode(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() => {
              const target = resetConfirmed.current
                ? composer.current
                : returnFocus.current;
              if (target?.isConnected) target.focus();
              else composer.current?.focus();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {resetMode ? "载入预置示例？" : "开始新会话？"}
            </DialogTitle>
            <DialogDescription>
              当前草稿、对话、引用和选择将清空；正在运行的演示会取消。
              {connected
                ? "项目仍在数据库；Gallery、角色与偏好刷新重置。"
                : "Gallery、项目、角色和偏好会保留到刷新。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResetMode(null)}>
              保留当前会话
            </Button>
            <Button
              onClick={() => {
                resetConfirmed.current = true;
                agent.reset(resetMode === true);
                setResetMode(null);
              }}
            >
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
