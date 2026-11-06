# Studio Animated Tabs 来源与适配

运行镜像将本项目根 LICENSE 与上游完整许可一同保留：`/app/LICENSE`、`/app/licenses/SHADCN_LICENSE.md`、`/app/licenses/INSPIRA_LICENSE.md`。Docker 直接复制原文件，来源正文与版权声明不改写。

核查日期：2026-11-06。B3 使用维护者明确接受的 **Aceternity → Inspira UI MIT 移植 → Renderly React 适配** 链路；不是直接复制 Aceternity 当前 React registry，也不声称其当前官网许可是 MIT。

## 许可与固定来源

- 原始设计：[Aceternity Tabs](https://ui.aceternity.com/components/tabs)。核查的 [Aceternity licence](https://ui.aceternity.com/licence) 没有明确允许本开源项目再分发当前 registry 源码，因此未采用 Stateful Button registry，也未把它收入源码或审阅 ZIP。
- 采用来源：[unovue/inspira-ui](https://github.com/unovue/inspira-ui/tree/eec920b047589058b4b02ba64deb614869e7237a)，commit `eec920b047589058b4b02ba64deb614869e7237a`。
- 官方仓库 [README](https://github.com/unovue/inspira-ui/blob/eec920b047589058b4b02ba64deb614869e7237a/README.md) 说明 Aceternity inspiration / adaptation permission；[Animated Tabs 文档](https://github.com/unovue/inspira-ui/blob/eec920b047589058b4b02ba64deb614869e7237a/content/en/2.components/miscellaneous/animated-tabs.md) 明确归因 Aceternity Tabs。此处依据仓库声明，没有声称独立取得 Aceternity 的合同。
- 上游 [LICENSE](https://github.com/unovue/inspira-ui/blob/eec920b047589058b4b02ba64deb614869e7237a/LICENSE)：MIT，Copyright (c) 2024-2026 rahulv.dev。完整许可保留在 [INSPIRA_LICENSE.md](INSPIRA_LICENSE.md)，本地组件保留来源注释。
- 获取方式：只读 sparse Git checkout；原文件、commit 和 hashes 保存在本地 B3 审阅材料 `source/inspira/`。

| 上游文件 | 原始 SHA-256 |
|---|---|
| `AnimatedTabs.vue` | `ff2e9c40490d4a760e6f62720dce95f6d7253bc8f90b54cc2cdaadcf6f6304f6` |
| `AnimatedTabsFadeInDiv.vue` | `5e887c25ad7e8a1db05e1c3994b86445d81b13a7cb26f14700d96fc7513c2906` |
| `animated-tabs.md` | `c2b41033e8c0733ee142014368b4715bc550aea71978a1a511dee0690f1ec5bf` |
| `LICENSE` | `d904968f598513fac059cbeb3dccad62e8b8b65a03dfb175da1d0c6599d16b25` |

组件路径均在 `app/components/inspira/ui/animated-tabs/`；文档路径见上述链接。原始上游文本与 Renderly 实现分开保存，没有把 React 改写冒充原文件。

## 实际消费与改写

`apps/web/components/studio/canvas-tabs.tsx` 由 `canvas-panel.tsx` 实际消费，控制 Canvas / Variants 两个真实面板。

- 保留上游受控 `modelValue` / active selection 组织，改为 React `value` / `onChange`；保留独立 `useId` 与相同 `layoutId` 背景在选中项之间移动的实现结构。
- Vue `Motion` / `motion-v` 改为项目已有 `framer-motion`；用石墨灰/Sage tokens、Tailwind 3 与 160ms easeOut。没有安装 `motion`、`motion-v` 或升级 React/Next/Tailwind。
- 删除 tabs 卡片重排、hover timer、堆叠、3D perspective、rotate、bounce 和 FadeInDiv 的内容层；画布图片不缩放、不旋转、不变色。
- 上游普通 button / 内容 div 改用 Radix Tabs，交由 Radix 处理 roving focus、Arrow/Home/End、tabpanel 关联；面板业务和缩略图是 Renderly 本地实现。
- 新增实时 reduced-motion 订阅；reduce 时替换为静态 span。其他 Studio 动效为本地实现：消息 160ms opacity / 4px、Plan 160ms 高度/opacity、图片就绪后的 200ms crossfade。

新增唯一直接运行时依赖 `@radix-ui/react-tabs` 精确 `1.2.1`，用于可访问标签语义；锁解析新增 5 个 Radix 包。React 19 peer 经严格安装核查。shadcn Button、Dialog 和原有焦点样式继续消费；不引入另一套状态按钮或内部假成功计时器。

生命周期由本地 DemoAgent 的显式批准快照驱动，动效不决定成功。B4 Gallery 使用本地 framer-motion layout、Radix Dialog 和原生 range 比较，没有新增上游源码；不将其标成 Aceternity/Inspira 移植。既有 Canvas Tabs 来源和 MIT 许可保持不变。
