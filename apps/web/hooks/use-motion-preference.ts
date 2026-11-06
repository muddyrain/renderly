"use client";

import { useOptionalWorkspaceStore } from "@/components/workspace/workspace-provider";
import { effectiveReducedMotion } from "@/lib/demo/workspace-defaults";
import { useSyncExternalStore } from "react";

const preference = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(preference);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function snapshot() {
  return window.matchMedia(preference).matches;
}
function serverSnapshot() {
  return true;
}

export function useMotionPreference() {
  const store = useOptionalWorkspaceStore();
  const app = useSyncExternalStore<"system" | "reduce">(
    store?.subscribe ?? (() => () => {}),
    () => store?.getSnapshot().preferences.motion ?? "system",
    () => "system",
  );
  const system = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return effectiveReducedMotion(system, app);
}
