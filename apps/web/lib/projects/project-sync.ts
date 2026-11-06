import type { Project } from "../../types/workspace";
import {
  ProjectRequestError,
  validProject,
  type ProjectAPI,
  type SavedProject,
} from "./project-api";
export interface ProjectSyncState {
  status: "idle" | "loading" | "ready" | "error";
  pending: boolean;
  error: string | null;
  uncertain: boolean;
}
/** One fixed workspace; only acknowledged mutations replace shared project values. */
export class ProjectSync {
  private state: ProjectSyncState = {
    status: "idle",
    pending: false,
    error: null,
    uncertain: false,
  };
  private listeners = new Set<() => void>();
  private active = true;
  private generation = 0;
  private loadRequest: AbortController | null = null;
  private writeRequest: AbortController | null = null;
  private projects: SavedProject[] = [];
  constructor(
    private api: ProjectAPI,
    private publish: (projects: Project[], notice?: string) => void,
  ) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<ProjectSyncState>) {
    if (!this.active) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  activate = () => {
    this.active = true;
  };
  dispose = () => {
    if (this.state.pending)
      this.state = {
        ...this.state,
        pending: false,
        status: "error",
        uncertain: true,
        error: "前次操作中断，请重新载入核对，勿重复提交。",
      };
    this.active = false;
    this.generation++;
    this.loadRequest?.abort();
    this.writeRequest?.abort();
  };
  private invalidateList() {
    this.generation++;
    this.loadRequest?.abort();
    this.loadRequest = null;
  }
  load = async () => {
    if (!this.active || this.state.pending) return false;
    this.invalidateList();
    const generation = this.generation;
    const request = new AbortController();
    this.loadRequest = request;
    this.update({ status: "loading", error: null });
    try {
      const projects = await this.api.list(request.signal);
      if (
        !this.active ||
        request.signal.aborted ||
        generation !== this.generation
      )
        return false;
      this.projects = projects;
      this.publish(projects);
      this.update({
        status: "ready",
        error: this.state.uncertain
          ? "列表已重新载入，请核对操作是否已经生效。"
          : null,
      });
      return true;
    } catch (error) {
      if (
        !this.active ||
        request.signal.aborted ||
        generation !== this.generation
      )
        return false;
      this.update({
        status: "error",
        error:
          error instanceof Error ? error.message : "项目加载失败，请重试。",
      });
      return false;
    }
  };
  acknowledgeUncertain = () => {
    if (this.state.status === "ready")
      this.update({ uncertain: false, error: null });
  };
  save = (id: string | null, values: Pick<Project, "name" | "description">) =>
    this.mutate(id ? "update" : "create", id, values);
  remove = (id: string) => this.mutate("delete", id);
  private async mutate(
    kind: "create" | "update" | "delete",
    id: string | null,
    values?: Pick<Project, "name" | "description">,
  ) {
    if (!this.active || this.state.pending || this.state.uncertain)
      return false;
    if (values && !validProject(values)) {
      this.update({
        error: "名称需为 1–120 个 Unicode 字符，描述最多 1000 字符。",
      });
      return false;
    }
    this.invalidateList();
    const generation = this.generation;
    const request = new AbortController();
    this.writeRequest = request;
    this.update({ pending: true, error: null });
    try {
      if (kind === "delete") {
        await this.api.remove(id!, request.signal);
      } else {
        const project =
          kind === "create"
            ? await this.api.create(values!, request.signal)
            : await this.api.update(id!, values!, request.signal);
        if (
          !this.active ||
          request.signal.aborted ||
          generation !== this.generation
        )
          return false;
        this.projects = [
          ...this.projects.filter((p) => p.id !== project.id),
          project,
        ].sort(
          (a, b) =>
            b.updated_at.localeCompare(a.updated_at) ||
            b.id.localeCompare(a.id),
        );
      }
      if (
        !this.active ||
        request.signal.aborted ||
        generation !== this.generation
      )
        return false;
      if (kind === "delete")
        this.projects = this.projects.filter((p) => p.id !== id);
      this.publish(
        this.projects,
        kind === "delete"
          ? "项目已从数据库软删除；临时作品移至未归属。"
          : "项目已保存至本地数据库。",
      );
      this.update({ pending: false, status: "ready", error: null });
      this.writeRequest = null;
      void this.load();
      return true;
    } catch (error) {
      if (
        !this.active ||
        request.signal.aborted ||
        generation !== this.generation
      )
        return false;
      const uncertain =
        !(error instanceof ProjectRequestError) ||
        error.status === 0 ||
        error.status >= 500;
      this.update({
        pending: false,
        status: "error",
        uncertain,
        error: uncertain
          ? "操作结果未确认。请重新载入核对后再操作，勿重复提交。"
          : error instanceof Error
            ? error.message
            : "项目操作失败。",
      });
      this.writeRequest = null;
      return false;
    }
  }
}
