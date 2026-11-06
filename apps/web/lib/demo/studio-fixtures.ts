import type {
  CreativeBrief,
  DemoAsset,
  DemoImage,
  StudioState,
} from "@/types/studio";
import { defaultPlanContext } from "./workspace-defaults";

export const DEMO_STEPS = [
  "整理演示方向",
  "准备预置样图",
  "展示演示结果",
] as const;
export const MAX_PROMPT_LENGTH = 4000;

export const demoImages: DemoImage[] = [
  {
    id: "mountain",
    src: "/demo/mountain.jpg",
    title: "雪山与河谷",
    alt: "蓝天下的雪山、河谷与前景针叶林",
    width: 1400,
    height: 933,
  },
  {
    id: "meadow",
    src: "/demo/meadow.jpg",
    title: "晨光草坡",
    alt: "金色晨光穿过薄雾，照亮草坡和树木",
    width: 1400,
    height: 933,
  },
  {
    id: "forest",
    src: "/demo/forest.jpg",
    title: "林间光束",
    alt: "高大树木之间的薄雾与林间光束",
    width: 1400,
    height: 933,
  },
];

export const demoAssets: DemoAsset[] = [
  {
    id: "landscape-study",
    title: "自然光景提案",
    versions: [
      {
        id: "v1",
        label: "v1 · 预置冷色方案",
        prompt: "以山地和林木为主体，保持自然色彩，突出层次与远近关系。",
        variants: [
          { id: "ridge", title: "山谷方向", imageId: "mountain" },
          { id: "dawn", title: "晨光方向", imageId: "meadow" },
        ],
      },
      {
        id: "v2",
        label: "v2 · 预置暖光方案",
        prompt:
          "围绕自然光景提案，改为柔和晨光与近景草坡；此为预置备选，不是照片编辑。",
        variants: [
          { id: "soft-dawn", title: "柔光方向", imageId: "meadow" },
          { id: "clear-ridge", title: "清晰山谷", imageId: "mountain" },
        ],
      },
    ],
  },
  {
    id: "forest-study",
    title: "林间光线研究",
    versions: [
      {
        id: "v1",
        label: "v1 · 预置林间方案",
        prompt: "保留林木与自然光束，使用真实照片观察光线层次。",
        variants: [
          { id: "forest-light", title: "林间方向", imageId: "forest" },
        ],
      },
    ],
  },
];

export function defaultBrief(goal = "探索自然主题视觉提案"): CreativeBrief {
  return {
    goal,
    subject: "自然风景展示",
    direction: "克制、真实的自然光；突出主体与留白",
    ratio: "3:2",
    references: ["forest"],
  };
}

export function initialStudioState(session = 1, preset = true): StudioState {
  return {
    session,
    context: defaultPlanContext(),
    revision: preset ? 1 : 0,
    phase: preset ? "awaiting_approval" : "idle",
    brief: preset ? defaultBrief() : null,
    messages: preset
      ? [
          {
            id: `${session}:preset-user`,
            role: "user",
            text: "我想探索一组安静的自然风景视觉提案，突出自然光与空间层次。",
          },
          {
            id: `${session}:preset-assistant`,
            role: "assistant",
            text: "这是本地模板的演示回复。我已填入一份可编辑的 Brief 和待审阅计划。右侧是预置样图，尚未执行当前计划。",
          },
        ]
      : [],
    draft: "",
    planExpanded: false,
    steps: ["pending", "pending", "pending"],
    run: null,
    result: preset ? { source: "preset", revision: 0 } : null,
    assetId: demoAssets[0].id,
    selections: {},
    scenario: "success",
    error: null,
    notice: preset
      ? "预置演示已载入，计划等待批准。"
      : "新会话已清空。可输入需求或显式载入示例。",
  };
}

export function selectedArtwork(
  state: Pick<StudioState, "assetId" | "selections">,
) {
  const asset =
    demoAssets.find((item) => item.id === state.assetId) ?? demoAssets[0];
  const choice = state.selections[asset.id];
  const version =
    asset.versions.find((item) => item.id === choice?.versionId) ??
    asset.versions[0];
  const variant =
    version.variants.find((item) => item.id === choice?.variantId) ??
    version.variants[0];
  const image = demoImages.find((item) => item.id === variant.imageId)!;
  return { asset, version, variant, image };
}
