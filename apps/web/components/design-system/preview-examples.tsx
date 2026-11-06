"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Check, Info, LoaderCircle, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const swatches = [
  { name: "Background", value: "#151719", className: "bg-background" },
  { name: "Surface", value: "#202427", className: "bg-surface" },
  { name: "Canvas", value: "#101214", className: "bg-canvas" },
  { name: "Selection", value: "#303B30", className: "bg-selection" },
  { name: "Primary", value: "#AEC2A7", className: "bg-primary" },
  { name: "Focus", value: "#C5D7BE", className: "bg-ring" },
];

export function AgentPreview() {
  const [description, setDescription] = useState("为一组自然主题的视觉作品探索方向。\n保持画面安静，突出主体与留白。");
  const [feedback, setFeedback] = useState("输入仅留在当前页面，刷新后重置。");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-primary">AGENT AREA / DEMO</p>
        <h3 className="text-xl font-semibold">从一个想法开始</h3>
        <p className="text-muted-foreground">
          这里预留对话与创作输入区域。本预览只审阅输入控件，不模拟回复、计划或生成任务。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sample-title" className="font-medium">样例标题</label>
        <Input id="sample-title" defaultValue="自然光下的静物研究" />
        <p className="text-xs text-muted-foreground">支持中文、长标题与键盘焦点。</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sample-description" className="font-medium">创作描述（输入样本）</label>
        <Textarea
          id="sample-description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-describedby="description-hint"
        />
        <p id="description-hint" className="text-xs text-muted-foreground">
          Enter 换行；支持中文输入法。没有发送快捷键。
        </p>
        <Button
          size="lg"
          className="mt-2 w-full"
          onClick={() => setFeedback(description.trim() ? "已读取当前输入样本，仅留在本页。未发送请求。" : "当前描述为空，可以继续输入。未发送请求。")}
        >
          <Check aria-hidden="true" />
          检查输入样本
        </Button>
        <p role="status" className="min-h-12 text-xs text-muted-foreground">{feedback}</p>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <label htmlFor="unconnected-provider" className="font-medium">Provider（禁用样本）</label>
        <Input id="unconnected-provider" value="未连接 · Demo" disabled />
        <label htmlFor="disabled-description" className="mt-2 font-medium">只读场景（禁用样本）</label>
        <Textarea id="disabled-description" value="此输入已禁用，用于检查不可用状态。" disabled rows={2} />
      </div>
    </div>
  );
}

function DialogExample() {
  const initialFocus = useRef<HTMLInputElement>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary"><ArrowUpRight aria-hidden="true" />打开弹窗样本</Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(event) => {
        event.preventDefault();
        initialFocus.current?.focus();
      }}>
        <DialogHeader>
          <DialogTitle>审阅弹窗样本</DialogTitle>
          <DialogDescription>
            Demo · 这里只检查焦点与表单外观。内容不保存，也不触发任何创作任务。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label htmlFor="dialog-title" className="font-medium">样本名称</label>
          <Input ref={initialFocus} id="dialog-title" defaultValue="Graphite foundations" />
          <p className="text-xs text-muted-foreground">Tab 在弹窗内移动，Esc 关闭并返回触发器。</p>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="secondary">取消</Button></DialogClose>
          <DialogClose asChild><Button>完成预览</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CanvasPreview() {
  const [feedback, setFeedback] = useState("点击按钮查看本地反馈；没有后端操作。");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="preview-specimen">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-primary">DESIGN SYSTEM PREVIEW / DEMO</p>
            <h2 className="text-xl font-semibold">创作之前，先让工具归位。</h2>
            <p className="max-w-xl text-muted-foreground">
              石墨灰表面、Sage 操作色与清晰的文字层级。此画布展示基础组件，不是生成的作品。
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="预览范围说明">
                <Info aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">仅 B0 + B1：基础组件与最小框架。</TooltipContent>
          </Tooltip>
        </div>

        <section className="preview-specimen-section" aria-labelledby="palette-heading">
          <h3 id="palette-heading" className="font-semibold">01 / 表面与强调色</h3>
          <div className="preview-swatches">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="flex min-w-0 flex-col gap-2">
                <div className={cn("h-12 rounded-control border border-border", swatch.className)} aria-hidden="true" />
                <span className="text-xs">{swatch.name}</span>
                <span className="text-xs text-muted-foreground">{swatch.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="preview-specimen-section" aria-labelledby="button-heading">
          <h3 id="button-heading" className="font-semibold">02 / 操作与反馈</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setFeedback("Primary：已触发本地组件反馈。")}>主要操作</Button>
            <Button variant="secondary" onClick={() => setFeedback("Secondary：已触发本地组件反馈。")}>次要操作</Button>
            <Button variant="ghost" onClick={() => setFeedback("Ghost：已触发本地组件反馈。")}>轻量操作</Button>
            <Button variant="destructive" onClick={() => setFeedback("Destructive：仅预览反馈，未删除数据。")}>危险操作</Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="重置按钮反馈" onClick={() => setFeedback("按钮反馈已重置。")}>
                  <RotateCcw aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重置本地按钮反馈</TooltipContent>
            </Tooltip>
            <Button disabled>不可用</Button>
            <Button disabled aria-busy="true">
              <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              加载中（样本）
            </Button>
          </div>
          <p role="status" className="min-h-6 text-xs text-muted-foreground">{feedback}</p>
        </section>

        <section className="preview-specimen-section" aria-labelledby="error-heading">
          <h3 id="error-heading" className="font-semibold">03 / 输入与错误</h3>
          <div className="preview-error-fields">
            <div className="flex flex-col gap-2">
              <label htmlFor="invalid-title" className="font-medium">标题（错误样本）</label>
              <Input id="invalid-title" aria-invalid="true" aria-describedby="title-error" placeholder="请输入标题" />
              <p id="title-error" className="text-xs text-destructive">请输入标题。这是固定错误样本。</p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="invalid-description" className="font-medium">描述（错误样本）</label>
              <Textarea id="invalid-description" rows={2} aria-invalid="true" aria-describedby="description-error" placeholder="补充画面主体与构图" />
              <p id="description-error" className="text-xs text-destructive">请补充描述。这是固定错误样本。</p>
            </div>
          </div>
        </section>

        <section className="preview-specimen-section" aria-labelledby="overlay-heading">
          <h3 id="overlay-heading" className="font-semibold">04 / 弹窗与键盘</h3>
          <div className="flex flex-wrap items-center gap-4">
            <DialogExample />
            <p className="text-xs text-muted-foreground">Tab 聚焦 · Enter 打开 · Esc 返回</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-success">成功文字样本</span>
            <span className="text-warning">待审阅文字样本</span>
            <span className="text-destructive">错误文字样本</span>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}
