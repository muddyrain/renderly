"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { WorkspaceStore } from "@/lib/demo/workspace-store";

const WorkspaceContext = createContext<WorkspaceStore | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => new WorkspaceStore());
  useEffect(() => {
    store.agent.activate();
    if (process.env.NODE_ENV === "development") {
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
    <WorkspaceContext.Provider value={store}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useOptionalWorkspaceStore() {
  return useContext(WorkspaceContext);
}
export function useWorkspace() {
  const store = useContext(WorkspaceContext);
  if (!store) throw new Error("WorkspaceProvider is required");
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return { store, state };
}
