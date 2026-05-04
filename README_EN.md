<div align="center">

# 万恶之源 | The Origin of the Meme

**Bilibili Meme Index · Community-Driven · Xianxia Tier System**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[中文](README.md) | [English](README_EN.md) | [日本語](README_JA.md)

</div>

---

> One day I was scrolling through Bilibili, saw 华强买瓜 (Huaqiang Buying Watermelons) again, and the danmaku was flooded with "万恶之源" (The Origin of the Meme). It hit me: has anyone ever systematically catalogued these "Origin of the Meme" videos, the ones that spark endless remixes and shitposts across the entire site?
>
> Nope. Guess I'll do it myself.
>
> —— Zw-awa

## What Is This

A community-maintained **index of Bilibili "Origin of the Meme" videos**.

We collect the videos that triggered massive waves of remixes, shitposts, and meme culture on Bilibili, rank each meme's popularity using a xianxia (cultivation) tier system, and award every contributor a matching cultivation title.

**We index. We don't redistribute.** All video links point to their original Bilibili pages.

## Table of Contents

- [Meme Cultivation Tiers](#meme-cultivation-tiers)
- [Contributor Titles](#contributor-titles)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Features](#features)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

## Meme Cultivation Tiers

A meme's tier is calculated automatically from its number of indexed videos. The more videos submitted, the hotter the meme:

| Tier | Video Count | Description |
|------|-------------|-------------|
| 杂役弟子 (Servant Disciple) | 0 ~ 2 | Barely anything here. Come add some! |
| 练气期 (Qi Refining) | 3 ~ 5 | Starting to show potential |
| 筑基期 (Foundation Building) | 6 ~ 10 | Gaining some recognition |
| 金丹期 (Golden Core) | 11 ~ 20 | Known throughout the circle |
| 元婴期 (Nascent Soul) | 21 ~ 35 | Breaking into the mainstream |
| 化神期 (Spirit Transformation) | 36 ~ 50 | All over the site |
| 练虚期 (Void Refinement) | 51 ~ 75 | A full-on phenomenon |
| 合体期 (Body Integration) | 76 ~ 100 | Total domination |
| 大乘期 (Great Vehicle) | 101 ~ 149 | Legendary status |
| 渡劫飞升 (Tribulation Transcendence) | 150+ | Eternal Bilibili legend |

Memes that reach 渡劫飞升 (Tribulation Transcendence) are inducted into the **Hall of Honor** with their own dedicated showcase page.

## Contributor Titles

The more videos you get indexed, the higher your title:

| Title | Contributions |
|-------|---------------|
| 杂役弟子 (Servant Disciple) | 1 ~ 4 |
| 外门弟子 (Outer Disciple) | 5 ~ 14 |
| 内门弟子 (Inner Disciple) | 15 ~ 29 |
| 真传弟子 (True Disciple) | 30 ~ 49 |
| 长老 (Elder) | 50 ~ 99 |
| 太上长老 (Grand Elder) | 100+ |

All titles are calculated automatically by GitHub Actions based on contribution data. No favoritism, no exceptions.

## Quick Start

Want to pitch in? Three steps:

**Step 1:** Fork this repo

**Step 2:** Create or edit a YAML file in the `memes/` directory

```yaml
name: 梗的名称
aliases: ["别名1", "别名2"]
origin_video: "https://www.bilibili.com/video/BVxxxxxxxxxx"
description: "一句话描述这个梗的来龙去脉"
tags: ["鬼畜", "影视剪辑"]

videos:
  - bvid: "BVxxxxxxxxxx"
    title: "视频标题"
    author: "UP主名称"
    description: "简要描述"
    contributor: "你的GitHub用户名"
```

**Step 3:** Open a Pull Request, then sit back while the automated checks and review run

For detailed formatting rules, see the [Contribution Guide](CONTRIBUTING.md).

## Project Structure

```
the-origin-of-the-meme/
├── memes/                          # Meme data (hand-maintained YAML files)
│   └── 华强买瓜.yaml               # One file per meme
├── _data/
│   ├── tiers.yaml                  # Tier threshold configuration
│   └── computed.json               # [Auto-generated] Rankings, tiers, contributor data
├── scripts/                        # Automation scripts
│   ├── validate.py                 # PR format validation
│   ├── compute.py                  # Tier & ranking computation
│   └── tiers.py                    # Tier logic helpers
├── docs/                           # GitHub Pages source ✅
├── .github/
│   ├── workflows/                  # GitHub Actions CI
│   │   ├── validate.yml            # PR checks (format validation, dedup, tier preview)
│   │   └── compute.yml             # Auto-compute rankings on merge
│   └── PULL_REQUEST_TEMPLATE.md    # PR template
├── README.md                       # Chinese version
├── README_EN.md                    # English version (you're reading this)
├── README_JA.md                    # Japanese version
├── CONTRIBUTING.md                 # Contribution guide
└── LICENSE                         # MIT license
```

## Features

- **Xianxia Tier System** — Memes are auto-ranked by video count, from 杂役弟子 (Servant Disciple) all the way up to 渡劫飞升 (Tribulation Transcendence)
- **Contributor Titles** — The more you contribute, the higher your title. Built-in community motivation
- **Data / Display Separation** — YAML files store raw data only; rankings and tiers are computed automatically by GitHub Actions
- **Automated PR Checks** — Format validation, duplicate detection, and tier-change previews run on every pull request ✅
- **Hall of Honor** — Memes at 渡劫飞升 (Tribulation Transcendence) tier get a dedicated showcase page ✅
- **GitHub Pages** — A polished browsing experience on the web ✅
- **Contributor Leaderboard** — Auto-generated, showing every contributor's title and contribution count ✅
- **Multilingual Support** — 中文 / English / 日本語

## Contributing

Everyone is welcome! Whether you've been on Bilibili for years or just got started, if you know a meme, you can contribute.

For the full contribution workflow and formatting guidelines, check out [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

All links and metadata in this index are public information compiled and organized for reference. All videos, audio, and related materials are the intellectual property of their original creators and Bilibili (bilibili.com).

This project provides indexing services only. It does not store, reproduce, or distribute any content in any form.

The project and its contributors assume no legal liability for any copyright or legal issues arising from the use of this index to access third-party content.

If you are a copyright holder and believe that inclusion in this index is inappropriate, please contact us via [Issues](../../issues). We will address it promptly.

## License

This project is licensed under the [MIT License](LICENSE).

Note: The MIT license applies only to this project's code, configuration files, and documentation structure. Videos referenced in the index are not part of this project and remain the property of their respective original creators.
