"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, Sparkles, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BriefEditor } from "./brief-editor";
import { Composer } from "./composer";
import { Conversation } from "./conversation";
import { DEMO_STEPS } from "@/lib/demo/studio-fixtures";
import type { DemoAgent } from "@/lib/demo/demo-agent";
import type { StudioState } from "@/types/studio";
import { useMotionPreference } from "@/hooks/use-motion-preference";

const phaseLabels = {
  idle: "未开始",
  awaiting_approval: "等待批准",
  running: "正在演示",
  completed: "演示完成",
  failed: "演示失败",
  cancelled: "已取消",
};
const stepLabels = {
  pending: "未开始",
  active: "进行中",
  completed: "完成",
  failed: "失败",
  cancelled: "已取消",
};

export function AgentPanel({
  state,
  agent,
  inputRef,
  requestReset,
}: {
  state: StudioState;
  agent: DemoAgent;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  requestReset: (preset: boolean, trigger: HTMLElement) => void;
}) {
  const scrollArea = useRef<HTMLDivElement>(null);
  const planSection = useRef<HTMLElement>(null);
  const planShortcut = useRef<HTMLButtonElement>(null);
  const planRevealRequested = useRef(false);
  const reduceMotion = useMotionPreference();
  const cancelButton = useRef<HTMLButtonElement>(null);
  const approveButton = useRef<HTMLButtonElement>(null);
  const previousPhase = useRef(state.phase);
  const revealPlan = useCallback(() => {
    if (!planRevealRequested.current) return;
    planRevealRequested.current = false;
    if (document.activeElement === planShortcut.current)
      planSection.current?.scrollIntoView({ block: "end" });
  }, []);
  useEffect(() => {
    if (reduceMotion && state.planExpanded) revealPlan();
  }, [reduceMotion, state.planExpanded, revealPlan]);
  useEffect(() => {
    if (
      previousPhase.current === "running" &&
      state.phase !== "running" &&
      document.activeElement === document.body
    )
      inputRef.current?.focus();
    previousPhase.current = state.phase;
  }, [state.phase, inputRef]);
  const plan = (
    <ol className="studio-plan-steps">
      {DEMO_STEPS.map((title, index) => (
        <li key={title}>
          <span>
            {index + 1}. {title}
          </span>
          <span>{stepLabels[state.steps[index]]}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <section
      className="studio-agent studio-agent-panel"
      aria-labelledby="studio-agent-heading"
    >
      <header className="studio-agent-header">
        <Sparkles className="size-[18px] text-primary" aria-hidden="true" />
        <h2 id="studio-agent-heading" className="font-semibold">
          Creative Agent
        </h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label="新会话"
          onClick={(event) => requestReset(false, event.currentTarget)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </header>
      <div ref={scrollArea} className="studio-agent-scroll">
        <Conversation
          key={state.session}
          messages={state.messages}
          scrollArea={scrollArea}
        />
        {state.brief && (
          <BriefEditor
            brief={state.brief}
            running={state.phase === "running"}
            agent={agent}
          />
        )}
        {state.brief && (
          <section ref={planSection} className="studio-plan">
            <Button
              variant="secondary"
              className="w-full justify-between"
              aria-expanded={state.planExpanded}
              aria-controls="studio-plan-details"
              onClick={() => agent.setExpanded(!state.planExpanded)}
            >
              <span>演示计划 · r{state.revision}</span>
              <ChevronDown aria-hidden="true" />
            </Button>
            {reduceMotion ? (
              state.planExpanded && <div id="studio-plan-details">{plan}</div>
            ) : (
              <AnimatePresence initial={false}>
                {state.planExpanded && (
                  <motion.div
                    id="studio-plan-details"
                    key="animated-plan"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    onAnimationComplete={revealPlan}
                    className="overflow-hidden"
                  >
                    {plan}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </section>
        )}
      </div>
      <div className="studio-run-actions">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {phaseLabels[state.phase]} ·{" "}
            {state.brief ? `计划修订 r${state.revision}` : "空白会话"}
          </p>
          {state.brief && (
            <Button
              ref={planShortcut}
              size="sm"
              variant="ghost"
              aria-expanded={state.planExpanded}
              aria-controls="studio-plan-details"
              onClick={() => {
                planRevealRequested.current = true;
                if (state.planExpanded) revealPlan();
                else agent.setExpanded(true);
              }}
            >
              查看计划 · {DEMO_STEPS.length} 步
            </Button>
          )}
        </div>
        {state.phase === "awaiting_approval" && (
          <Button
            ref={approveButton}
            className="w-full"
            onClick={() => {
              if (agent.approve())
                requestAnimationFrame(() => cancelButton.current?.focus());
            }}
          >
            <Play aria-hidden="true" />
            批准并演示
          </Button>
        )}
        {state.phase === "running" && (
          <Button
            ref={cancelButton}
            variant="secondary"
            className="w-full"
            onClick={() => {
              agent.cancel();
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            <Square aria-hidden="true" />
            取消演示
          </Button>
        )}
        {["failed", "cancelled"].includes(state.phase) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              agent.review();
              requestAnimationFrame(() => approveButton.current?.focus());
            }}
          >
            重新审阅计划
          </Button>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <p
          className="text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {state.notice}
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <label htmlFor="studio-demo-scenario">开发演示场景</label>
            <select
              id="studio-demo-scenario"
              value={state.scenario}
              disabled={state.phase === "running"}
              onChange={(event) =>
                agent.setScenario(event.target.value as "success" | "failure")
              }
            >
              <option value="success">成功</option>
              <option value="failure">确定失败</option>
            </select>
          </div>
        )}
      </div>
      <Composer state={state} agent={agent} inputRef={inputRef} />
    </section>
  );
}
