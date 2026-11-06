"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DemoImage } from "@/types/studio";

type ImageStatus = "loading" | "ready" | "error";
function ComparisonResource({
  image,
  side,
  status,
  publish,
  attempt,
  split,
}: {
  image: DemoImage;
  side: "before" | "current";
  status: ImageStatus;
  publish: (status: ImageStatus) => void;
  attempt: number;
  split?: number;
}) {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  return (
    <Image
      src={image.src + (attempt ? `?retry=${attempt}` : "")}
      alt={`${side === "before" ? "对照" : "当前"}：${image.alt}`}
      width={image.width}
      height={image.height}
      unoptimized
      data-comparison-side={side}
      data-image-status={status}
      onLoad={() => {
        if (active.current) publish("ready");
      }}
      onError={() => {
        if (active.current) publish("error");
      }}
      style={{
        opacity: status === "ready" ? 1 : 0,
        ...(split === undefined
          ? {}
          : { clipPath: `inset(0 ${100 - split}% 0 0)` }),
      }}
    />
  );
}
function ComparisonPair({
  current,
  before,
  split,
}: {
  current: DemoImage;
  before: DemoImage;
  split: number;
}) {
  const [beforeStatus, setBeforeStatus] = useState<ImageStatus>("loading");
  const [currentStatus, setCurrentStatus] = useState<ImageStatus>("loading");
  const [beforeAttempt, setBeforeAttempt] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const failed = beforeStatus === "error" || currentStatus === "error";
  const ready = beforeStatus === "ready" && currentStatus === "ready";
  return (
    <div>
      <div
        className="gallery-compare"
        data-comparison-status={failed ? "error" : ready ? "ready" : "loading"}
      >
        <ComparisonResource
          key={`before:${beforeAttempt}`}
          image={before}
          side="before"
          status={beforeStatus}
          publish={setBeforeStatus}
          attempt={beforeAttempt}
        />
        <ComparisonResource
          key={`current:${currentAttempt}`}
          image={current}
          side="current"
          status={currentStatus}
          publish={setCurrentStatus}
          attempt={currentAttempt}
          split={split}
        />
        {ready && (
          <span
            className="gallery-compare-line"
            style={{ left: `${split}%` }}
          />
        )}
        {!ready && !failed && (
          <p className="studio-image-feedback" role="status">
            正在载入预置对比图…
          </p>
        )}
      </div>
      {failed && (
        <div className="workspace-callout workspace-actions" role="alert">
          <p>对比图片载入失败；已就绪的一侧保留。</p>
          {beforeStatus === "error" && (
            <Button
              variant="secondary"
              onClick={() => {
                setBeforeStatus("loading");
                setBeforeAttempt((value) => value + 1);
              }}
            >
              重试对比图片（对照）
            </Button>
          )}
          {currentStatus === "error" && (
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentStatus("loading");
                setCurrentAttempt((value) => value + 1);
              }}
            >
              重试对比图片（当前）
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
export function ArtworkComparison(props: {
  current: DemoImage;
  before: DemoImage;
  split: number;
}) {
  return (
    <ComparisonPair
      key={`${props.current.src}:${props.before.src}`}
      {...props}
    />
  );
}
