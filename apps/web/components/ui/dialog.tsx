"use client";

// Adapted from shadcn/ui (MIT). Radix owns focus/keyboard behavior; see SHADCN_SOURCE.md.
import { useMotionPreference } from "@/hooks/use-motion-preference";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(
  (
    { className, children, onOpenAutoFocus, onCloseAutoFocus, ...props },
    ref,
  ) => {
    const reduce = useMotionPreference();
    const previousFocus = React.useRef<HTMLElement | null>(null);
    return (
      <DialogPrimitive.Portal>
        {/* Portals leave the preview layout; carry the scoped theme with them. */}
        <div className="renderly-theme" data-reduced-motion={reduce}>
          <DialogPrimitive.Overlay className="preview-overlay fixed inset-0 z-50 bg-overlay/70" />
          <DialogPrimitive.Content
            ref={ref}
            onOpenAutoFocus={(event) => {
              previousFocus.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              onOpenAutoFocus?.(event);
            }}
            onCloseAutoFocus={(event) => {
              onCloseAutoFocus?.(event);
              if (event.defaultPrevented) return;
              event.preventDefault();
              const target = previousFocus.current?.isConnected
                ? previousFocus.current
                : document.getElementById("workspace-main");
              requestAnimationFrame(() => target?.focus());
            }}
            className={cn(
              "preview-dialog fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-48px)] w-[calc(100%-48px)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-6 overflow-y-auto rounded-dialog border border-border bg-surface p-6 shadow-lg focus:outline-none",
              className,
            )}
            {...props}
          >
            {children}
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3"
                aria-label="关闭弹窗"
              >
                <X aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    );
  },
);
DialogContent.displayName = "DialogContent";

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 pr-8", className)} {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex justify-end gap-2", className)} {...props} />;
}

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
