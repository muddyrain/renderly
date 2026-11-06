"use client";
import { useState } from "react";
import { Box, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "./workspace-provider";
import { PageFrame, EmptyState, ConfirmDialog } from "./page-frame";
export function ModelsWorkbench() {
  const { state, store } = useWorkspace();
  const [draft, setDraft] = useState({ ...state.modelConfig });
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const applied = state.models.find((m) => m.id === state.modelConfig.modelId);
  return (
    <PageFrame
      page="models"
      action={
        <span className="workspace-provider-state">
          <Unplug aria-hidden="true" />
          Provider 未连接
        </span>
      }
    >
      <p className="workspace-callout">
        这里管理本地示例能力与计划参数，不执行推理，不收集 API
        Key、端点或费用数据。
      </p>
      {!state.models.length ? (
        <EmptyState title="暂无示例模型">
          <p>恢复示例配置后，可在 Studio 审阅本地演示计划。</p>
          <Button variant="secondary" onClick={() => setReset(true)}>
            恢复示例配置
          </Button>
        </EmptyState>
      ) : (
        <div className="workspace-config-layout">
          <div className="workspace-model-list" aria-label="示例模型列表">
            {state.models.map((model) => (
              <article key={model.id} className="workspace-model-card">
                <Box aria-hidden="true" />
                <div>
                  <h2>{model.name}</h2>
                  <p>{model.capabilities}</p>
                  <span className="workspace-meta">
                    {state.modelConfig.modelId === model.id
                      ? "已应用的默认示例"
                      : "可选示例"}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <form
            className="workspace-config-card workspace-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (store.applyModel(draft)) setError("");
              else setError("请选择有效示例模型，细节必须为 1–10 的整数。");
            }}
          >
            <h2>默认演示配置</h2>
            <p className="workspace-meta">
              已应用：{applied?.name ?? "暂无"} · 细节{" "}
              {state.modelConfig.detail}/10
            </p>
            <label htmlFor="model-id">
              示例模型
              <select
                id="model-id"
                value={draft.modelId}
                onChange={(e) =>
                  setDraft({ ...draft, modelId: e.target.value })
                }
              >
                {state.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="model-detail">
              计划细节（1–10）
              <Input
                id="model-detail"
                type="number"
                min="1"
                max="10"
                step="1"
                value={Number.isNaN(draft.detail) ? "" : draft.detail}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    detail:
                      e.target.value === ""
                        ? Number.NaN
                        : Number(e.target.value),
                  })
                }
              />
            </label>
            <p className="workspace-meta">
              参数写入后续计划和批准快照；不改变样图像素或既有快照。
            </p>
            {error && (
              <p role="alert" className="workspace-error">
                {error}
              </p>
            )}
            <div className="workspace-actions">
              <Button type="submit">应用配置</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraft({ ...state.modelConfig });
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
        </div>
      )}
      <ConfirmDialog
        open={reset}
        title="恢复示例模型配置？"
        description="恢复两个本地示例与默认细节 5；尚未应用的输入会丢弃，后续计划需要重新审阅。Provider 仍未连接。"
        close={() => setReset(false)}
        confirm={() => {
          store.resetModels();
          setDraft({ ...store.getSnapshot().modelConfig });
          setError("");
        }}
      />
    </PageFrame>
  );
}
