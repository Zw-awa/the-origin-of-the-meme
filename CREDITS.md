# 第三方资源署名 · Third-Party Credits

## 荣誉殿堂页（hall-of-fame.html）视觉效果

本站的 **荣誉殿堂** 页（`docs/hall-of-fame.html`）的视觉效果、动画架构、CSS 以及 JavaScript 核心实现**改编自**：

- **作者**：Antoine Wodniack
- **原作**：[wodniack.dev](https://wodniack.dev)
- **源码**：[github.com/AntoineW/AW-2025-Portfolio](https://github.com/AntoineW/AW-2025-Portfolio)
- **原作许可证**：[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)

### 改编范围

- 全部文本内容已改为中文梗文化主题
- Hero 段大标题从「Creative · Developer」改为「荣誉 · 殿堂」
- Work 段 32 个个人作品替换为动态读取 `_data/computed.json` 生成的最多 30 个梗卡片
- About 段「About + Awards」左右两栏布局改为竖排修仙等级阶梯（规划中）
- CTA 段摆动文字「LET'S / ROCK」改为「贡献 / 找梗」
- 新增夜 / 昼双主题（夜：黑底 + B 站粉；昼：白底 + B 站蓝）

### 复用的原资源文件

以下文件**完整保留 Antoine 原作**，未作修改（位于 `docs/hall-assets/`）：

- `_astro/index.MJ9FiCyD.css`（全部样式）
- `_astro/hoisted.BvNyQ0G_.js`（仅对 `.draw()` 包了 try-catch 避免未加载图片报错；`video.play()` 加了 `.catch()` 避免自动播放策略阻断；其它未改）
- `fonts/PPEditorialNew-*.woff2`、`fonts/PPFraktionMono-*.woff2`、`fonts/Bigger-Display.woff2`
- `images/asset-star.svg`、`images/sprite-vanish.png` 等

### 本项目的修改部分

本项目自身代码（除上述 wodniack 资源外）按 **MIT 协议**开源。由于我们对 wodniack 作品的改编必须沿用 CC BY-NC 4.0，因此 `docs/hall-of-fame.html` 以及 `docs/hall-assets/` 整体遵循 **CC BY-NC 4.0**，禁止商业使用。

### 致谢

感谢 Antoine Wodniack 将其高质量作品开源，让我们能在中文梗文化项目中复用这套动画语言。原作的开源精神与本项目的开源精神同源——这也是梗文化共建的意义。

🔗 **Please visit**：[wodniack.dev](https://wodniack.dev) — 去看看原作，值得。

---

# Third-Party Credits (English)

## Hall of Fame Page Visual Effects

The **Hall of Fame** page (`docs/hall-of-fame.html`) visual effects, animation architecture, CSS and core JavaScript are **adapted from**:

- **Author**: Antoine Wodniack
- **Original**: [wodniack.dev](https://wodniack.dev)
- **Source**: [github.com/AntoineW/AW-2025-Portfolio](https://github.com/AntoineW/AW-2025-Portfolio)
- **Original License**: [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)

### Scope of Changes

- All text content translated to Chinese for meme cultural theme
- Hero title changed from "Creative · Developer" to "荣誉 · 殿堂" (Hall of Fame)
- Work section's 32 personal projects replaced with up to 30 meme cards dynamically populated from `_data/computed.json`
- About section repurposed from "About + Awards" layout to Xianxia cultivation tier ladder (in progress)
- CTA swinging text "LET'S / ROCK" changed to "贡献 / 找梗" (Contribute / Find memes)
- Added night / day dual theme (night: black + Bilibili pink; day: white + Bilibili blue)

### Original Resources Preserved

Files under `docs/hall-assets/` are Antoine's originals with minimal modifications:

- `_astro/index.MJ9FiCyD.css` (all styles, unchanged)
- `_astro/hoisted.BvNyQ0G_.js` (only wrapped `.draw()` in try-catch to prevent broken-image errors; added `.catch()` to `video.play()` to handle autoplay policy; otherwise unchanged)
- Fonts and decorative assets

### Licensing

The rest of this project is MIT. But since our adaptation must inherit CC BY-NC 4.0, `docs/hall-of-fame.html` and `docs/hall-assets/` are under **CC BY-NC 4.0** — no commercial use.

Many thanks to Antoine for open-sourcing such a high-quality work.

🔗 **Please visit**: [wodniack.dev](https://wodniack.dev) — go see the original, it's beautiful.
