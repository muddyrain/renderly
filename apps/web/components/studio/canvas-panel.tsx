"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { CanvasTabs, CanvasTabPanel, type CanvasView } from "./canvas-tabs";
import { ArtworkImage } from "./artwork-image";
import {
  demoAssets,
  demoImages,
  selectedArtwork,
} from "@/lib/demo/studio-fixtures";
import type { DemoAgent } from "@/lib/demo/demo-agent";
import type { StudioState } from "@/types/studio";

export function CanvasPanel({
  state,
  agent,
  loadExample,
  continueFromImage,
}: {
  state: StudioState;
  agent: DemoAgent;
  loadExample: (trigger: HTMLElement) => void;
  continueFromImage: () => void;
}) {
  const [view, setView] = useState<CanvasView>("canvas");
  const { asset, version, variant, image } = selectedArtwork(state);
  const approvedArtwork = state.result?.snapshot?.artwork;
  const browsingOtherSample =
    approvedArtwork &&
    (asset.id !== approvedArtwork.assetId ||
      version.id !== approvedArtwork.versionId ||
      variant.id !== approvedArtwork.variantId);
  const resultLabel =
    !state.result || state.result.source === "preset"
      ? "样例素材 · 非本轮生成"
      : browsingOtherSample
        ? "预置样图浏览 · 非本轮演示结果"
        : state.result.revision !== state.revision
          ? "上一轮演示结果 · 预置素材"
          : "演示结果 · 预置素材，非模型输出";
  const choices = (
    <div className="studio-variant-choices" aria-label="预置变体">
      {version.variants.map((item, index) => {
        const artwork = demoImages.find(
          (candidate) => candidate.id === item.imageId,
        )!;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`选择变体 ${index + 1}：${item.title}`}
            aria-pressed={variant.id === item.id}
            className="studio-variant-button"
            onClick={() => agent.selectVariant(item.id)}
          >
            <Image
              src={artwork.src}
              alt={artwork.alt}
              width={180}
              height={90}
              unoptimized
            />
            <span>
              {index + 1}. {item.title}
              {variant.id === item.id ? " · 已选" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
  return (
    <section
      className="studio-canvas studio-canvas-panel"
      aria-label="样例画布"
    >
      <CanvasTabs
        value={view}
        onChange={setView}
        actions={
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" disabled={!state.result}>
                  <SlidersHorizontal aria-hidden="true" />
                  参数
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>样例参数</DialogTitle>
                  <DialogDescription>
                    预置文件与当前选择同步。Provider
                    未连接，没有真实模型、耗时或服务端版本记录。
                  </DialogDescription>
                </DialogHeader>
                <dl className="studio-parameter-list">
                  <div>
                    <dt>演示资产</dt>
                    <dd>{asset.title}</dd>
                  </div>
                  <div>
                    <dt>预置版本</dt>
                    <dd>{version.label}</dd>
                  </div>
                  <div>
                    <dt>预置变体</dt>
                    <dd>
                      {variant.title} / {image.title}
                    </dd>
                  </div>
                  <div>
                    <dt>实际像素</dt>
                    <dd>
                      {image.width} × {image.height}
                    </dd>
                  </div>
                  <div>
                    <dt>示例 Prompt</dt>
                    <dd>{version.prompt}</dd>
                  </div>
                </dl>
                {state.result?.snapshot && (
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <h3 className="font-semibold">
                      上次批准的演示快照 · r{state.result.snapshot.revision}
                    </h3>
                    <p>{state.result.snapshot.brief.goal}</p>
                    <p>
                      批准项目：
                      {state.result.snapshot.context.project?.name ?? "未归属"}
                    </p>
                    <p>
                      示例模型：{state.result.snapshot.context.model?.name} ·
                      细节 {state.result.snapshot.context.model?.detail}/10
                    </p>
                    <p className="text-muted-foreground">
                      画幅意向 {state.result.snapshot.brief.ratio} ·
                      不裁切或改变预置文件
                    </p>
                  </div>
                )}
                <DialogClose asChild>
                  <Button variant="secondary">关闭参数</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" disabled={!state.result}>
                  <Expand aria-hidden="true" />
                  放大查看
                </Button>
              </DialogTrigger>
              <DialogContent className="studio-zoom-dialog">
                <DialogHeader>
                  <DialogTitle>放大查看 · {image.title}</DialogTitle>
                  <DialogDescription>
                    {resultLabel} · 保留原始比例和色彩。
                  </DialogDescription>
                </DialogHeader>
                <div className="studio-zoom-image">
                  <ArtworkImage image={image} />
                </div>
                <DialogClose asChild>
                  <Button variant="secondary" className="justify-self-end">
                    关闭图片
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </>
        }
      >
        {state.result ? (
          <>
            <CanvasTabPanel value="canvas" className="studio-canvas-view">
              <div className="studio-main-image">
                <span className="studio-artwork-label">{resultLabel}</span>
                <ArtworkImage image={image} />
              </div>
              {choices}
            </CanvasTabPanel>
            <CanvasTabPanel value="variants" className="studio-variants-view">
              <h2 className="font-semibold">
                {asset.title} · {version.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                预置方向对照；选择后主画布与参数同步更新。
              </p>
              {choices}
              <Button variant="secondary" onClick={() => setView("canvas")}>
                返回主画布
              </Button>
            </CanvasTabPanel>
          </>
        ) : (
          <>
            <CanvasTabPanel value="canvas" className="studio-empty-canvas">
              <h2 className="text-xl font-semibold">从一个新想法开始</h2>
              <p>发送需求后先审阅并批准演示，或显式载入预置示例。</p>
              <Button
                variant="secondary"
                onClick={(event) => loadExample(event.currentTarget)}
              >
                载入示例
              </Button>
            </CanvasTabPanel>
            <CanvasTabPanel value="variants" className="studio-empty-canvas">
              <h2 className="text-base font-semibold">还没有演示变体</h2>
              <p>演示完成后可比较预置方向。</p>
            </CanvasTabPanel>
          </>
        )}
      </CanvasTabs>
      {state.result && (
        <footer className="studio-asset-footer">
          <div className="studio-artwork-title">
            <strong>{image.title}</strong>
            <span className="text-xs text-muted-foreground">
              {resultLabel} ·{" "}
              {version.variants.findIndex((item) => item.id === variant.id) + 1}{" "}
              / {version.variants.length}
            </span>
          </div>
          <div className="studio-asset-controls">
            <label>
              演示资产
              <select
                aria-label="演示资产"
                className="studio-select"
                value={asset.id}
                onChange={(event) => agent.selectAsset(event.target.value)}
              >
                {demoAssets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              预置版本
              <select
                aria-label="预置版本"
                className="studio-select"
                value={version.id}
                onChange={(event) => agent.selectVersion(event.target.value)}
              >
                {asset.versions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="sm"
              variant="ghost"
              disabled={state.phase === "running"}
              onClick={continueFromImage}
            >
              用此样图继续
            </Button>
          </div>
        </footer>
      )}
    </section>
  );
}
