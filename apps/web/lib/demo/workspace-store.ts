import type {
  Character,
  DemoModelConfig,
  StudioIntent,
  WorkspaceAsset,
  WorkspacePreferences,
  WorkspaceState,
} from "../../types/workspace";
import { DemoAgent, type DemoAdapter } from "./demo-agent";
import {
  defaultBrief,
  demoAssets,
  demoImages,
  selectedArtwork,
} from "./studio-fixtures";
import {
  defaultModelConfig,
  defaultPreferences,
  exampleModels,
} from "./workspace-defaults";
import { initialWorkspace } from "./workspace-fixtures";

export interface AssetFilters {
  query: string;
  projectId: string;
  category: string;
  favorites: boolean;
}
export function filteredAssets(state: WorkspaceState, filters: AssetFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return state.assets.filter((asset) => {
    const project =
      state.projects.find((item) => item.id === asset.projectId)?.name ??
      "未归属";
    return (
      (!query ||
        `${asset.title} ${project} ${asset.category}`
          .toLocaleLowerCase()
          .includes(query)) &&
      (!filters.projectId ||
        (asset.projectId ?? "unassigned") === filters.projectId) &&
      (!filters.category || asset.category === filters.category) &&
      (!filters.favorites || asset.favorite)
    );
  });
}
export function assetArtwork(asset: WorkspaceAsset) {
  return selectedArtwork({
    assetId: asset.selection.assetId,
    selections: { [asset.selection.assetId]: asset.selection },
  });
}
export function comparisonArtwork(asset: WorkspaceAsset) {
  const current = assetArtwork(asset);
  const version = current.asset.versions.find(
    (v) => v.id !== current.version.id,
  );
  if (!version) return null;
  const variant =
    version.variants.find((v) => v.imageId !== current.image.id) ??
    version.variants[0];
  return {
    version,
    variant,
    image: demoImages.find((image) => image.id === variant.imageId)!,
  };
}
const validName = (name: string) =>
  [...name.trim()].length > 0 && [...name.trim()].length <= 120;

