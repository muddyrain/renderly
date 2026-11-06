"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { canSendPrompt, type DemoAgent } from "@/lib/demo/demo-agent";
import { MAX_PROMPT_LENGTH } from "@/lib/demo/studio-fixtures";
import type { StudioState } from "@/types/studio";

export function Composer({
  state,
  agent,
  inputRef,
}: {
  state: StudioState;
  agent: DemoAgent;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const composing = useRef(false);
  const tooLong = state.draft.length > MAX_PROMPT_LENGTH;
  const send = (nativeComposing = false, keyCode = 0) => {
    if (agent.send(composing.current || nativeComposing, keyCode))
      inputRef.current?.focus();
  };

  return (
    <div className="studio-composer">
      <label htmlFor="studio-prompt" className="font-medium">
        创作需求
      </label>
      <Textarea
        ref={inputRef}
        id="studio-prompt"
        rows={3}
        value={state.draft}
        disabled={state.phase === "running"}
        placeholder="描述想探索的画面或修改方向…"
        aria-describedby="studio-prompt-hint studio-prompt-limit"
        aria-invalid={tooLong}
        onChange={(event) => agent.setDraft(event.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            send(event.nativeEvent.isComposing, event.nativeEvent.keyCode);
          }
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p id="studio-prompt-hint" className="text-xs text-muted-foreground">
          Enter 换行
          <br />
          Ctrl / ⌘ + Enter 发送
        </p>
        <Button
          size="sm"
          disabled={!canSendPrompt(state.draft, state.phase)}
          onClick={() => send()}
        >
          <Send aria-hidden="true" />
          发送需求
        </Button>
      </div>
      <p
        id="studio-prompt-limit"
        className={
          tooLong ? "text-xs text-destructive" : "text-xs text-muted-foreground"
        }
      >
        {state.draft.length} / {MAX_PROMPT_LENGTH} 字
        {tooLong
          ? " · 超出限制，请缩短；不会静默截断。"
          : " · 跨页保留，刷新重置"}
      </p>
    </div>
  );
}
