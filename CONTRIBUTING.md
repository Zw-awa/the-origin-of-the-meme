# 贡献指南

感谢你对「万恶之源」项目的关注！这个项目靠社区共建，每一份贡献都很重要。

## 如何贡献

### 1. Fork & Clone

```bash
# Fork 本仓库后
git clone https://github.com/<你的用户名>/the-origin-of-the-meme.git
cd the-origin-of-the-meme
```

### 2. 创建分支

```bash
git checkout -b add/你要添加的梗名
# 或
git checkout -b update/你要更新的梗名
```

### 3. 添加或修改梗文件

所有梗文件存放在 `memes/` 目录下，每个梗一个 YAML 文件。

#### 新建一个梗

在 `memes/` 下创建 `梗名.yaml`，文件名就是梗的名字。

#### YAML 格式规范

```yaml
name: 梗的名称                    # [必填] 梗的正式名称
aliases: ["别名1", "别名2"]       # [可选] 这个梗的其他叫法
origin_video: "https://www.bilibili.com/video/BVxxxxxxxxxx"  # [必填] 万恶之源视频链接，找不到可留空字符串 ""
origin_date: "2020-01-15"         # [可选] 万恶之源视频的发布日期，格式 YYYY-MM-DD
description: "一句话描述这个梗"    # [必填] 简要介绍这个梗的来龙去脉
tags: ["标签1", "标签2"]          # [可选] 分类标签，如：鬼畜、影视剪辑、游戏、动画、音乐等

videos:                           # [必填] 收录的相关视频列表，至少一条
  - bvid: "BVxxxxxxxxxx"          # [必填] B站视频的 BV 号
    title: "视频标题"              # [必填] 视频标题
    author: "UP主名称"             # [可选] UP主名称
    description: "简要描述"        # [可选] 一句话说明这个视频和梗的关系
    contributor: "你的GitHub用户名" # [必填] 提交这条收录的贡献者 GitHub 用户名
```

#### 字段说明

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `name` | 是 | string | 梗的正式名称，应与文件名一致 |
| `aliases` | 否 | string[] | 别名列表 |
| `origin_video` | 是 | string | B站视频链接，找不到原视频可留空 `""` |
| `origin_date` | 否 | string | 格式 `YYYY-MM-DD` |
| `description` | 是 | string | 一两句话介绍这个梗 |
| `tags` | 否 | string[] | 分类标签 |
| `videos` | 是 | list | 收录的相关视频，至少一条 |
| `videos[].bvid` | 是 | string | BV 号，以 `BV` 开头的 12 位字符串 |
| `videos[].title` | 是 | string | 视频标题 |
| `videos[].author` | 否 | string | UP主名称 |
| `videos[].description` | 否 | string | 简要描述 |
| `videos[].contributor` | 是 | string | 你的 GitHub 用户名 |

#### BV 号格式

BV 号是 B站视频的唯一标识，格式为 `BV` 开头加 10 位字母数字混合字符，例如 `BV1GJ411x7h7`。

你可以从视频 URL 中获取：`https://www.bilibili.com/video/BV1GJ411x7h7` → BV 号为 `BV1GJ411x7h7`。

只需要填写 BV 号本身，不需要完整 URL。

### 4. 提交 PR

```bash
git add memes/你的梗名.yaml
git commit -m "add: 梗名"
git push origin add/你的梗名
```

然后到 GitHub 上创建 Pull Request，按照 PR 模板填写信息。

#### PR 标题规范

- 新增梗：`add: 梗名`
- 添加视频：`update: 梗名 - 添加视频`
- 修正信息：`fix: 梗名 - 修正内容`

### 5. 等待审核

PR 提交后，GitHub Actions 会自动检查：
- YAML 格式是否正确
- 必填字段是否完整
- BV 号是否重复
- 并生成一条评论，告诉你这次提交会让梗的等级发生什么变化

审核通过后会合并到主分支，梗的等级和排行榜会自动更新。

## 不方便提 PR？可以先提 Issue

如果你暂时不方便直接 Fork + 提交 PR，现在也可以使用仓库里的 **「梗数据提报」Issue 模板**：

