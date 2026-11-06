import type { LucideIcon } from "lucide-react";

export function WorkspaceEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="workspace-empty-state">
      <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
