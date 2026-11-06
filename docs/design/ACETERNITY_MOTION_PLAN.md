# Aceternity 动效分工与实施计划

日期：2026-11-06。维护者已指定 [Aceternity UI](https://ui.aceternity.com/components) 为后续动效来源，与现有 shadcn / Radix 配合。此计划保留 Graphite Atelier、Tailwind 3 与 `framer-motion`；不购买 Pro。

## 当前 B4–B6 实施

Gallery 已接通筛选、收藏、详情、版本/变体与键盘比较。网格按稳定资产 ID 使用现有 framer-motion 的 160ms layout 重排；详情继续使用 shadcn/Radix Dialog，比较为本地原生 range + 图片裁剪。没有复制额外 Aceternity/Inspira 组件；没有以本地比较实现冒充上游移植。Canvas Tabs 继续消费下述已授权 MIT 来源，原始许可与 hashes 保留。

应用“减少动效”与系统 reduce 取并集；静态时不挂 Gallery layout 动画，门户弹层同时携带实际动效属性。没有新运行时依赖，没有升级 Tailwind/Next/React。批准和结果归属由共享本地状态驱动，不由动效完成回调决定。

## Studio 既有实施（PR #1 已合并）

维护者已接受 Aceternity → Inspira UI MIT → Renderly 的移植链。Canvas/Variants 实际消费 Animated Tabs 的受控选中态与 shared layout 背景；Radix Tabs 负责真实面板、焦点和键盘。固定 commit、原文件 hashes、许可证和逐项改写记录见 [ACETERNITY_SOURCE.md](ACETERNITY_SOURCE.md)。保留石墨灰、Tailwind 3 和现有 framer-motion；不引入 motion/motion-v。

消息 160ms opacity/4px；Plan 160ms 高度/opacity；图片就绪后 200ms crossfade；Dialog 沿用基础合同。实时 reduced-motion 移除上述移动/渐变。没有沿用来源中的卡片堆叠、3D、bounce 或内部假成功状态。实际运行结果由 DemoAgent 批准快照控制。B3.1 将 Plan 静态分支移出 AnimatePresence，实时偏好切换不保留旧退出列表；固定计划入口复用同一展开状态。B4 的实际实现与来源边界以上述当前记录为准。

## 历史 B2 实施

Sidebar 的选中背景通过现有 `framer-motion` 的 shared layout 在 160ms 内跟随路径变化；正式页面通过 Next template 的重新挂载进行 160ms opacity 淡入。没有图片缩放、旋转、变色或装饰背景。没有新增 npm 依赖。

React `useSyncExternalStore` 订阅浏览器 reduced-motion 媒体查询；启用时导航背景使用静态 span，取消 JS 布局动画；CSS 同时移除页面、控件和弹层动效。服务端默认静态呈现，客户端读取实际偏好。

**B2 未复制、安装或验收 Aceternity 组件。** 当前轻量反馈是本地实现，不能仅凭使用 Framer Motion 宣称完成了 Aceternity 集成。

## B3 / B4 已纳入的工作

| 阶段 | 用户可感知目标 | 来源候选与适配要求 |
|---|---|---|
| B3 Studio | 消息进入；Brief / Plan 展开、折叠和状态变化；按钮状态过渡；结果 180–240ms crossfade | 考察 [Stateful Button](https://ui.aceternity.com/components/stateful-button)、[Tabs](https://ui.aceternity.com/components/tabs) 的状态组织；保留 shadcn Button 和 Radix 的语义。计划审批、执行与结果状态先建模，再绑定动画。 |
| B4 Gallery | 筛选重排、作品详情展开、版本/前后图比较 | 考察 [Layout Grid](https://ui.aceternity.com/components/layout-grid)、[Compare](https://ui.aceternity.com/components/compare)。保留图片原始颜色、比例和用户控制；比较组件须补足键盘语义，不默认带入 Sparkles 装饰。 |

此表记录 B2 时的候选目标；B3 当前实施以上述实际来源记录为准，B4 已由本轮连续任务授权并完成本地实现。B2 的空状态不是 Gallery 动效或 Studio 创作流程的完成品。

## 采用组件时的边界

shadcn / Radix 继续负责基础组件、焦点、键盘、弹窗与可访问语义；Aceternity 负责按场景选择的动画实现来源。不能为 Animated Modal / Tooltip 的外观换掉现有 Radix 交互合同。

2026-11-06 实际查阅的 [官方安装说明](https://ui.aceternity.com/installation) 当前以 Tailwind v4、`motion/react` 和新初始化为默认路线；不能直接用于本项目。后续逐组件检查源码、许可、依赖与可用的 registry / commit / hash，优先适配到现有 Tailwind 3、`tailwind-merge` 2.6.1 和 `framer-motion`。如果现有运行时足够，不增加 `motion` 包；若确需迁移，先给具体证据再单独审阅。

B2 当时只查阅官方页面，没有下载并冻结上述候选组件源码，故没有虚构组件版本、commit、hash 或许可验收结论。真正采用时才建立来源与本地修改清单。

保持石墨灰 / Sage、紧凑工具和图像中心。默认不启用 Aurora、光束、粒子、无限背景、图片倾斜或自动颜色效果。状态按钮的 Promise 完成不能代表真实生成、存储完成；Demo 标识持续可见，真实任务事实以后由后端驱动。

实现参考：[Motion layout](https://motion.dev/docs/react-layout-animations)、[Next 15 template](https://nextjs.org/docs/15/app/api-reference/file-conventions/template)。这些资料说明 API，不代替本仓库的浏览器验证。
