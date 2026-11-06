import { Unplug } from "lucide-react";

import { WorkspacePageHeading } from "@/components/layout/workspace-page-heading";
import { workspaceMetadata } from "@/lib/workspace-pages";

export const metadata = workspaceMetadata("models");

export default function ModelsPage() {
  return (
    <section className="workspace-section">
      <WorkspacePageHeading pageKey="models" />
      <section className="workspace-detail-section" aria-labelledby="provider-heading">
        <div className="flex items-center gap-3">
          <Unplug className="size-5 text-muted-foreground" aria-hidden="true" />
          <h2 id="provider-heading" className="text-base font-semibold">Provider 未连接</h2>
        </div>
        <p className="max-w-xl text-muted-foreground">
          连接服务后可在这里管理模型。演示工作区不收集、保存或测试 API Key。
        </p>
        <dl className="workspace-details">
          <div><dt>连接状态</dt><dd>未连接</dd></div>
          <div><dt>可用模型</dt><dd>暂无</dd></div>
        </dl>
      </section>
    </section>
  );
}
