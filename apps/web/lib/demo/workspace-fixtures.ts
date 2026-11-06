import type { WorkspaceState } from "../../types/workspace";
import {
  defaultModelConfig,
  defaultPreferences,
  exampleModels,
} from "./workspace-defaults";
export function initialWorkspace(empty = false): WorkspaceState {
  return {
    projects: empty
      ? []
      : [
          {
            id: "nature",
            name: "自然光景提案",
            description: "观察山地、草坡与自然光的层次。",
          },
          {
            id: "woodland",
            name: "林间光线研究",
            description: "收集林木与薄雾的氛围参考。",
          },
        ],
    assets: empty
      ? []
      : [
          {
            id: "sample-ridge",
            title: "雪山与河谷",
            projectId: "nature",
            category: "风景",
            source: "preset",
            favorite: false,
            selection: {
              assetId: "landscape-study",
              versionId: "v1",
              variantId: "ridge",
              imageId: "mountain",
            },
          },
          {
            id: "sample-dawn",
            title: "晨光草坡",
            projectId: "nature",
            category: "光线",
            source: "preset",
            favorite: true,
            selection: {
              assetId: "landscape-study",
              versionId: "v2",
              variantId: "soft-dawn",
              imageId: "meadow",
            },
          },
          {
            id: "sample-forest",
            title: "林间光束",
            projectId: "woodland",
            category: "光线",
            source: "preset",
            favorite: false,
            selection: {
              assetId: "forest-study",
              versionId: "v1",
              variantId: "forest-light",
              imageId: "forest",
            },
          },
        ],
    characters: empty
      ? []
      : [
          {
            id: "walker",
            name: "林间旅人",
            appearance: "短发，深灰外套，背着轻便背包。",
            constraints: "保留外套与背包；自然光，避免文字与标识。",
            references: ["forest"],
            projectIds: ["woodland"],
          },
        ],
    activeProjectId: empty ? null : "nature",
    models: empty ? [] : exampleModels.map((model) => ({ ...model })),
    modelConfig: defaultModelConfig(),
    preferences: defaultPreferences(),
    pendingIntent: null,
    notice: "本次演示有效，刷新重置；所有图片均为本地预置素材。",
  };
}
