import { WorkspacePageHeading } from "@/components/layout/workspace-page-heading";
import { workspaceMetadata } from "@/lib/workspace-pages";

export const metadata = workspaceMetadata("settings");

export default function SettingsPage() {
  return (
    <section className="workspace-section">
      <WorkspacePageHeading pageKey="settings" />
      <section className="workspace-detail-section" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading" className="text-base font-semibold">工作区偏好</h2>
        <p className="text-muted-foreground">当前仅展示演示环境，设置保存尚未连接。</p>
        <dl className="workspace-details">
          <div><dt>工作区</dt><dd>Demo workspace</dd></div>
          <div><dt>外观</dt><dd>石墨灰 / Sage</dd></div>
          <div><dt>设置保存</dt><dd>尚未启用</dd></div>
        </dl>
      </section>
    </section>
  );
}
