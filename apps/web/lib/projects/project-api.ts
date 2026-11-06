import type { Project } from "../../types/workspace";
export interface SavedProject extends Project {
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export interface ProjectPage {
  items: SavedProject[];
  total: number;
  limit: number;
  offset: number;
}
export interface ProjectAPI {
  list(signal: AbortSignal): Promise<SavedProject[]>;
  create(
    values: Pick<Project, "name" | "description">,
    signal: AbortSignal,
  ): Promise<SavedProject>;
  update(
    id: string,
    values: Pick<Project, "name" | "description">,
    signal: AbortSignal,
  ): Promise<SavedProject>;
  remove(id: string, signal: AbortSignal): Promise<void>;
}
export class ProjectRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export const trimProjectText = (text: string) =>
  text.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, "");
export const codePoints = (text: string) => [...text].length;
export function validProject(values: Pick<Project, "name" | "description">) {
  return (
    codePoints(trimProjectText(values.name)) >= 1 &&
    codePoints(trimProjectText(values.name)) <= 120 &&
    codePoints(trimProjectText(values.description)) <= 1000 &&
    !values.name.includes("\0") &&
    !values.description.includes("\0")
  );
}
export function createProjectAPI(
  workspaceId: string,
  fetcher: typeof fetch = fetch,
): ProjectAPI {
  workspaceId = workspaceId.toLowerCase();
  const base = `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/projects`;
  async function request<T>(
    path: string,
    method: string,
    signal: AbortSignal,
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(base + path, {
        method,
        signal,
        cache: "no-store",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ProjectRequestError(
        "无法确认项目服务响应，请重新载入确认，勿重复提交。",
        0,
      );
    }
    if (!response.ok) {
      let message = "项目请求失败，请重新载入确认。";
      try {
        const error = await response.json();
        if (typeof error.message === "string") message = error.message;
      } catch {}
      throw new ProjectRequestError(message, response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
  return {
    async list(signal) {
      const items: SavedProject[] = [];
      let offset = 0;
      let expectedTotal: number | undefined;
      do {
        const page = await request<ProjectPage>(
          `?limit=100&offset=${offset}`,
          "GET",
          signal,
        );
        if (
          !Array.isArray(page.items) ||
          !Number.isInteger(page.total) ||
          page.total < 0 ||
          page.limit !== 100 ||
          page.offset !== offset ||
          page.items.some((p) => p.workspace_id !== workspaceId)
        )
          throw new ProjectRequestError("项目列表响应无效，请重新载入。", 502);
        if (expectedTotal !== undefined && expectedTotal !== page.total)
          throw new ProjectRequestError(
            "项目列表已变化，请重新载入完整列表。",
            409,
          );
        expectedTotal = page.total;
        items.push(...page.items);
        offset += page.items.length;
        if (offset < page.total && page.items.length === 0)
          throw new ProjectRequestError("项目分页不完整，请重新载入。", 502);
      } while (offset < (expectedTotal ?? 0));
      if (
        new Set(items.map((p) => p.id)).size !== items.length ||
        items.length !== expectedTotal
      )
        throw new ProjectRequestError(
          "项目顺序已变化，请重新载入完整列表。",
          409,
        );
      return items;
    },
    create: (values, signal) =>
      request<SavedProject>("", "POST", signal, values),
    update: (id, values, signal) =>
      request<SavedProject>(
        `/${encodeURIComponent(id)}`,
        "PATCH",
        signal,
        values,
      ),
    remove: (id, signal) =>
      request<void>(`/${encodeURIComponent(id)}`, "DELETE", signal),
  };
}
