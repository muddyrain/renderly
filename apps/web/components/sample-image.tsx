"use client";

import Image from "next/image";
import { useState } from "react";

type Props = { src: string; alt: string; className?: string; priority?: boolean };

// Sample assets come from external URLs; unavailable images remain identifiable.
export function SampleImage({ src, alt, className = "", priority = false }: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  if (state === "error") {
    return <span className={`${className} image-unavailable`} role="img" aria-label={`${alt || "Sample artwork"} unavailable`}>Sample image unavailable</span>;
  }
  return <Image src={src} alt={alt} width={1800} height={1000} unoptimized priority={priority}
    className={`${className} sample-image ${state === "loading" ? "image-loading" : ""}`}
    onLoad={() => setState("loaded")} onError={() => setState("error")} />;
}
