"use client";
import { useProjectConnection } from "@/components/workspace/workspace-provider";
export function DemoNotice() {
  const { connected, state } = useProjectConnection();
  return (
    <div
      className="workspace-demo-notice"
      role="note"
      aria-label="演示工作区说明"
    >
      <strong>{connected ? "LOCAL API" : "DEMO"}</strong>
      <span>
        {connected
          ? state.status === "error"
            ? "项目服务待恢复，不回退示例 · 其余创作数据为本地演示"
            : "项目存于本地数据库 · 创作、角色与偏好为演示，刷新重置 · Provider 未连接"
          : "本次演示有效，刷新重置 · Provider 未连接"}
      </span>
    </div>
  );
}
