"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import type { DemoMessage } from "@/types/studio";

export function Conversation({
  messages,
  scrollArea,
}: {
  messages: DemoMessage[];
  scrollArea: React.RefObject<HTMLDivElement | null>;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  const wasNearBottom = useRef(true);
  const [hasNew, setHasNew] = useState(false);
  const reduceMotion = useMotionPreference();

  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const rememberPosition = () => {
      wasNearBottom.current =
        area.scrollHeight - area.scrollTop - area.clientHeight < 120;
    };
    area.addEventListener("scroll", rememberPosition);
    return () => area.removeEventListener("scroll", rememberPosition);
  }, [scrollArea]);

  useEffect(() => {
    if (wasNearBottom.current)
      bottom.current?.scrollIntoView({ block: "nearest" });
    else if (messages.length) setHasNew(true);
  }, [messages]);

  return (
    <section aria-label="演示对话" className="studio-conversation">
      {messages.length === 0 && (
        <p className="text-muted-foreground">
          描述一个创作目标，开始本地演示。
        </p>
      )}
      {messages.map((message) => (
        <motion.article
          key={message.id}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
          className="studio-message"
        >
          <p className="text-xs text-muted-foreground">
            {message.role === "user" ? "你" : "Agent · 本地模板"}
          </p>
          <p>{message.text}</p>
        </motion.article>
      ))}
      {hasNew && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            bottom.current?.scrollIntoView({ block: "nearest" });
            setHasNew(false);
          }}
        >
          查看新消息
        </Button>
      )}
      <div ref={bottom} />
    </section>
  );
}
