import type { RunSnapshot } from "./studio";

export interface Project {
  id: string;
  name: string;
  description: string;
}
export interface Character {
  id: string;
  name: string;
  appearance: string;
  constraints: string;
  references: string[];
  projectIds: string[];
}
export interface DemoModel {
  id: string;
  name: string;
  capabilities: string;
}
export interface DemoModelConfig {
  modelId: string;
  detail: number;
}
export interface WorkspacePreferences {
  ratio: string;
  density: "comfortable" | "compact";
  motion: "system" | "reduce";
}
export interface PlanContext {
  project: Readonly<Pick<Project, "id" | "name">> | null;
  model: Readonly<DemoModelConfig & { name: string }> | null;
}
export interface ArtworkSelection {
  assetId: string;
  versionId: string;
  variantId: string;
  imageId: string;
}
export interface WorkspaceAsset {
  id: string;
  title: string;
  projectId: string | null;
  category: "风景" | "光线";
  source: "preset" | "demo";
  favorite: boolean;
  selection: ArtworkSelection;
  snapshot?: RunSnapshot;
}
export type StudioIntent =
  | { kind: "asset"; id: string; selection: ArtworkSelection }
  | { kind: "character"; id: string };
export interface WorkspaceState {
  projects: Project[];
  assets: WorkspaceAsset[];
  characters: Character[];
  activeProjectId: string | null;
  models: DemoModel[];
  modelConfig: DemoModelConfig;
  preferences: WorkspacePreferences;
  pendingIntent: StudioIntent | null;
  notice: string;
}
