#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

import yaml

from tiers import load_tiers, lookup_tier
from validate import (
    sanitize_md,
    validate_bvid_dedup,
    validate_field_formats,
    validate_filename,
    validate_required_fields,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MEMES_DIR = PROJECT_ROOT / "memes"
TIERS_PATH = PROJECT_ROOT / "_data" / "tiers.yaml"
COMPUTED_PATH = PROJECT_ROOT / "_data" / "computed.json"
REPORT_PATH = PROJECT_ROOT / "issue-validation-report.md"

TITLE_PREFIX = "[Meme Intake]"
SECTION_PATTERN = re.compile(
    r"^###\s+(?P<heading>.+?)\s*$\n(?P<body>[\s\S]*?)(?=^###\s+.+?\s*$|\Z)",
    re.MULTILINE,
)
CODE_BLOCK_PATTERN = re.compile(
    r"```(?:yaml)?\s*\n(?P<body>[\s\S]*?)\n```",
    re.IGNORECASE,
)
EXPECTED_HEADINGS = {
    "提交类型": "submission_type",
    "梗名称": "meme_name",
    "目标文件名": "target_filename",
    "YAML 提案": "yaml_payload",
    "补充说明": "notes",
}
REQUIRED_FIELDS = ("submission_type", "meme_name", "target_filename", "yaml_payload")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Validate a meme intake GitHub Issue payload"
    )
    parser.add_argument(
        "--event-path",
        default=os.environ.get("GITHUB_EVENT_PATH", ""),
        help="Path to GitHub event JSON",
    )
    parser.add_argument("--title", default="", help="Issue title override")
    parser.add_argument(
        "--body-file",
        default="",
        help="Read issue body from a file, or '-' for stdin",
    )
    parser.add_argument("--body", default="", help="Issue body override")
    return parser.parse_args()


def load_issue_payload(args):
    if args.event_path:
        event_path = Path(args.event_path)
        if event_path.exists():
            event = json.loads(event_path.read_text(encoding="utf-8"))
            issue = event.get("issue") or {}
            return issue.get("title", "") or "", issue.get("body", "") or ""

    title = args.title or ""
    if args.body_file:
        if args.body_file == "-":
            body = sys.stdin.read()
        else:
            body = Path(args.body_file).read_text(encoding="utf-8")
        return title, body

    return title, args.body or ""


def parse_sections(body):
    sections = {}
    normalized = body.replace("\r\n", "\n")
    for match in SECTION_PATTERN.finditer(normalized):
        heading = match.group("heading").strip()
        content = match.group("body").strip()
        sections[heading] = content
    return sections


def strip_code_block(text):
    text = (text or "").strip()
    match = CODE_BLOCK_PATTERN.search(text)
    if match:
        return match.group("body").strip()
    return text


def parse_yaml_text(display_path, raw_yaml):
    errors = []

    try:
        data = yaml.safe_load(raw_yaml)
    except yaml.YAMLError as exc:
        if hasattr(exc, "problem_mark") and exc.problem_mark is not None:
            line = exc.problem_mark.line + 1
            message = getattr(exc, "problem", str(exc))
            errors.append((display_path, "YAML 语法", f"第 {line} 行: {message}"))
        else:
            errors.append((display_path, "YAML 语法", str(exc)))
        return errors, None

    if data is None:
        errors.append((display_path, "YAML 语法", "YAML 提案为空或解析结果为空"))
        return errors, None

    if not isinstance(data, dict):
        errors.append((display_path, "YAML 语法", "根节点必须是字典（mapping），不能是列表或标量"))
        return errors, None

    return errors, data


