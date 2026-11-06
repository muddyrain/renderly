# shadcn/ui 来源与兼容记录 — P0.10 B0+B1

PR 审阅补充：Button 的 `disabled` 仅用于原生 button；`asChild` 与 `disabled` 的组合由类型 API 拒绝，避免把原生禁用语义误用于链接。类型合同随普通 typecheck 验证。运行镜像在 `/app/licenses/SHADCN_LICENSE.md` 保留完整许可文本，原始来源与版权记录不变。

核对日期：2026-11-06。只消费 Button、Input、Textarea、Dialog、Tooltip；未安装其他组件、表单框架或动画包。

## 冻结来源

采用官方仓库 [shadcn-ui/ui](https://github.com/shadcn-ui/ui) 的 `shadcn@2.3.0` 标签，解引用 commit 为 **`c8c4027b6b192822ea2952b225ee4760cddedf0d`**。组件目录为 `apps/www/registry/new-york/ui`，是 Tailwind 3 路线；不是将当前 Tailwind 4 / Base UI 组件直接搬入旧项目。

源码 URL 的共同前缀：`https://raw.githubusercontent.com/shadcn-ui/ui/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/registry/new-york/ui/`。

| 文件 | 官方原始文件 SHA-256 |
|---|---|
| [button.tsx](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/registry/new-york/ui/button.tsx) | `c2b999a96781e6c932632bd089095368e973bf5602e1b1a62156b7d2b43f1e84` |
| [input.tsx](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/registry/new-york/ui/input.tsx) | `6299a6a387dc55e528aec4342deaea0b83f1ea3a365c135a31a18ee55334f441` |
| [textarea.tsx](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/registry/new-york/ui/textarea.tsx) | `ec7c92aaed80f6923a7caa4bfe4eead395b50a7001504fd7fbb0b9381804dae9` |
| [dialog.tsx](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/registry/new-york/ui/dialog.tsx) | `fe70a91bb924ef3a40b7504e6847ef9a57aed3b503d2a7dbb7610e821ea40b6f` |
| [tooltip.tsx](https://github.com/shadcn-ui/ui/blob/c8c4027b6b192822ea2952b225ee4760cddedf0d/apps/www/registry/new-york/ui/tooltip.tsx) | `40b1b8af0ea2170d9521cc8e1c7dd9a1566a79b7905283170d17261c0118d195` |

许可证保留于 [SHADCN_LICENSE.md](SHADCN_LICENSE.md)。原始组件副本、来源 manifest 与本次验证日志保存在本地审阅包中。

## CLI 与 registry 决策

`pnpm view shadcn version` 本次返回 `4.23.0`。实际仅运行固定版本的 `pnpm dlx shadcn@4.23.0 docs button input textarea dialog tooltip`、`init --help`、`add --help`，未将 CLI 加为应用依赖。

检查发现：当前默认 docs 输出指向 `/docs/components/base/*`；`init` 会初始化项目并安装依赖，存在改写主题与配置的范围。为保持 Tailwind 3 和旧 Demo，未运行 `init`、`add`、preset、`--overwrite` 或 `--all`。手工整合已核对的官方 v3 源码，未用 CLI 生成或更新文件。

另读取 `https://v3.shadcn.com/r/styles/new-york/button.json` 作 v3 registry 对照；运行时不依赖该可变 URL。所有五个组件的权威来源均是上述固定 commit。`components.json` 描述当前本地目录、别名和 scoped token 文件，不授权后续 CLI 自动迁移；未来增加组件仍须检查来源及 Diff。

本次 GitHub tree API 查询返回 HTTP 403；直接读取当前 HEAD 的旧目录返回 HTTP 404。随后通过官方 Git tags 解析出上述历史 commit，并成功下载五份固定源码及许可证；这些查询失败没有影响源码完整性。

## 依赖与 peer

| 直接新增依赖 | 固定版本 | 用途 / 实测 peer 范围 |
|---|---|---|
| `@radix-ui/react-dialog` | `1.3.1` | 弹窗；React / React DOM `^16.8 \|\| ^17.0 \|\| ^18.0 \|\| ^19.0 \|\| ^19.0.0-rc` |
| `@radix-ui/react-tooltip` | `1.4.1` | Tooltip；React / React DOM 同上 |
| `@radix-ui/react-slot` | `1.5.0` | Button `asChild` 组合；React 同上 |
| `class-variance-authority` | `0.7.1` | Button variants |
| `clsx` | `2.1.1` | 条件 class 合并 |
| `tailwind-merge` | `2.6.1` | Tailwind 3 class 冲突合并；不用 v3 merge engine |

Radix 的 `@types/react` / `@types/react-dom` peer 为 `*`（Slot 只有 React 类型 peer）。`pnpm view <精确版本> peerDependencies --json` 与本地安装结果是本次依据；未使用 `--force`、`legacy-peer-deps` 或关闭 peer 检查。

根 Workspace 实际安装：Node `22.23.3`、pnpm `10.33.0`、Next `15.5.29`、React / React DOM `19.0.9`、Tailwind `3.4.19`（原声明 `^3.4.17`）、TypeScript `5.9.3`。保留原框架与动画声明；未新增 `motion`，旧嵌套 lock 未改。新增依赖全部使用精确版本，传递依赖由根 lock 冻结。

## 源码适配

- 保留 `forwardRef` 与原生 props 透传；Dialog / Tooltip 的 focus trap、Esc、焦点返回、定位和可访问语义仍由 Radix 负责。
- 颜色统一为 scoped RGB 通道，Tailwind 3 `rgb(var(--token) / <alpha-value>)` 支持透明度；不引入 `@theme`、OKLCH 或 v4 专属类。
- Button 精简为实际消费的 primary / secondary / ghost / destructive / selected / navigation，大小为 32 / 36 / 40px 和 icon。loading 由消费方用 disabled、`aria-busy` 与 Lucide 表达，不增加运行状态管理。
- Input / Textarea 使用 14px 正文、label 关联、`aria-invalid` 和明确错误文字；IME 与换行保留浏览器原生行为，没有 Enter 提交逻辑。不为原生 label 新增 Radix Label 依赖。
- Dialog / Tooltip 的 portal 显式携带 `.renderly-theme`，不将主题写入 `:root`。关闭按钮复用 Button，Dialog 的初始输入焦点由样本指定。
- 去掉原始全套 `tailwindcss-animate` 类和普遍阴影，只为弹层保留 140ms 淡入，控件 160ms；reduced-motion 禁用动效。未新增动画依赖。
- 删去未消费的导出，组件按多行格式书写；MIT 来源信息保留。

## 验证口径

本次执行带 `--strict-peer-dependencies` 的精确依赖安装及 frozen install，后续 lint、typecheck、build 与浏览器交互以本轮 `review/P0.10-B0-B1-2026-11-06/TEST_RESULTS.md` 为准。官方声明只能说明兼容路线，不能代替仓库实际运行结果。

参考：[官方 Tailwind v4 迁移说明（保留 v3 路线）](https://ui.shadcn.com/docs/tailwind-v4)、[官方 React 19 说明](https://ui.shadcn.com/docs/react-19)、[v3 组件文档](https://v3.shadcn.com/docs/components/dialog)、[tailwind-merge v2.6.1](https://github.com/dcastil/tailwind-merge/tree/v2.6.1)、[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)、[Radix Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip)。
