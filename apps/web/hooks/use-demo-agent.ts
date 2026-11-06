"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useWorkspace } from "@/components/workspace/workspace-provider";
export function useDemoAgent() {
  const { store } = useWorkspace();
  const agent = store.agent;
  useEffect(() => {
    store.consumeIntent();
    return () => agent.cancel();
  }, [agent, store]);
  const state = useSyncExternalStore(
    agent.subscribe,
    agent.getSnapshot,
    agent.getSnapshot,
  );
  return { agent, state };
}