- 在 Issue 表单里填写提交类型、梗名称、目标文件名
- 粘贴 **完整的目标 YAML 文件内容**
- 提交后会自动进行基础校验
- 校验通过后，Issue 会打上“待人工审核”状态标签

这条链路适合“先提报、后处理”，但要注意：

- **Issue 不会直接写入仓库**
- 正式收录仍然需要维护者人工审核，或将内容转成 PR
- 如果你已经能直接改仓库，还是优先推荐 PR，因为这是完整、正式、可追踪的提交路径

如果维护者确认某条 Issue 提报可以继续推进，也可以给该 Issue 添加 `action:create-draft-pr` 标签。仓库会自动：

- 把 Issue 中的 YAML 提案写入目标文件
- 运行一次 `scripts/compute.py`
- 创建或更新一条对应的 Draft PR

这样就能把“先提 Issue”平滑转到正式的 PR 审核链路里。

如果 Draft PR 创建后，提报者又更新了原 Issue，维护者可以再添加 `action:sync-from-issue` 标签。仓库会用最新的 Issue 内容重新同步同一条 Draft PR 分支。

## 维护者快速上手

如果你是仓库维护者，下面这套流程可以最快把 Issue 提报接入正式审核链路。

### 场景 1：Issue 刚提交，先看自动校验结果

1. 打开使用 **「梗数据提报」** 模板创建的 Issue
2. 查看 GitHub Actions 自动评论
3. 看标签状态：
   - `status:auto-check-passed` + `status:needs-manual-review`：可以进入人工判断
   - `status:auto-check-failed` + `status:awaiting-author-update`：先让提报者修正，不要继续转 PR

### 场景 2：决定把 Issue 转成 Draft PR

适用条件：

- 自动校验已经通过
- YAML 结构基本可信
- 内容值得继续进入正式代码审核

操作方法：

1. 给该 Issue 添加 `action:create-draft-pr` 标签
2. 等待 Actions 自动执行
3. 工作流会自动：
   - 把 Issue 中的 YAML 提案写入目标文件
   - 运行 `scripts/compute.py`
   - 创建或更新一条对应的 Draft PR
4. 回到 Issue 查看机器人评论里的 Draft PR 链接

### 场景 3：Issue 更新后，重新同步到已有 Draft PR

如果提报者没有直接改 Draft PR，而是继续修改了原 Issue 内容：

1. 先确认 Issue 最新内容已经重新通过自动校验
2. 给该 Issue 添加 `action:sync-from-issue` 标签
3. 工作流会把最新 Issue 内容重新同步到同一条 Draft PR 分支

这个动作适合“继续以 Issue 作为编辑入口”的情况；如果提报者已经开始直接改 Draft PR，就不需要再同步。

### 场景 4：什么时候不要转 PR

下面这些情况建议停在 Issue 阶段，不要直接转 Draft PR：

- 自动校验没通过
- YAML 虽然合法，但梗归类明显有争议
- 视频和梗的关联性不足
- 与现有条目重复，但提报者还没说明差异
- 你希望作者先补充 `origin_video`、描述或上下文说明

### 推荐的最短处理路径

对于大多数维护者，最快的操作就是：

1. 看 Issue 标签是否为 `status:auto-check-passed`
2. 快速检查 YAML 和内容是否靠谱
3. 可以推进就打 `action:create-draft-pr`
4. 若作者后来继续改 Issue，再打 `action:sync-from-issue`
5. 后续全部回到 Draft PR 里按正常 PR 流程审

## 收录建议

- 推荐收录播放量超过 1 万的视频，但这不是硬性要求
- 有些梗的万恶之源本身播放量不高，但衍生内容很火，这种更值得收录
- 同一个梗下不要重复收录同一个 BV 号

## 贡献者称号

你在所有梗文件中作为 `contributor` 出现的总次数决定了你的称号，由 GitHub Actions 自动计算：

| 称号 | 贡献次数 |
|------|----------|
| 杂役弟子 | 1 ~ 4 |
| 外门弟子 | 5 ~ 14 |
| 内门弟子 | 15 ~ 29 |
| 真传弟子 | 30 ~ 49 |
| 长老 | 50 ~ 99 |
| 太上长老 | 100+ |

## 有问题？

欢迎在 [Issues](../../issues) 中提问或讨论。
