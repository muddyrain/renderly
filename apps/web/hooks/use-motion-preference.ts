"use client";

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
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