def load_repo_yaml(path):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle)
    except (OSError, yaml.YAMLError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def normalize_submission_type(value):
    return (value or "").strip()


def collect_repo_name_conflicts(target_path, proposed_name):
    if not proposed_name:
        return []

    conflicts = []
    for path in sorted(MEMES_DIR.glob("*.yaml")):
        if path.resolve() == target_path.resolve():
            continue
        data = load_repo_yaml(path)
        if not data:
            continue
        name = data.get("name", path.stem)
        if name == proposed_name:
            conflicts.append(path)
    return conflicts


def collect_cross_file_bvid_warnings(target_path, proposed_data):
    warnings = []
    proposed_videos = proposed_data.get("videos")
    if not isinstance(proposed_videos, list):
        return warnings

    proposed_occurrences = {}
    for idx, video in enumerate(proposed_videos):
        if not isinstance(video, dict):
            continue
        bvid = video.get("bvid")
        if isinstance(bvid, str) and (bvid := bvid.strip()):
            proposed_occurrences.setdefault(bvid, []).append(idx)

    if not proposed_occurrences:
        return warnings

    for path in sorted(MEMES_DIR.glob("*.yaml")):
        if path.resolve() == target_path.resolve():
            continue
        data = load_repo_yaml(path)
        if not data:
            continue
        videos = data.get("videos")
        if not isinstance(videos, list):
            continue
        for idx, video in enumerate(videos):
            if not isinstance(video, dict):
                continue
            bvid = video.get("bvid")
            if not isinstance(bvid, str):
                continue
            bvid = bvid.strip()
            if not bvid or bvid not in proposed_occurrences:
                continue
            for proposed_idx in proposed_occurrences[bvid]:
                warnings.append(
                    f'bvid "{bvid}" 同时出现在 {target_path.name} videos[{proposed_idx}] 与 {path.name} videos[{idx}]'
                )
    return warnings


def contributor_counter(videos):
    counts = Counter()
    if not isinstance(videos, list):
        return counts

    for video in videos:
        if not isinstance(video, dict):
            continue
        contributor = video.get("contributor")
        if not isinstance(contributor, str):
            continue
        contributor = contributor.strip()
        if contributor:
            counts[contributor] += 1
    return counts


def load_computed():
    if not COMPUTED_PATH.exists():
        return None
    try:
        return json.loads(COMPUTED_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def build_success_context(target_path, proposed_data, meme_tiers, contributor_tiers):
    existing_data = load_repo_yaml(target_path) if target_path.exists() else None
    computed = load_computed() or {}

    current_contributor_counts = {
        item.get("github"): item.get("count", 0)
        for item in computed.get("contributors", [])
        if isinstance(item, dict) and item.get("github")
    }

    old_videos = existing_data.get("videos", []) if existing_data else []
    new_videos = proposed_data.get("videos", []) if isinstance(proposed_data.get("videos"), list) else []

    old_submissions = len(old_videos) if isinstance(old_videos, list) else 0
    new_submissions = len(new_videos)

    old_tier = lookup_tier(old_submissions, meme_tiers)
    new_tier = lookup_tier(new_submissions, meme_tiers)

    contributor_changes = Counter()
    contributor_changes.subtract(contributor_counter(old_videos))
    contributor_changes.update(contributor_counter(new_videos))

    affected_contributors = []
    for github, delta in sorted(contributor_changes.items()):
        if delta == 0:
            continue
        old_count = current_contributor_counts.get(github, 0)
        new_count = old_count + delta
        affected_contributors.append(
            {
                "github": github,
                "delta": delta,
                "old_count": old_count,
                "new_count": new_count,
                "old_title": lookup_tier(old_count, contributor_tiers),
                "new_title": lookup_tier(new_count, contributor_tiers),
            }
        )

    return {
        "target_exists": target_path.exists(),
        "old_submissions": old_submissions,
        "new_submissions": new_submissions,
        "old_tier": old_tier,
        "new_tier": new_tier,
        "affected_contributors": affected_contributors,
    }


def make_fix_suggestion(check, message, path_display):
    safe_path = sanitize_md(path_display)
    safe_msg = sanitize_md(message)

    if check == "必填字段":
        if "缺少 " in message:
            field = (
                message.replace("缺少 ", "")
                .replace(" 字段或为空", "")
                .replace(" 字段", "")
                .replace(" 或为空", "")
                .strip()
            )
            return f"- {safe_path}: 请补齐 `{sanitize_md(field)}`"
        return f"- {safe_path}: {safe_msg}"

    if check == "文件名":
        return f"- {safe_path}: 请把文件名改成 `梗名.yaml`，并只使用中文、字母、数字、下划线或连字符"
    if check == "YAML 语法":
        return f"- {safe_path}: 请修正 YAML 缩进、冒号和列表格式"
    if check == "bvid 格式":
        return f"- {safe_path}: 请把 BV 号改成 `BV` 开头的 12 位字符串"
    if check == "bvid 重复":
        return f"- {safe_path}: 请移除重复的 BV 号"
    if check == "日期格式":
        return f"- {safe_path}: `origin_date` 必须使用 `YYYY-MM-DD`"
    if check == "链接格式":
        return f"- {safe_path}: `origin_video` 需要是完整的 Bilibili 视频链接"
    if check == "名称一致":
        return f"- {safe_path}: 请让 YAML 中的 `name` 与文件名保持一致"
    return f"- {safe_path}: {safe_msg}"


def write_failure_report(summary_rows, errors, warnings):
    lines = [
        "<!-- issue-intake-validation -->",
        "## ❌ 梗提报自动校验失败",
        "",
        "当前 Issue 已完成自动校验，但还不能进入人工审核队列。",
        "",
        "### 提报摘要",
        "| 项目 | 内容 |",
        "|------|------|",
    ]

    for label, value in summary_rows:
        lines.append(f"| {sanitize_md(label)} | {sanitize_md(value)} |")

    lines.extend(
        [
            "",
            "### 错误详情",
            "| 文件 | 检查项 | 错误信息 |",
            "|------|--------|----------|",
        ]
    )
    for path_display, check, message in errors:
        lines.append(
            f"| {sanitize_md(path_display)} | {sanitize_md(check)} | {sanitize_md(message)} |"
        )

    lines.extend(["", "### 修复建议"])
    seen = set()
    for path_display, check, message in errors:
        suggestion = make_fix_suggestion(check, message, path_display)
        if suggestion in seen:
            continue
        seen.add(suggestion)
        lines.append(suggestion)

    if warnings:
        lines.extend(["", "### ⚠️ 额外提示"])
        for warning in warnings:
            lines.append(f"- {sanitize_md(warning)}")

    lines.extend(
        [
            "",
            "### 下一步",
            "- 修改当前 Issue 内容后，GitHub Actions 会自动重新校验",
            "- 如果你已经能直接改仓库，建议改用 PR，这样可以直接复用现有正式收录流程",
        ]
    )

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_success_report(summary_rows, success_ctx, warnings):
    lines = [
        "<!-- issue-intake-validation -->",
        "## ✅ 梗提报自动校验通过",
        "",
        "基础格式、字段和 YAML 结构已通过自动检查。该 Issue 现在应进入人工审核队列。",
        "",
        "### 提报摘要",
        "| 项目 | 内容 |",
        "|------|------|",
    ]

    for label, value in summary_rows:
        lines.append(f"| {sanitize_md(label)} | {sanitize_md(value)} |")

    lines.extend(
        [
            "",
            "### 本次提报影响预览",
            "| 梗名称 | 当前收录 | 提报后 | 当前等级 | 提报后等级 |",
            "|--------|---------|--------|---------|-----------|",
        ]
    )

    old_display = f"{success_ctx['old_submissions']} ({success_ctx['old_tier']})"
    new_display = f"{success_ctx['new_submissions']} ({success_ctx['new_tier']})"
    lines.append(
        "| {name} | {old} | {new} | {old_tier} | {new_tier} |".format(
            name=sanitize_md(dict(summary_rows).get("梗名称", "")),
            old=sanitize_md(old_display),
            new=sanitize_md(new_display),
            old_tier=sanitize_md(success_ctx["old_tier"]),
            new_tier=sanitize_md(success_ctx["new_tier"]),
        )
    )

    affected = success_ctx["affected_contributors"]
    if affected:
        lines.extend(
            [
                "",
                "### 贡献者影响",
                "| 贡献者 | 当前贡献数 | 提报后 | 当前称号 | 提报后称号 |",
                "|--------|-----------|--------|---------|-----------|",
            ]
        )
        for item in affected:
            old_count = f"{item['old_count']} ({item['old_title']})"
            new_count = f"{item['new_count']} ({item['new_title']})"
            lines.append(
                "| {github} | {old_count} | {new_count} | {old_title} | {new_title} |".format(
                    github=sanitize_md(item["github"]),
                    old_count=sanitize_md(old_count),
                    new_count=sanitize_md(new_count),
                    old_title=sanitize_md(item["old_title"]),
                    new_title=sanitize_md(item["new_title"]),
                )
            )

    if warnings:
        lines.extend(["", "### ⚠️ 额外提示"])
        for warning in warnings:
            lines.append(f"- {sanitize_md(warning)}")

    lines.extend(
        [
            "",
            "### 人工审核仍需确认",
            "- 这些视频是否确实与该梗强相关，且没有语义层面的重复收录",
            "- 梗的描述、出处、origin_video 是否准确",
            "- 是否适合正式进入仓库，或需要作者改用 PR 继续提交",
        ]
    )

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    try:
        _main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


def _main():
    args = parse_args()
    title, body = load_issue_payload(args)

    sections = parse_sections(body)
    fields = {key: sections.get(heading, "").strip() for heading, key in EXPECTED_HEADINGS.items()}

    summary_rows = [
        ("Issue 标题", title or "(空)"),
        ("提交类型", normalize_submission_type(fields.get("submission_type")) or "(缺失)"),
        ("梗名称", fields.get("meme_name") or "(缺失)"),
        ("目标文件名", fields.get("target_filename") or "(缺失)"),
        ("入口类型", "Issue Intake"),
    ]

    errors = []
    warnings = []

    if title and not title.startswith(TITLE_PREFIX):
        errors.append(("(issue body)", "Issue 标题", f'标题必须以 "{TITLE_PREFIX}" 开头'))

    for field in REQUIRED_FIELDS:
        if not fields.get(field):
            label = {
                "submission_type": "提交类型",
                "meme_name": "梗名称",
                "target_filename": "目标文件名",
                "yaml_payload": "YAML 提案",
            }[field]
            errors.append(("(issue body)", "Issue 表单", f"缺少必填区块：{label}"))

    target_filename = fields.get("target_filename", "").strip()
    display_path = f"memes/{target_filename}" if target_filename else "memes/<missing>.yaml"
    target_path = MEMES_DIR / target_filename if target_filename else MEMES_DIR / "<missing>.yaml"

    if target_filename:
        for message in validate_filename(display_path):
            errors.append((display_path, "文件名", message))

    raw_yaml = strip_code_block(fields.get("yaml_payload", ""))
    data = None
    if raw_yaml:
        yaml_errors, data = parse_yaml_text(display_path, raw_yaml)
        errors.extend(yaml_errors)

    if data is not None:
        errors.extend(validate_required_fields(display_path, data))
        errors.extend(validate_field_formats(display_path, data))
        errors.extend(validate_bvid_dedup(display_path, data))

        issue_meme_name = fields.get("meme_name", "").strip()
        yaml_meme_name = data.get("name", "").strip() if isinstance(data.get("name"), str) else ""
        if issue_meme_name and yaml_meme_name and issue_meme_name != yaml_meme_name:
            errors.append(
                (display_path, "Issue 一致性", f'Issue 中的梗名称 "{issue_meme_name}" 与 YAML 中的 name "{yaml_meme_name}" 不一致')
            )

        submission_type = normalize_submission_type(fields.get("submission_type"))
        if submission_type == "新增梗条目" and target_path.exists():
            errors.append(
                (display_path, "提交类型", "目标文件已存在；如果是补视频或修正，请改用对应提交类型")
            )
        elif submission_type in {"为已有梗添加视频收录", "修正已有条目信息"} and not target_path.exists():
            errors.append(
                (display_path, "提交类型", "目标文件不存在；如果这是新梗，请改用“新增梗条目”")
            )

        conflicts = collect_repo_name_conflicts(target_path, yaml_meme_name)
        for conflict in conflicts:
            errors.append(
                (display_path, "名称重复", f'"{yaml_meme_name}" 已存在于 memes/{conflict.name}，梗名称不能重复')
            )

        warnings.extend(collect_cross_file_bvid_warnings(target_path, data))

    if errors:
        write_failure_report(summary_rows, errors, warnings)
        print(f"❌ Issue validation failed with {len(errors)} error(s)")
        sys.exit(1)

    meme_tiers, contributor_tiers = load_tiers(TIERS_PATH)
    success_ctx = build_success_context(target_path, data, meme_tiers, contributor_tiers)
    write_success_report(summary_rows, success_ctx, warnings)
    print("✅ Issue validation passed")


if __name__ == "__main__":
    main()
