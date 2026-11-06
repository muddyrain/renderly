export type DemoPhase =
  | "idle"
  | "awaiting_approval"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type StepState =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "cancelled";
export type DemoScenario = "success" | "failure";

export interface CreativeBrief {
  goal: string;
  subject: string;
  direction: string;
  ratio: string;
  references: string[];
}

export interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface RunSnapshot {
  readonly id: number;
  readonly session: number;
  readonly revision: number;
  readonly brief: Readonly<
    Omit<CreativeBrief, "references"> & { references: readonly string[] }
  >;
  readonly steps: readonly string[];
  readonly scenario: DemoScenario;
}

export interface StudioState {
  session: number;
  revision: number;
  phase: DemoPhase;
  brief: CreativeBrief | null;
  messages: DemoMessage[];
  draft: string;
  planExpanded: boolean;
  steps: StepState[];
  run: RunSnapshot | null;
  result: {
    source: "preset" | "demo";
    revision: number;
    snapshot?: RunSnapshot;
  } | null;
  assetId: string;
  selections: Record<string, { versionId: string; variantId: string }>;
  scenario: DemoScenario;
  error: string | null;
  notice: string;
}

export interface DemoImage {
  id: string;
  src: string;
  title: string;
  alt: string;
  width: number;
  height: number;
}

export interface DemoAsset {
  id: string;
  title: string;
  versions: {
    id: string;
    label: string;
    prompt: string;
    variants: { id: string; title: string; imageId: string }[];
  }[];
}
