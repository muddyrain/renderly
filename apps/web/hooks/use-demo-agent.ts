"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DemoAgent } from "@/lib/demo/demo-agent";

export function useDemoAgent() {
  const [agent] = useState(() => new DemoAgent());
  useEffect(() => {
    agent.activate();
    return () => agent.dispose();
  }, [agent]);
  const state = useSyncExternalStore(
    agent.subscribe,
    agent.getSnapshot,
    agent.getSnapshot,
  );
  return { agent, state };
}
