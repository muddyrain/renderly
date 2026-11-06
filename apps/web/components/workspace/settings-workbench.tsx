"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import type { WorkspacePreferences } from "@/types/workspace";
import { useWorkspace } from "./workspace-provider";
import { PageFrame, ConfirmDialog } from "./page-frame";
export function SettingsWorkbench() {
  const { state, store } = useWorkspace();
  const reduce = useMotionPreference();
  const [draft, setDraft] = useState({ ...state.preferences });
  const [reset, setReset] = useState(false);
  const [error, setError] = useState("");
  return (
    <PageFrame page="settings">
      <div className="workspace-config-layout">
        <form
          className="workspace-config-card workspace-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (store.applyPreferences(draft)) setError("");
            else setError("请选择有效偏好。");
          }}
        >
          <h2>创作与浏览偏好</h2>
          <label htmlFor="preference-ratio">
            新 Brief 默认画幅
            <select
              id="preference-ratio"
              value={draft.ratio}
              onChange={(e) => setDraft({ ...draft, ratio: e.target.value })}
            >
              {["3:2", "1:1", "16:9", "9:16"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <p className="workspace-meta">
            只用于新建或重置的 Brief；不改写当前 Brief、批准快照或照片文件。
          </p>
          <label htmlFor="preference-density">
            Gallery 密度
            <select
              id="preference-density"
              value={draft.density}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  density: e.target.value as WorkspacePreferences["density"],
                })
              }
            >
              <option value="comfortable">舒适 · 三列</option>
              <option value="compact">紧凑 · 四列</option>
            </select>
          </label>
          <label htmlFor="preference-motion">
            动效偏好
            <select
              id="preference-motion"
              value={draft.motion}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  motion: e.target.value as WorkspacePreferences["motion"],
                })
              }
            >
              <option value="system">跟随系统</option>
              <option value="reduce">减少动效</option>
            </select>
          </label>
          <p className="workspace-meta">
            系统要求减少动效时始终优先。此设置同时影响导航、Plan、作品网格、图片与弹窗。
          </p>
          {error && (
            <p role="alert" className="workspace-error">
              {error}
            </p>
          )}
          <div className="workspace-actions">
            <Button type="submit">应用偏好</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDraft({ ...state.preferences });
                setError("");
              }}
            >
              取消修改
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReset(true)}
            >
              恢复默认
            </Button>
          </div>
        </form>
        <aside className="workspace-config-card">
          <h2>当前已应用</h2>
          <dl className="workspace-info">
            <div>
              <dt>外观</dt>
              <dd>石墨灰 / Sage</dd>
            </div>
            <div>
              <dt>新 Brief 画幅</dt>
              <dd>{state.preferences.ratio}</dd>
            </div>
            <div>
              <dt>Gallery 密度</dt>
              <dd>
                {state.preferences.density === "compact"
                  ? "紧凑 · 四列"
                  : "舒适 · 三列"}
              </dd>
            </div>
            <div>
              <dt>动效实际状态</dt>
              <dd data-effective-motion={reduce ? "reduce" : "normal"}>
                {reduce ? "已减少" : "正常"}（系统优先）
              </dd>
            </div>
            <div>
              <dt>保存范围</dt>
              <dd>本次演示有效，刷新重置</dd>
            </div>
          </dl>
        </aside>
      </div>
      <ConfirmDialog
        open={reset}
        title="恢复默认偏好？"
        description="恢复画幅 3:2、舒适密度及跟随系统；不改变当前 Brief 或作品。"
        close={() => setReset(false)}
        confirm={() => {
          store.resetPreferences();
          setDraft({ ...store.getSnapshot().preferences });
          setError("");
        }}
      />
    </PageFrame>
  );
}
