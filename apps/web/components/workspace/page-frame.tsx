"use client";
import { WorkspacePageHeading } from "@/components/layout/workspace-page-heading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWorkspace } from "./workspace-provider";
import type { WorkspacePageKey } from "@/lib/workspace-pages";
export function PageFrame({
  page,
  children,
  action,
}: {
  page: WorkspacePageKey;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { state } = useWorkspace();
  return (
    <section className="workspace-section workspace-content">
      <div className="workspace-title-row">
        <WorkspacePageHeading pageKey={page} />
        {action}
      </div>
      <p className="workspace-session-note" role="status">
        {state.notice}
      </p>
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-collection-empty">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function ConfirmDialog({
  open,
  title,
  description,
  confirm,
  close,
  focusAfterClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirm: () => void;
  close: () => void;
  focusAfterClose?: () => HTMLElement | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) close();
      }}
    >
      <DialogContent
        onCloseAutoFocus={
          focusAfterClose
            ? (event) => {
                event.preventDefault();
                requestAnimationFrame(() => focusAfterClose()?.focus());
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" autoFocus onClick={close}>
            取消
          </Button>
          <Button
            onClick={() => {
              confirm();
              close();
            }}
          >
            确认操作
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
