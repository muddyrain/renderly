"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import type { DemoImage } from "@/types/studio";

// A resource-keyed instance owns its load/error callbacks. An unmounted old
// image cannot publish state into the current resource's component instance.
function ImageResource({
  image,
  previous,
  attempt,
  retry,
  onReady,
}: {
  image: DemoImage;
  previous: DemoImage | null;
  attempt: number;
  retry: () => void;
  onReady: (image: DemoImage) => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const reduceMotion = useMotionPreference();
  const active = useRef(true);
  const transition = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (transition.current) clearTimeout(transition.current);
    };
  }, []);
  return (
    <div className="studio-artwork-resource" data-image-status={status}>
      {previous && previous.src !== image.src && status !== "error" && (
        <Image
          src={previous.src}
          alt=""
          aria-hidden="true"
          width={previous.width}
          height={previous.height}
          unoptimized
          className="studio-artwork-backdrop"
        />
      )}
      {status !== "error" && (
        <Image
          src={image.src + (attempt ? `?retry=${attempt}` : "")}
          alt={image.alt}
          width={image.width}
          height={image.height}
          unoptimized
          priority
          className="studio-artwork"
          style={{
            opacity: status === "ready" ? 1 : 0,
            transition: reduceMotion ? "none" : "opacity 200ms ease-out",
          }}
          onLoad={() => {
            if (!active.current) return;
            setStatus("ready");
            if (transition.current) clearTimeout(transition.current);
            transition.current = setTimeout(
              () => {
                if (active.current) onReady(image);
              },
              reduceMotion ? 0 : 200,
            );
          }}
          onError={() => {
            if (active.current) setStatus("error");
          }}
        />
      )}
      {status === "loading" && (
        <p className="studio-image-feedback" role="status">
          正在载入样图：{image.title}
        </p>
      )}
      {status === "error" && (
        <div
          className="studio-image-feedback flex flex-col items-center gap-3"
          role="alert"
        >
          <p>无法载入“{image.title}”。可重试或切换其他样图。</p>
          <Button variant="secondary" onClick={retry}>
            重试图片
          </Button>
        </div>
      )}
    </div>
  );
}

export function ArtworkImage({ image }: { image: DemoImage }) {
  const [attempt, setAttempt] = useState(0);
  const [previous, setPrevious] = useState<DemoImage | null>(null);
  return (
    <ImageResource
      key={`${image.src}:${attempt}`}
      image={image}
      previous={previous}
      attempt={attempt}
      retry={() => setAttempt((value) => value + 1)}
      onReady={setPrevious}
    />
  );
}
