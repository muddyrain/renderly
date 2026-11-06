"use client";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DemoImage } from "@/types/studio";

function ComparisonResource({
  current,
  before,
  split,
  attempt,
  retry,
}: {
  current: DemoImage;
  before: DemoImage;
  split: number;
  attempt: number;
  retry: () => void;
}) {
  const [ready, setReady] = useState({ current: false, before: false });
  const [failed, setFailed] = useState(false);
  const source = (image: DemoImage) =>
    image.src + (attempt ? `?retry=${attempt}` : "");
  const loaded = ready.current && ready.before;
  return (
    <div
      className="gallery-compare"
      data-comparison-status={failed ? "error" : loaded ? "ready" : "loading"}
    >
      {failed ? (
        <div className="studio-image-feedback flex-col gap-3" role="alert">
          <p>对比图片载入失败。可重试或退出对比。</p>
          <Button variant="secondary" onClick={retry}>
            重试对比图片
          </Button>
        </div>
      ) : (
        <>
          <Image
            src={source(before)}
            alt={`对照：${before.alt}`}
            width={before.width}
            height={before.height}
            unoptimized
            onLoad={() => setReady((value) => ({ ...value, before: true }))}
            onError={() => setFailed(true)}
            style={{ opacity: loaded ? 1 : 0 }}
          />
          <Image
            src={source(current)}
            alt={`当前：${current.alt}`}
            width={current.width}
            height={current.height}
            unoptimized
            onLoad={() => setReady((value) => ({ ...value, current: true }))}
            onError={() => setFailed(true)}
            style={{
              opacity: loaded ? 1 : 0,
              clipPath: `inset(0 ${100 - split}% 0 0)`,
            }}
          />
          {loaded ? (
            <span
              className="gallery-compare-line"
              style={{ left: `${split}%` }}
            />
          ) : (
            <p className="studio-image-feedback" role="status">
              正在载入两张预置对比图…
            </p>
          )}
        </>
      )}
    </div>
  );
}
export function ArtworkComparison({
  current,
  before,
  split,
}: {
  current: DemoImage;
  before: DemoImage;
  split: number;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <ComparisonResource
      key={`${current.src}:${before.src}:${attempt}`}
      current={current}
      before={before}
      split={split}
      attempt={attempt}
      retry={() => setAttempt((value) => value + 1)}
    />
  );
}
