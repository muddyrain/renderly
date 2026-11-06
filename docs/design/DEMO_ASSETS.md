# B3 本地样图记录

获取与验证日期：2026-11-06。三张为 Unsplash CDN 资源的本地下载副本，非本轮模型生成。实际用 sips 和浏览器解码验证，均为 1400 × 933 JPEG。通过原始 HTTPS CDN GET 获取，不含 UI 截图或设计图裁片。

许可依据：[Unsplash 官方 License](https://unsplash.com/license)，允许免费商业/非商业使用、下载和分发照片，署名非强制。这里作为应用内预置样图使用，不构建图库服务或出售原图。尚未核实这些历史 CDN ID 对应的摄影师姓名和规范照片详情页，故不编造作者或将 URL ID 当作者；保留准确资源地址，许可依据不等于声称已逐一核验摄影师身份。

## mountain.jpg

- 文件：`apps/web/public/demo/mountain.jpg`
- 原始资源：[Unsplash CDN](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=85)
- SHA-256：`c65f5c99c7d9c2295cb363e5e9321b4268fe3dd576205b01beeccbd6f78d980d`
- 实际像素：1400 × 933；用途：自然光景 v1 山谷方向 / v2 清晰山谷。

## meadow.jpg

- 文件：`apps/web/public/demo/meadow.jpg`
- 原始资源：[Unsplash CDN](https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1400&q=85)
- SHA-256：`3d1032ddbe9e1527c202586f64ef94f7002327d818596da47b8b7371f5a6ee2c`
- 实际像素：1400 × 933；用途：自然光景 v1 晨光方向 / v2 柔光方向。

## forest.jpg

- 文件：`apps/web/public/demo/forest.jpg`
- 原始资源：[Unsplash CDN](https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=85)
- SHA-256：`a134072db722f184f610d3215d24446005e2e2c0d4357646bafd584b22d3c643`
- 实际像素：1400 × 933；用途：林间光线研究 v1 / Brief 默认引用。

## 图像与状态关系

fixture 中的 asset → version → variant → image 是预置方向关系，不是服务端编辑历史。自然光景的两个版本复用山谷/晨光两张照片，但顺序、变体 ID 和示例 Prompt 不同；林间资产单独记忆选择。切换资产不会将另一资产的版本/变体索引写入本资产。标题与 alt 按真实照片内容编写。

主画布和放大使用 contain，不裁切、不加滤镜；缩略图仅用 cover 作导航。Brief 的画幅是创作意向，不会伪造文件尺寸或裁切照片。初始画布明确标“样例素材 · 非本轮生成”；本地演示完成也明确标“预置素材，非模型输出”。新会话没有样图，须显式载入或批准本地演示。

加载、失败与重试属于资源实例；切图或 retry key 创建新实例，卸载回调失效，上一资源迟到不改变当前选择。文件随应用本地提供，正式 Studio 验收不依赖外部图床。
