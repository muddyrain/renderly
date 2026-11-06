import { notFound } from "next/navigation";

import { AgentPreview, CanvasPreview } from "@/components/design-system/preview-examples";
import { PreviewShell } from "@/components/layout/preview-shell";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <PreviewShell agent={<AgentPreview />}>
      <CanvasPreview />
    </PreviewShell>
  );
}
