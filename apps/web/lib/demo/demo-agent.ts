import type {
  CreativeBrief,
  DemoScenario,
  RunSnapshot,
  StudioState,
} from "@/types/studio";
import {
  defaultBrief,
  DEMO_STEPS,
  initialStudioState,
  MAX_PROMPT_LENGTH,
  demoAssets,
  selectedArtwork,
} from "./studio-fixtures";
import { defaultPlanContext } from "./workspace-defaults";

export type DemoEvent =
  | { type: "step"; index: number }
  | { type: "complete" }
  | { type: "failure"; message: string };
export interface DemoAdapter {
  start(snapshot: RunSnapshot, publish: (event: DemoEvent) => void): () => void;
}
export interface DemoClock {
  schedule(callback: () => void, delay: number): () => void;
}

const browserClock: DemoClock = {
  schedule(callback, delay) {
    const handle = setTimeout(callback, delay);
    return () => clearTimeout(handle);
  },
};

export function createDemoAdapter(
  clock: DemoClock = browserClock,
): DemoAdapter {
  return {
    start(snapshot, publish) {
      const cancel = [
        clock.schedule(() => publish({ type: "step", index: 1 }), 600),
        clock.schedule(
          () =>
            snapshot.scenario === "failure"
              ? publish({
                  type: "failure",
                  message:
                    "本地演示场景主动返回失败，没有调用生成服务。请重新审阅后再次批准。",
                })
              : publish({ type: "step", index: 2 }),
          1200,
        ),
        clock.schedule(() => publish({ type: "complete" }), 2100),
      ];
      return () => cancel.forEach((stop) => stop());
    },
  };
}

export function canSendPrompt(
  text: string,
  phase: StudioState["phase"],
  composing = false,
  keyCode = 0,
) {
  return (
    !composing &&
    keyCode !== 229 &&
    phase !== "running" &&
    text.trim().length > 0 &&
    text.length <= MAX_PROMPT_LENGTH
  );
}

export function briefErrors(brief: CreativeBrief) {
  return Object.fromEntries(
    (["goal", "subject", "direction", "ratio"] as const)
      .filter((key) => !brief[key].trim())
      .map((key) => [key, "此项不能为空。"]),
  );
}

export class DemoAgent {
  private state: StudioState;
  private listeners = new Set<() => void>();
  private cancelRun: (() => void) | null = null;
  private generation = 0;
  private sequence = 0;
  private active = true;

