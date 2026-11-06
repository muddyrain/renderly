"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  ProjectSync,
  type ProjectSyncState,
} from "@/lib/projects/project-sync";
import { createProjectAPI } from "@/lib/projects/project-api";
import { WorkspaceStore } from "@/lib/demo/workspace-store";

const WorkspaceContext = createContext<{
  store: WorkspaceStore;
  projects: ProjectSync | null;
} | null>(null);
export type WorkspaceConnection =
  | { mode: "demo" }
  | { mode: "api"; workspaceId: string };
const demoConnection: WorkspaceConnection = { mode: "demo" };
const demoProjectState: ProjectSyncState = {
  status: "ready",
  pending: false,
  error: null,
  uncertain: false,
};
const noopSubscribe = () => () => {};
export function WorkspaceProvider({
  children,
  connection = demoConnection,
}: {
  children: React.ReactNode;
  connection?: WorkspaceConnection;
}) {
  const [value] = useState(() => {
    const store = new WorkspaceStore(
      undefined,
      undefined,
      connection.mode === "api",
    );
    return {
      store,
      projects:
        connection.mode === "api"
          ? new ProjectSync(
              createProjectAPI(connection.workspaceId),
              store.replaceProjects,
            )
          : null,
    };
  });
  const { store, projects } = value;
  const pathname = usePathname();
  useEffect(() => {
    if (!projects) return;
    projects.activate();
    const refresh = () => {
      void projects.load();
    };
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      projects.dispose();
    };
  }, [projects]);
  useEffect(() => {
    if (projects) void projects.load();
  }, [pathname, projects]);
  useEffect(() => {
    store.agent.activate();
    if (process.env.NODE_ENV === "development" && !store.connected) {
      const target = window as Window & {
        __renderlyDemoTest?: {
          loadFixture: (name: "empty" | "default") => void;
        };
      };
      target.__renderlyDemoTest = {
        loadFixture: (name) => store.loadFixture(name === "empty"),
      };
      return () => {
        delete target.__renderlyDemoTest;
        store.agent.dispose();
      };
    }
    return () => store.agent.dispose();
  }, [store]);
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useOptionalWorkspaceStore() {
  return useContext(WorkspaceContext)?.store ?? null;
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("WorkspaceProvider is required");
  const { store, projects } = value;
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return { store, state, projects };
}

export function useProjectConnection() {
  const value = useContext(WorkspaceContext);
  const projects = value?.projects ?? null;
  const state = useSyncExternalStore(
    projects?.subscribe ?? noopSubscribe,
    projects?.getSnapshot ?? (() => demoProjectState),
    () => demoProjectState,
  );
  return { projects, state, connected: Boolean(projects) };
}
