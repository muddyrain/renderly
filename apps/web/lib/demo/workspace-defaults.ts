import type {
  DemoModel,
  DemoModelConfig,
  PlanContext,
  WorkspacePreferences,
} from "../../types/workspace";
export const exampleModels: DemoModel[] = [
  {
    id: "scenic",
    name: "光景草图（示例）",
    capabilities: "风景方向、光线层次；本地模板，不执行推理",
  },
  {
    id: "study",
    name: "构图研究（示例）",
    capabilities: "主体留白、氛围参考；本地模板，不保证角色一致性",
  },
];
export const defaultModelConfig = (): DemoModelConfig => ({
  modelId: "scenic",
  detail: 5,
});
export const defaultPreferences = (): WorkspacePreferences => ({
  ratio: "3:2",
  density: "comfortable",
  motion: "system",
});
export const defaultPlanContext = (): PlanContext => ({
  project: null,
  model: { ...defaultModelConfig(), name: exampleModels[0].name },
});
export const effectiveReducedMotion = (
  system: boolean,
  app: WorkspacePreferences["motion"],
) => system || app === "reduce";