/** One browser workspace, intentionally discarded on refresh. No storage or provider IO. */
export class WorkspaceStore {
  private state: WorkspaceState;
  private listeners = new Set<() => void>();
  private sequence = 0;
  private recorded = new Set<string>();
  readonly agent: DemoAgent;
  constructor(
    seed = initialWorkspace(),
    adapter?: DemoAdapter,
    readonly connected = false,
  ) {
    this.state = structuredClone(seed);
    if (connected) {
      this.state.projects = [];
      this.state.activeProjectId = null;
      this.state.assets = this.state.assets.map((a) => ({
        ...a,
        projectId: null,
      }));
      this.state.characters = this.state.characters.map((c) => ({
        ...c,
        projectIds: [],
      }));
      this.state.notice =
        "正在加载数据库项目；创作记录、角色与偏好仍为本地演示。";
    }
    this.agent = new DemoAgent(adapter, true, {
      context: this.planContext,
      ratio: () => this.state.preferences.ratio,
    });
    this.agent.subscribe(this.recordCompleted);
  }
  replaceProjects = (
    projects: import("../../types/workspace").Project[],
    notice?: string,
  ) => {
    const valid = new Set(projects.map((p) => p.id));
    const oldActive = this.state.activeProjectId;
    this.update({
      projects: projects.map((p) => ({ ...p })),
      activeProjectId: oldActive && valid.has(oldActive) ? oldActive : null,
      assets: this.state.assets.map((a) =>
        a.projectId && !valid.has(a.projectId) ? { ...a, projectId: null } : a,
      ),
      characters: this.state.characters.map((c) => ({
        ...c,
        projectIds: c.projectIds.filter((id) => valid.has(id)),
      })),
      notice:
        notice ??
        (this.connected
          ? "项目列表已从本地数据库载入；创作、角色和偏好仍为演示。"
          : this.state.notice),
    });
    if (oldActive && !valid.has(oldActive)) this.agent.refreshContext();
    for (const p of projects) this.agent.syncProjectName(p.id, p.name);
  };
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<WorkspaceState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private id(kind: string) {
    return `${kind}-${++this.sequence}`;
  }
  private announce(notice: string, patch: Partial<WorkspaceState> = {}) {
    this.update({ ...patch, notice: `${notice} 本次演示有效，刷新重置。` });
  }
  planContext = () => {
    const project = this.state.projects.find(
      (item) => item.id === this.state.activeProjectId,
    );
    const model = this.state.models.find(
      (item) => item.id === this.state.modelConfig.modelId,
    );
    return {
      project: project ? { id: project.id, name: project.name } : null,
      model: model ? { ...this.state.modelConfig, name: model.name } : null,
    };
  };
  createProject(name: string, description: string) {
    if (this.connected) return false;
    if (!validName(name) || [...description.trim()].length > 1000) return false;
    const id = this.id("project");
    this.announce("项目已创建。", {
      projects: [
        ...this.state.projects,
        { id, name: name.trim(), description: description.trim() },
      ],
    });
    return id;
  }
  renameProject(id: string, name: string, description: string) {
    if (this.connected) return false;
    if (
      !validName(name) ||
      [...description.trim()].length > 1000 ||
      !this.state.projects.some((p) => p.id === id)
    )
      return false;
    this.announce("项目信息已更新。", {
      projects: this.state.projects.map((p) =>
        p.id === id
          ? { ...p, name: name.trim(), description: description.trim() }
          : p,
      ),
    });
    this.agent.syncProjectName(id, name.trim());
    return true;
  }
  selectProject(id: string | null) {
    if (id !== null && !this.state.projects.some((p) => p.id === id))
      return false;
    if (this.state.activeProjectId === id) return true;
    this.update({ activeProjectId: id });
    this.agent.refreshContext();
    this.announce("当前创作项目已切换，草稿保留。那些已批准的快照保持原值。");
    return true;
  }
  deleteProject(id: string) {
    if (this.connected) return false;
    if (!this.state.projects.some((p) => p.id === id)) return false;
    const active = this.state.activeProjectId === id;
    this.update({
      projects: this.state.projects.filter((p) => p.id !== id),
      assets: this.state.assets.map((a) =>
        a.projectId === id ? { ...a, projectId: null } : a,
      ),
      characters: this.state.characters.map((c) => ({
        ...c,
        projectIds: c.projectIds.filter((p) => p !== id),
      })),
      activeProjectId: active ? null : this.state.activeProjectId,
    });
    if (active) this.agent.refreshContext();
    this.announce("项目已删除，作品移至未归属，角色资料保留。");
    return true;
  }
  saveCharacter(id: string | null, values: Omit<Character, "id">) {
    if (
      !validName(values.name) ||
      !values.appearance.trim() ||
      !values.constraints.trim() ||
      values.appearance.length > 2000 ||
      values.constraints.length > 2000 ||
      values.references.some(
        (ref) => !demoImages.some((image) => image.id === ref),
      ) ||
      values.projectIds.some(
        (projectId) => !this.state.projects.some((p) => p.id === projectId),
      ) ||
      (id !== null && !this.state.characters.some((c) => c.id === id))
    )
      return false;
    const character = {
      ...values,
      id: id ?? this.id("character"),
      name: values.name.trim(),
      appearance: values.appearance.trim(),
      constraints: values.constraints.trim(),
      references: [...values.references],
      projectIds: [...values.projectIds],
    };
    this.announce("角色资料已更新；不保证模型输出的一致性。", {
      characters: id
        ? this.state.characters.map((c) => (c.id === id ? character : c))
        : [...this.state.characters, character],
    });
    return true;
  }
  deleteCharacter(id: string) {
    if (!this.state.characters.some((c) => c.id === id)) return false;
    this.announce("角色资料已删除，已经复制到 Brief 的文字与批准快照保留。", {
      characters: this.state.characters.filter((c) => c.id !== id),
      pendingIntent:
        this.state.pendingIntent?.kind === "character" &&
        this.state.pendingIntent.id === id
          ? null
          : this.state.pendingIntent,
    });
    return true;
  }
  toggleFavorite(id: string) {
    if (!this.state.assets.some((a) => a.id === id)) return false;
    this.update({
      assets: this.state.assets.map((a) =>
        a.id === id ? { ...a, favorite: !a.favorite } : a,
      ),
    });
    return true;
  }
  selectAssetVersion(id: string, versionId: string, variantId?: string) {
    const asset = this.state.assets.find((a) => a.id === id);
    const template = demoAssets.find((a) => a.id === asset?.selection.assetId);
    const version = template?.versions.find((v) => v.id === versionId);
    const variant = variantId
      ? version?.variants.find((v) => v.id === variantId)
      : version?.variants[0];
    if (!asset || !version || !variant) return false;
    this.update({
      assets: this.state.assets.map((a) =>
        a.id === id
          ? {
              ...a,
              selection: {
                assetId: a.selection.assetId,
                versionId,
                variantId: variant.id,
                imageId: variant.imageId,
              },
            }
          : a,
      ),
    });
    return true;
  }
  removeAsset(id: string) {
    if (!this.state.assets.some((a) => a.id === id)) return false;
    this.announce("作品已从本次 Gallery 移除。", {
      assets: this.state.assets.filter((a) => a.id !== id),
      pendingIntent:
        this.state.pendingIntent?.kind === "asset" &&
        this.state.pendingIntent.id === id
          ? null
          : this.state.pendingIntent,
    });
    return true;
  }
  queueIntent(intent: StudioIntent) {
    if (intent.kind === "asset") {
      const asset = this.state.assets.find((a) => a.id === intent.id);
      if (
        !asset ||
        !(["assetId", "versionId", "variantId", "imageId"] as const).every(
          (key) => asset.selection[key] === intent.selection[key],
        )
      )
        return false;
    } else if (!this.state.characters.some((c) => c.id === intent.id))
      return false;
    this.update({ pendingIntent: structuredClone(intent) });
    return true;
  }
  consumeIntent = () => {
    const intent = this.state.pendingIntent;
    if (!intent) return false;
    // Clear before applying: StrictMode and history navigation cannot replay it.
    this.update({ pendingIntent: null });
    this.agent.cancel();
    const previous = this.agent.getSnapshot();
    const brief = previous.brief ?? {
      ...defaultBrief(),
      ratio: this.state.preferences.ratio,
    };
    if (intent.kind === "asset") {
      const asset = this.state.assets.find((a) => a.id === intent.id);
      if (!asset) return false;
      this.selectProject(asset.projectId);
      this.agent.selectAsset(intent.selection.assetId);
      this.agent.selectVersion(intent.selection.versionId);
      this.agent.selectVariant(intent.selection.variantId);
      this.agent.applyBrief({
        ...brief,
        references: [intent.selection.imageId],
      });
      if (!previous.draft)
        this.agent.setDraft(`参考样图“${asset.title}”，我想继续探索：`);
    } else {
      const character = this.state.characters.find((c) => c.id === intent.id);
      if (!character) return false;
      this.agent.applyBrief({
        ...brief,
        subject: `${character.name}：${character.appearance}`,
        direction: character.constraints,
        references: [...character.references],
      });
      if (!previous.draft)
        this.agent.setDraft(`围绕角色“${character.name}”继续探索：`);
    }
    this.agent.refreshContext();
    return true;
  };
  applyModel(config: DemoModelConfig) {
    if (
      !this.state.models.some((m) => m.id === config.modelId) ||
      !Number.isInteger(config.detail) ||
      config.detail < 1 ||
      config.detail > 10
    )
      return false;
    this.announce("示例模型配置已应用到后续计划，Provider 仍未连接。", {
      modelConfig: { ...config },
    });
    if (this.agent.getSnapshot().phase !== "running")
      this.agent.refreshContext();
    return true;
  }
  resetModels() {
    this.update({
      models: exampleModels.map((m) => ({ ...m })),
      modelConfig: defaultModelConfig(),
    });
    if (this.agent.getSnapshot().phase !== "running")
      this.agent.refreshContext();
    this.announce("示例模型配置已恢复。");
  }
  applyPreferences(values: WorkspacePreferences) {
    if (
      !["3:2", "1:1", "16:9", "9:16"].includes(values.ratio) ||
      !["comfortable", "compact"].includes(values.density) ||
      !["system", "reduce"].includes(values.motion)
    )
      return false;
    this.announce("偏好已应用；默认画幅只用于新建或重置的 Brief。", {
      preferences: { ...values },
    });
    return true;
  }
  resetPreferences() {
    this.applyPreferences(defaultPreferences());
  }
  private recordCompleted = () => {
    const studio = this.agent.getSnapshot();
    const snapshot = studio.result?.snapshot;
    if (studio.phase !== "completed" || !snapshot) return;
    const key = `${snapshot.session}:${snapshot.id}`;
    if (this.recorded.has(key)) return;
    this.recorded.add(key);
    const projectId = snapshot.context.project?.id ?? null;
    const image = demoImages.find((i) => i.id === snapshot.artwork.imageId)!;
    this.announce("本地演示结果已加入 Gallery 一次；图片仍为预置素材。", {
      assets: [
        ...this.state.assets,
        {
          id: this.id("result"),
          title: `演示 · ${image.title} · r${snapshot.revision}`,
          projectId: this.state.projects.some((p) => p.id === projectId)
            ? projectId
            : null,
          category: "风景",
          source: "demo",
          favorite: false,
          selection: { ...snapshot.artwork },
          snapshot,
        },
      ],
    });
  };
  /** Development-only caller and isolated tests; does not preserve a previous fixture. */
  loadFixture(empty: boolean) {
    if (this.connected) return;
    this.agent.cancel();
    this.update(initialWorkspace(empty));
    this.agent.reset(!empty);
  }
}
