"use client";

// React adaptation of Inspira AnimatedTabs (MIT, rahulv.dev), an authorized
// Aceternity Tabs port. See docs/design/ACETERNITY_SOURCE.md and INSPIRA_LICENSE.md.
import { useId, type ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { Image as ImageIcon, LayoutGrid } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-motion-preference";

export { Content as CanvasTabPanel } from "@radix-ui/react-tabs";
export type CanvasView = "canvas" | "variants";

export function CanvasTabs({
  value,
  onChange,
  actions,
  children,
}: {
  value: CanvasView;
  onChange: (value: CanvasView) => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const reduceMotion = useMotionPreference();
  const tabs = [
    { value: "canvas", title: "Canvas", icon: ImageIcon },
    { value: "variants", title: "Variants", icon: LayoutGrid },
  ] as const;

  return (
    <Tabs.Root
      value={value}
      onValueChange={(next) => onChange(next as CanvasView)}
      className="studio-canvas-tabs"
    >
      <div className="studio-canvas-toolbar">
        <Tabs.List aria-label="画布视图" className="studio-tab-list">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="studio-tab-trigger"
            >
              {value === tab.value &&
                (reduceMotion ? (
                  <span className="studio-tab-selection" />
                ) : (
                  <motion.span
                    layoutId={`animated-tabs-pill-${id}`}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="studio-tab-selection"
                    aria-hidden="true"
                  />
                ))}
              <tab.icon className="size-4" aria-hidden="true" />
              <span>{tab.title}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </Tabs.Root>
  );
}
