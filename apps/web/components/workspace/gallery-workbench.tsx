"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArtworkImage } from "@/components/studio/artwork-image";
import {
  assetArtwork,
  filteredAssets,
  type AssetFilters,
} from "@/lib/demo/workspace-store";
import { demoImages } from "@/lib/demo/studio-fixtures";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useWorkspace } from "./workspace-provider";
import { PageFrame, EmptyState, ConfirmDialog } from "./page-frame";
const clearFilters = (): AssetFilters => ({
  query: "",
  projectId: "",
  category: "",
  favorites: false,
});
export function GalleryWorkbench() {
  const { state, store } = useWorkspace();
  const router = useRouter();
  const reduce = useMotionPreference();
  const [filters, setFilters] = useState(clearFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [compare, setCompare] = useState(false);
  const [split, setSplit] = useState(50);
  const search = useRef<HTMLInputElement>(null);
  const removeTrigger = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const assets = filteredAssets(state, filters);
  const selected = assets.find((a) => a.id === selectedId);
  useEffect(() => {
    if (selectedId && !selected) {
      setSelectedId(null);
      setRemove(false);
    }
  }, [selectedId, selected]);
  const current = selected ? assetArtwork(selected) : null;
  const before = current?.asset.versions
    .flatMap((v) => v.variants)
    .find((v) => v.imageId !== current.image.id);
  const beforeImage = demoImages.find((image) => image.id === before?.imageId);
  const patch = (value: Partial<AssetFilters>) =>
    setFilters((previous) => ({ ...previous, ...value }));
  return (
    <PageFrame
      page="gallery"
      action={
        <span className="workspace-count">
          {state.assets.length} 件本地作品
        </span>
      }
    >
      <div className="workspace-toolbar" aria-label="作品筛选">
        <Input
          ref={search}
          aria-label="搜索作品"
          placeholder="搜索标题、项目或分类…"
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
        />
        <select
          aria-label="筛选项目"
          value={filters.projectId}
          onChange={(e) => patch({ projectId: e.target.value })}
        >
          <option value="">所有项目</option>
          <option value="unassigned">未归属</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="筛选分类"
          value={filters.category}
          onChange={(e) => patch({ category: e.target.value })}
        >
          <option value="">所有分类</option>
          <option>风景</option>
          <option>光线</option>
        </select>
        <label className="workspace-check">
          <input
            type="checkbox"
            checked={filters.favorites}
            onChange={(e) => patch({ favorites: e.target.checked })}
          />
          仅收藏
        </label>
        <Button variant="ghost" onClick={() => setFilters(clearFilters())}>
          重置筛选
        </Button>
      </div>
      <p className="workspace-section-caption">
        <SlidersHorizontal aria-hidden="true" />
        {assets.length} 件匹配 · 预置照片与本地演示记录，非模型输出
      </p>
      {!assets.length ? (
        <EmptyState
          title={state.assets.length ? "没有匹配的作品" : "Gallery 还没有作品"}
        >
          <p>
            {state.assets.length
              ? "调整条件或重置筛选。"
              : "前往 Studio，批准并完成一次本地演示。"}
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              state.assets.length
                ? setFilters(clearFilters())
                : router.push("/studio")
            }
          >
            {state.assets.length ? "清除全部筛选" : "前往 Studio"}
          </Button>
        </EmptyState>
      ) : (
        <div
          className={`gallery-grid gallery-grid-${state.preferences.density}`}
          data-density={state.preferences.density}
        >
          {assets.map((asset) => {
            const { image, version } = assetArtwork(asset);
            const project = state.projects.find(
              (p) => p.id === asset.projectId,
            );
            return (
              <motion.article
                key={asset.id}
                layout={!reduce}
                initial={false}
                transition={{ duration: reduce ? 0 : 0.16 }}
                className="gallery-card"
                data-asset-id={asset.id}
              >
                <div className="gallery-thumbnail">
                  <ArtworkImage image={image} />
                </div>
                <div className="gallery-card-body">
                  <div className="workspace-title-row">
                    <button
                      className="workspace-text-button"
                      onClick={(e) => {
                        trigger.current = e.currentTarget;
                        setCompare(false);
                        setSplit(50);
                        setSelectedId(asset.id);
                      }}
                    >
                      {asset.title}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`收藏 ${asset.title}`}
                      aria-pressed={asset.favorite}
                      onClick={() => store.toggleFavorite(asset.id)}
                    >
                      <Heart
                        fill={asset.favorite ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                  <p className="workspace-truncate" title={project?.name}>
                    {project?.name ?? "未归属"} · {asset.category}
                  </p>
                  <p className="workspace-meta">
                    {asset.source === "preset" ? "预置样例" : "本地演示"} ·{" "}
                    {version.label}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent
          className="gallery-detail-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = trigger.current?.isConnected
              ? trigger.current
              : search.current;
            requestAnimationFrame(() => target?.focus());
          }}
        >
          <DialogHeader>
            <DialogTitle>{selected?.title ?? "作品详情"}</DialogTitle>
            <DialogDescription>
              本地预置照片 · 版本为预置对照，不是生成或照片编辑历史。
            </DialogDescription>
          </DialogHeader>
          {selected && current && (
            <>
              <div className="gallery-detail-layout">
                <div className="gallery-detail-artwork">
                  {compare && beforeImage ? (
                    <div className="gallery-compare">
                      <Image
                        src={beforeImage.src}
                        alt={`对照：${beforeImage.alt}`}
                        width={1400}
                        height={933}
                        unoptimized
                      />
                      <Image
                        src={current.image.src}
                        alt={`当前：${current.image.alt}`}
                        width={1400}
                        height={933}
                        unoptimized
                        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                      />
                      <span
                        className="gallery-compare-line"
                        style={{ left: `${split}%` }}
                      />
                    </div>
                  ) : (
                    <ArtworkImage image={current.image} />
                  )}
                  {compare && beforeImage && (
                    <label className="gallery-comparison-control">
                      {current.image.title} / {beforeImage.title}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={split}
                        aria-label="图片对比位置"
                        onChange={(e) => setSplit(Number(e.target.value))}
                      />
                      <span>{split}% · 可用方向键调整</span>
                    </label>
                  )}
                </div>
                <div className="gallery-detail-info">
                  <label>
                    预置版本
                    <select
                      aria-label="详情版本"
                      value={current.version.id}
                      onChange={(e) =>
                        store.selectAssetVersion(selected.id, e.target.value)
                      }
                    >
                      {current.asset.versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    预置变体
                    <select
                      aria-label="详情变体"
                      value={current.variant.id}
                      onChange={(e) =>
                        store.selectAssetVersion(
                          selected.id,
                          current.version.id,
                          e.target.value,
                        )
                      }
                    >
                      {current.version.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <dl className="workspace-info">
                    <div>
                      <dt>实际像素</dt>
                      <dd>
                        {current.image.width} × {current.image.height}
                      </dd>
                    </div>
                    <div>
                      <dt>项目</dt>
                      <dd>
                        {state.projects.find((p) => p.id === selected.projectId)
                          ?.name ?? "未归属"}
                      </dd>
                    </div>
                    <div>
                      <dt>分类 / 来源</dt>
                      <dd>
                        {selected.category} /{" "}
                        {selected.source === "demo"
                          ? "本地演示记录"
                          : "预置样例"}
                      </dd>
                    </div>
                    <div>
                      <dt>示例 Prompt</dt>
                      <dd>{current.version.prompt}</dd>
                    </div>
                  </dl>
                  {selected.snapshot && (
                    <details>
                      <summary>
                        批准快照 · r{selected.snapshot.revision}
                      </summary>
                      <p>{selected.snapshot.brief.goal}</p>
                      <p>主体：{selected.snapshot.brief.subject}</p>
                      <p>方向：{selected.snapshot.brief.direction}</p>
                      <p>
                        批准项目：
                        {selected.snapshot.context.project?.name ?? "未归属"}
                      </p>
                      <p>
                        {selected.snapshot.context.model?.name} · 细节{" "}
                        {selected.snapshot.context.model?.detail}/10 · 画幅意向{" "}
                        {selected.snapshot.brief.ratio}
                      </p>
                      <p>
                        引用：
                        {selected.snapshot.brief.references.join("、") ||
                          "无"}{" "}
                        · 实际文件保持原始比例
                      </p>
                    </details>
                  )}
                </div>
              </div>
              <div className="workspace-actions">
                <Button
                  variant="secondary"
                  disabled={!beforeImage}
                  aria-pressed={compare}
                  onClick={() => setCompare(!compare)}
                >
                  对比预置方向
                </Button>
                <Button
                  variant="secondary"
                  aria-pressed={selected.favorite}
                  onClick={() => store.toggleFavorite(selected.id)}
                >
                  {selected.favorite ? "取消收藏" : "收藏作品"}
                </Button>
                <Button asChild variant="secondary">
                  <a
                    href={current.image.src}
                    download={`renderly-${selected.id}-${current.version.id}-${current.variant.id}.jpg`}
                  >
                    下载样图
                  </a>
                </Button>
                <Button
                  onClick={() => {
                    if (
                      store.queueIntent({
                        kind: "asset",
                        id: selected.id,
                        selection: { ...selected.selection },
                      })
                    )
                      router.push("/studio");
                  }}
                >
                  在 Studio 继续
                </Button>
                <Button
                  ref={removeTrigger}
                  variant="ghost"
                  onClick={() => setRemove(true)}
                >
                  移除作品
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={remove && Boolean(selected)}
        focusAfterClose={() =>
          removeTrigger.current?.isConnected
            ? removeTrigger.current
            : search.current
        }
        title="移除这件作品？"
        description="只从当前演示 Gallery 移除；本地照片文件保留，刷新恢复示例。"
        close={() => setRemove(false)}
        confirm={() => {
          if (selected) store.removeAsset(selected.id);
        }}
      />
    </PageFrame>
  );
}
