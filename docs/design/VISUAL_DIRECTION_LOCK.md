# Renderly 视觉方向冻结 — Graphite Atelier

当前阶段：B4–B6 前端演示收口，停在新 PR 的 Code Review。Studio 与六条真实路由使用本视觉方向；动效当前合同见 [MOTION_SPEC](../MOTION_SPEC.md)，后续 Gallery 计划见 [ACETERNITY_MOTION_PLAN.md](ACETERNITY_MOTION_PLAN.md)。

状态：**维护者已选择**。日期：2026-11-06。
选择依据：维护者在两张实际生成稿展示后回复“第1个作为视觉方向吧”。
精确参考：./p0-10-graphite-reference.png。
该图对应上一轮第 1 张石墨灰稿，不是第 2 张暖白稿。视觉方向确定，无需再次确认。

## 信息结构

- Studio-first 的专业创作工作台，不是企业官网首页。
- 左导航 → 左侧 Agent → 右侧大画布。
- 顶部项目上下文与简洁 Demo 提示；图像是视觉中心。
- 导航只含 Studio、Gallery、Projects、Characters、Models、Settings。参考稿多出的 Home 不实施。
- 导航宽度约 176–192px，Agent 336–368px，剩余宽度给画布；顶部项目栏约 52–56px。具体比例可因视口调整，不能挤小正文。
- 1280×720、1440×900、1920×1080 桌面验收；参考方向的设计画幅为约 1440×1024。无需移动端。

Studio 使用当前本地交互与三张样图，其他五页使用同一视觉体系，提供 Gallery、项目、角色、模型与设置的本地演示交互。组件预览只展示基础控件与布局合同，不伪装成真实业务。

## 颜色 Tokens

以本文设计值为准；实现时统一转换为 Tailwind 3 兼容的语义变量，并保持 alpha 修饰可用。

| Token | 色值 | 用途 |
|---|---|---|
| background | #151719 | 应用基础表面 |
| navigation | #1B1E20 | 导航 |
| surface | #202427 | Agent、表单、面板 |
| canvas | #101214 | 中性画布周边 |
| foreground | #ECEEEB | 主要文字 |
| muted-foreground | #A9B0B0 | 次要文字 |
| border | #34393C | 结构分隔 |
| primary | #AEC2A7 | sage 主要操作 |
| primary-foreground | #182019 | 主要按钮深色文字 |
| selection | #303B30 | 导航与素材选中 |
| focus-ring | #C5D7BE | 键盘焦点 |
| success-foreground | #A9CAB0 | 成功文字与图标 |
| warning-foreground | #DDC391 | 待审批 / 注意文字 |
| destructive-foreground | #E4A6A2 | 错误文字与图标 |

状态色不自动作为填充背景；需在真实表面组合中验证对比度。一个色值适合文字不代表可直接做白字按钮。

## 字体与组件

| 项目 | 规范 |
|---|---|
| 字体 | system-ui / Inter fallback；中文系统无衬线，不新增远程字体依赖 |
| 正文 / 对话 / 输入 | 14–16px，行高 1.5–1.65 |
| 元数据 | 12–13px；不沿用重要信息的 8–10px |
| 页面标题 | 20px / 600 |
| 间距 | 4px 基础；8 / 12 / 16 / 24 / 32px |
| 普通控件高度 | 32–36px |
| 主要确认控件 | 36–40px |
| 圆角 | 工具 4–6px，弹层 8px；不默认胶囊 |
| 图标 | 已选择的 Lucide，常规 16px、导航 18px，统一 stroke |
| 层级 | 留白、字重、分组和分隔线优先；避免卡片套卡片 |
| 阴影 | 只给确有需要的浮层；不普遍铺满 |
| 图片 | 完整看图用 contain；缩略图裁切须保留选择和比例信息 |

基础 Button、Input、Textarea、Dialog、Tooltip 使用与现有版本兼容的 shadcn 源码。只为实际消费加入依赖和组件，按职责书写多行、可读代码。

## 动效

- 无 ambient 漂移、glow pulse、装饰波形或大量玻璃。
- 小型状态/导航淡入 140–180ms；弹层 120–160ms。
- 当前图片更换使用 200ms crossfade，不默认缩放。
- reduced-motion 去除位移与循环动画，状态即时可读。
- 沿用 framer-motion 包；不因 Motion 名称变化重复装库。

## 真实能力与题材

画中精灵、城堡、游戏宣传项目是样例题材；Renderly 面向通用视觉创作，不限于游戏。参考稿不构成真实性、品牌一致性或模型支持承诺。

Demo 提示持续可见；模型、任务、资产、计划、usage 不得假装接通后端。当前本地演示不实现真实 Agent Run、生成任务、参考图上传、保存 Provider 密钥或项目持久化。Gallery 的样图下载仅下载本地原始 JPEG，不是生成服务导出。参考图只用于设计对照，不能整张作为 UI 背景图使用。

图中 avatar、装饰性 logo、Home、额外最近项目不是新增功能要求。只冻结上述产品结构和设计值，不照搬图内每个生成细节。

## 审批边界

B4–B6 连续任务已授权合并精确 PR #1、实现本地前端、提交推送并请求审阅。新 PR 停在 Code Review，不自动合并；P1 和付费 API 不在本轮范围。