  constructor(
    private adapter: DemoAdapter = createDemoAdapter(),
    preset = true,
    private environment = { context: defaultPlanContext, ratio: () => "3:2" },
  ) {
    this.state = initialStudioState(1, preset);
    this.state.context = this.environment.context();
    if (this.state.brief) this.state.brief.ratio = this.environment.ratio();
  }

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  activate = () => {
    this.active = true;
  };
  private update(patch: Partial<StudioState>) {
    if (!this.active) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private invalidate() {
    this.generation++;
    this.cancelRun?.();
    this.cancelRun = null;
  }
  dispose = () => {
    this.invalidate();
    this.active = false;
  };
  setDraft = (draft: string) => this.update({ draft });
  setExpanded = (planExpanded: boolean) => this.update({ planExpanded });
  setScenario = (scenario: DemoScenario) => {
    if (this.state.phase !== "running") this.update({ scenario });
  };

  send = (composing = false, keyCode = 0) => {
    const state = this.state;
    if (
      !this.active ||
      !canSendPrompt(state.draft, state.phase, composing, keyCode)
    )
      return false;
    const text = state.draft.trim();
    const revision = state.revision + 1;
    this.update({
      draft: "",
      revision,
      brief: {
        ...(state.brief ?? {
          ...defaultBrief(),
          ratio: this.environment.ratio(),
        }),
        goal: text,
      },
      context: this.environment.context(),
      phase: "awaiting_approval",
      steps: ["pending", "pending", "pending"],
      run: null,
      error: null,
      messages: [
        ...state.messages,
        { id: `${state.session}:user:${revision}`, role: "user", text },
        {
          id: `${state.session}:assistant:${revision}`,
          role: "assistant",
          text: "本地模板回复：你的原文已作为目标；主体、方向与画幅沿用当前 Brief 或示例默认值，请手工审阅。计划尚未执行。",
        },
      ],
      notice: `演示计划修订 ${revision} 等待批准；没有发送模型请求。`,
    });
    return true;
  };

  applyBrief = (brief: CreativeBrief) => {
    if (
      !this.active ||
      this.state.phase === "running" ||
      Object.keys(briefErrors(brief)).length
    )
      return false;
    const normalized = {
      ...brief,
      goal: brief.goal.trim(),
      subject: brief.subject.trim(),
      direction: brief.direction.trim(),
      ratio: brief.ratio.trim(),
      references: [...brief.references],
    };
    if (JSON.stringify(normalized) === JSON.stringify(this.state.brief))
      return true;
    this.update({
      brief: normalized,
      context: this.environment.context(),
      revision: this.state.revision + 1,
      phase: "awaiting_approval",
      run: null,
      steps: ["pending", "pending", "pending"],
      error: null,
      notice: "Brief 已应用到本次演示，旧批准失效，请重新审阅。",
    });
    return true;
  };

  approve = () => {
    const state = this.state;
    if (
      !this.active ||
      state.phase !== "awaiting_approval" ||
      !state.brief ||
      !state.context.model
    )
      return false;
    const { asset, version, variant, image } = selectedArtwork(state);
    const token = ++this.generation;
    const snapshot: RunSnapshot = Object.freeze({
      id: ++this.sequence,
      session: state.session,
      revision: state.revision,
      scenario: state.scenario,
      context: Object.freeze({
        project: state.context.project
          ? Object.freeze({ ...state.context.project })
          : null,
        model: state.context.model
          ? Object.freeze({ ...state.context.model })
          : null,
      }),
      artwork: Object.freeze({
        assetId: asset.id,
        versionId: version.id,
        variantId: variant.id,
        imageId: image.id,
      }),
      brief: Object.freeze({
        ...state.brief,
        references: Object.freeze([...state.brief.references]),
      }),
      steps: Object.freeze([...DEMO_STEPS]),
    });
    this.update({
      phase: "running",
      run: snapshot,
      error: null,
      steps: ["active", "pending", "pending"],
      notice: "正在演示步骤；当前批准的修订已锁定。",
    });
    const publish = (event: DemoEvent) => {
      if (
        !this.active ||
        token !== this.generation ||
        this.state.phase !== "running" ||
        this.state.session !== snapshot.session ||
        this.state.run?.id !== snapshot.id
      )
        return;
      if (event.type === "step") {
        this.update({
          steps: DEMO_STEPS.map((_, index) =>
            index < event.index
              ? "completed"
              : index === event.index
                ? "active"
                : "pending",
          ),
        });
      } else if (event.type === "failure") {
        this.invalidate();
        this.update({
          phase: "failed",
          error: event.message,
          steps: this.state.steps.map((step) =>
            step === "active" ? "failed" : step,
          ),
          notice: "演示失败；没有完成或生成新图。",
        });
      } else {
        this.invalidate();
        this.update({
          phase: "completed",
          steps: ["completed", "completed", "completed"],
          result: { source: "demo", revision: snapshot.revision, snapshot },
          messages: [
            ...this.state.messages,
            {
              id: `${snapshot.session}:result:${snapshot.id}`,
              role: "assistant",
              text: "本地演示已完成：预置素材已加入本次 Gallery，没有生成或上传图片；刷新重置。",
            },
          ],
          notice: "演示完成，画布显示预置样例结果。",
        });
      }
    };
    try {
      const cancel = this.adapter.start(snapshot, publish);
      if (token === this.generation && this.state.phase === "running")
        this.cancelRun = cancel;
      else cancel();
    } catch {
      publish({
        type: "failure",
        message: "本地演示无法启动。请重新审阅后重试，没有调用生成服务。",
      });
    }
    return true;
  };

  cancel = () => {
    if (this.state.phase !== "running") return;
    this.invalidate();
    this.update({
      phase: "cancelled",
      steps: this.state.steps.map((step) =>
        step === "completed" ? step : "cancelled",
      ),
      notice: "演示已取消，旧回调不会写入结果。",
    });
  };
  review = () => {
    if (!["failed", "cancelled"].includes(this.state.phase)) return;
    this.update({
      phase: "awaiting_approval",
      run: null,
      steps: ["pending", "pending", "pending"],
      error: null,
      notice: "请重新审阅并明确批准，尚未开始重试。",
    });
  };
  reset = (preset = false) => {
    this.invalidate();
    const next = initialStudioState(this.state.session + 1, preset);
    next.context = this.environment.context();
    if (next.brief) next.brief.ratio = this.environment.ratio();
    this.update(next);
  };
  refreshContext = () => {
    this.cancel();
    this.update({
      context: this.environment.context(),
      revision: this.state.revision + 1,
      phase: this.state.brief ? "awaiting_approval" : "idle",
      run: null,
      steps: ["pending", "pending", "pending"],
      notice: "创作上下文已更新，原批准失效；草稿保留，请重新审阅。",
    });
  };
  selectAsset = (assetId: string) => {
    if (demoAssets.some((asset) => asset.id === assetId))
      this.update({ assetId });
  };
  selectVersion = (versionId: string) => {
    const { asset } = selectedArtwork(this.state);
    const version = asset.versions.find((item) => item.id === versionId);
    if (version)
      this.update({
        selections: {
          ...this.state.selections,
          [asset.id]: { versionId, variantId: version.variants[0].id },
        },
      });
  };
  selectVariant = (variantId: string) => {
    const { asset, version } = selectedArtwork(this.state);
    if (version.variants.some((item) => item.id === variantId))
      this.update({
        selections: {
          ...this.state.selections,
          [asset.id]: { versionId: version.id, variantId },
        },
      });
  };
}
