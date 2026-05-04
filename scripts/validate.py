#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

import yaml

from tiers import load_tiers, lookup_tier

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MEMES_DIR = str(PROJECT_ROOT / "memes")
TIERS_PATH = str(PROJECT_ROOT / "_data" / "tiers.yaml")
COMPUTED_PATH = str(PROJECT_ROOT / "_data" / "computed.json")
REPORT_PATH = str(PROJECT_ROOT / "validation-report.md")

BVID_REGEX = re.compile(r"^BV[a-zA-Z0-9]{10}$")
FILENAME_STEM_REGEX = re.compile(r"^[\u4e00-\u9fff\w\-]+$", re.ASCII)


def validate_bvid(bvid):
    return bool(BVID_REGEX.match(bvid))


def validate_date(date_str):
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def validate_filename(filepath):
    """Level 5 – filename checks. Returns error strings (empty = valid)."""
    errors = []
    name = os.path.basename(filepath)

    if not name.endswith(".yaml"):
        errors.append("扩展名必须为 .yaml，不能使用 .yml")
        return errors

    stem = name.removesuffix(".yaml")
    if not stem:
        errors.append("文件名不能为空")
    elif not FILENAME_STEM_REGEX.match(stem):
        errors.append(
            "文件名只能包含中文字符、英文字母、数字、下划线和连字符"
        )
    return errors


# ---------------------------------------------------------------------------
# Git helper functions
# ---------------------------------------------------------------------------

def get_changed_files():
    """git diff --name-only origin/main...HEAD -- memes/ → list of existing files."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "origin/main...HEAD", "--", MEMES_DIR + "/"],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"Error detecting changed files: {e}", file=sys.stderr)
        sys.exit(1)

    files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    return [f for f in files if os.path.exists(f)]


def get_old_file_content(filepath):
    try:
        result = subprocess.run(
            ["git", "show", f"origin/main:{filepath}"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout
    except subprocess.CalledProcessError:
        return None


def get_computed_json():
    try:
        result = subprocess.run(
            ["git", "show", f"origin/main:{COMPUTED_PATH}"],
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return None


# ---------------------------------------------------------------------------
# Validation functions — each returns a list of (filepath, check, message)
# ---------------------------------------------------------------------------

def validate_yaml_syntax(filepath):
    errors = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except UnicodeDecodeError:
        errors.append((filepath, "文件编码", "文件编码必须为 UTF-8"))
        return errors, None
    except yaml.YAMLError as e:
        if hasattr(e, "problem_mark") and e.problem_mark is not None:
            line = e.problem_mark.line + 1
            errors.append(
                (filepath, "YAML 语法", f"第 {line} 行: {e.problem}")
            )
        else:
            errors.append((filepath, "YAML 语法", str(e)))
        return errors, None

    if data is None:
        errors.append((filepath, "YAML 语法", "文件为空或解析结果为空"))
        return errors, None

    if not isinstance(data, dict):
        errors.append(
            (filepath, "YAML 语法", "根节点必须是字典（mapping），不能是列表或标量")
        )
        return errors, None

    return errors, data


def validate_required_fields(filepath, data):
    """Level 2 – required fields. Returns (filepath, check, message) tuples."""
    errors = []

    # --- top-level fields ---
    if not isinstance(data.get("name"), str) or not data["name"].strip():
        errors.append((filepath, "必填字段", "缺少 name 字段或为空"))

    if "origin_video" not in data:
        errors.append((filepath, "必填字段", "缺少 origin_video 字段"))
    elif not isinstance(data["origin_video"], str):
        errors.append((filepath, "必填字段", "origin_video 必须为字符串或空字符串"))

    if not isinstance(data.get("description"), str) or not data["description"].strip():
        errors.append((filepath, "必填字段", "缺少 description 字段或为空"))

    if "videos" not in data:
        errors.append((filepath, "必填字段", "缺少 videos 字段"))
        return errors

    videos = data.get("videos", [])
    if not isinstance(videos, list):
        errors.append((filepath, "必填字段", "videos 必须是一个列表"))
        return errors

    # --- per-video fields ---
    for idx, video in enumerate(videos):
        if not isinstance(video, dict):
            errors.append(
                (filepath, "必填字段", f"videos[{idx}] 不是一个字典对象")
            )
            continue

        if not isinstance(video.get("bvid"), str) or not video["bvid"].strip():
            errors.append(
                (filepath, "必填字段", f"videos[{idx}]: 缺少 bvid 或为空")
            )
        if not isinstance(video.get("title"), str) or not video["title"].strip():
            errors.append(
                (filepath, "必填字段", f"videos[{idx}]: 缺少 title 或为空")
            )
        if not isinstance(video.get("contributor"), str) or not video["contributor"].strip():
            errors.append(
                (filepath, "必填字段", f"videos[{idx}]: 缺少 contributor 或为空")
            )

    return errors


def validate_field_formats(filepath, data):
    """Level 3 – bvid regex, origin_date YYYY-MM-DD, origin_video URL, name matches filename."""
    errors = []

    # bvid format
    videos = data.get("videos", [])
    if isinstance(videos, list):
        for idx, video in enumerate(videos):
            if not isinstance(video, dict):
                continue
            bvid = video.get("bvid", "")
            if isinstance(bvid, str) and bvid.strip() and not validate_bvid(bvid):
                errors.append(
                    (
                        filepath,
                        "bvid 格式",
                        f'videos[{idx}]: "{bvid}" 格式错误'
                        f"，应为 BV 开头 + 10 位字母数字（共 12 位）",
                    )
                )

    # origin_date format
    od = data.get("origin_date")
    if isinstance(od, str) and od.strip():
        if not validate_date(od):
            errors.append(
                (
                    filepath,
                    "日期格式",
                    f'origin_date "{od}" 格式错误，应为 YYYY-MM-DD',
                )
            )

    # origin_video URL format
    ov = data.get("origin_video")
    if isinstance(ov, str) and ov.strip():
        if not ov.startswith("https://www.bilibili.com/video/BV"):
            errors.append(
                (
                    filepath,
                    "链接格式",
                    "origin_video 必须以 https://www.bilibili.com/video/BV 开头",
                )
            )

    # name matches filename stem
    name_val = data.get("name")
    if isinstance(name_val, str) and name_val.strip():
        expected = os.path.splitext(os.path.basename(filepath))[0]
        if name_val != expected:
            errors.append(
                (
                    filepath,
                    "名称一致",
                    f'name 字段 "{name_val}" 与文件名 "{expected}" 不一致',
                )
            )

    return errors


def validate_bvid_dedup(filepath, data):
    """Level 4 – no duplicate bvid within one file."""
    errors = []
    videos = data.get("videos", [])
    if not isinstance(videos, list):
        return errors

    seen: set[str] = set()
    for idx, video in enumerate(videos):
        if not isinstance(video, dict):
            continue
        bvid = video.get("bvid", "")
        if isinstance(bvid, str) and (bvid := bvid.strip()):
            if bvid in seen:
                errors.append(
                    (
                        filepath,
                        "bvid 重复",
                        f'videos[{idx}]: bvid "{bvid}" 在文件中重复出现',
                    )
                )
            seen.add(bvid)

    return errors


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_failure_report(all_errors):
    """Write validation-report.md with error table and fix suggestions."""
    lines = [
        "## ❌ 梗数据校验失败",
        "",
        "### 错误详情",
        "| 文件 | 检查项 | 错误信息 |",
        "|------|--------|----------|",
    ]

    for filepath, check, msg in all_errors:
        lines.append(f"| {filepath} | {check} | {msg} |")

    lines.append("")
    lines.append("### 修复建议")

    for filepath, check, msg in all_errors:
        # Craft a short, actionable suggestion from the error context
        if check == "必填字段":
            if "缺少" in msg:
                # e.g. "缺少 name 字段或为空" → extract field name
                field = msg.replace("缺少 ", "").replace(" 字段或为空", "").replace(" 或为空", "").strip()
                lines.append(f"- {filepath}: 请添加 {field} 字段")
            else:
                lines.append(f"- {filepath}: {msg}")
        elif check == "bvid 格式":
            lines.append(f"- {filepath}: {msg}")
        elif check == "bvid 重复":
            lines.append(f"- {filepath}: 请移除重复的 bvid")
        elif check == "日期格式":
            lines.append(f"- {filepath}: 日期格式应为 YYYY-MM-DD")
        elif check == "链接格式":
            lines.append(f"- {filepath}: origin_video 应为完整的 Bilibili 视频链接（https://www.bilibili.com/video/BV...）")
        elif check == "名称一致":
            lines.append(f"- {filepath}: 请将 name 字段修改为与文件名一致")
        elif check in ("文件名", "文件编码"):
            lines.append(f"- {filepath}: {msg}")
        else:
            lines.append(f"- {filepath}: {msg}")

    lines.append("")

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def generate_success_report(changed_files, meme_tiers, contributor_tiers):

    computed = get_computed_json()

    # Lookups built from main-branch computed.json (if available)
    current_meme_submissions: dict[str, int] = {}
    current_contributor_counts: dict[str, int] = {}
    if computed:
        for m in computed.get("memes", []):
            current_meme_submissions[m["id"]] = m.get("submissions", 0)
        for c in computed.get("contributors", []):
            current_contributor_counts[c["github"]] = c.get("count", 0)

    meme_rows = []  # (name, old_sub, new_sub, old_tier, new_tier_display)
    contributor_changes: Counter[str] = Counter()

    for filepath in changed_files:
        with open(filepath, "r", encoding="utf-8") as f:
            new_data = yaml.safe_load(f)

        if not isinstance(new_data, dict):
            continue

        meme_name = new_data.get("name", "")
        new_submissions = len(new_data.get("videos", []))

        # Old state from computed.json
        old_submissions = current_meme_submissions.get(meme_name, 0)

        # Subtract old contributor counts (the version currently on main)
        old_content = get_old_file_content(filepath)
        if old_content:
            try:
                old_data = yaml.safe_load(old_content)
                if isinstance(old_data, dict):
                    old_videos = old_data.get("videos", [])
                    if isinstance(old_videos, list):
                        for v in old_videos:
                            if isinstance(v, dict):
                                c = v.get("contributor", "")
                                if isinstance(c, str) and (c := c.strip()):
                                    contributor_changes[c] -= 1
            except yaml.YAMLError:
                pass  # old file broken — skip contributor subtraction

        # Add new contributor counts
        new_videos = new_data.get("videos", [])
        if isinstance(new_videos, list):
            for v in new_videos:
                if isinstance(v, dict):
                    c = v.get("contributor", "")
                    if isinstance(c, str) and (c := c.strip()):
                        contributor_changes[c] += 1

        old_tier = lookup_tier(old_submissions, meme_tiers)
        new_tier = lookup_tier(new_submissions, meme_tiers)
        tier_arrow = ""
        if new_tier != old_tier:
            tier_arrow = "⬆️ " if new_submissions > old_submissions else "⬇️ "

        meme_rows.append(
            (meme_name, old_submissions, new_submissions, old_tier, f"{tier_arrow}{new_tier}")
        )

    # ---- Build markdown ----
    lines = ["## ✅ 梗数据校验通过", ""]

    # Meme impact table
    if meme_rows:
        lines.append("### 本次 PR 影响")
        lines.append(
            "| 梗名称 | 当前收录 | 变更后 | 当前等级 | 变更后等级 |"
        )
        lines.append(
            "|--------|---------|--------|---------|-----------|"
        )
        for name, old_sub, new_sub, old_tier, new_display in meme_rows:
            new_tier_name = lookup_tier(new_sub, meme_tiers)
            lines.append(
                f"| {name} | {old_sub} ({old_tier}) | {new_sub} ({new_tier_name}) "
                f"| {old_tier} | {new_display} |"
            )
        lines.append("")

    # Contributor impact table
    affected = [
        (c, delta)
        for c, delta in contributor_changes.items()
        if delta != 0
    ]
    if affected:
        lines.append("### 贡献者影响")
        lines.append(
            "| 贡献者 | 当前贡献数 | 变更后 | 当前称号 | 变更后称号 |"
        )
        lines.append(
            "|--------|-----------|--------|---------|-----------|"
        )
        for contributor, delta in sorted(affected):
            old_count = current_contributor_counts.get(contributor, 0)
            new_count = old_count + delta
            old_title = lookup_tier(old_count, contributor_tiers)
            new_title = lookup_tier(new_count, contributor_tiers)
            title_arrow = ""
            if new_title != old_title:
                title_arrow = "⬆️ " if new_count > old_count else "⬇️ "
            lines.append(
                f"| {contributor} | {old_count} ({old_title}) | "
                f"{new_count} ({new_title}) | {old_title} | {title_arrow}{new_title} |"
            )
        lines.append("")

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Validate meme YAML files in a PR"
    )
    parser.add_argument(
        "--tiers",
        default=TIERS_PATH,
        help=f"Path to tiers.yaml (default: {TIERS_PATH})",
    )
    args = parser.parse_args()

    # 1. Detect changed files
    changed_files = get_changed_files()
    if not changed_files:
        print("No meme files changed.")
        sys.exit(0)

    # 2. Load tier configuration
    meme_tiers, contributor_tiers = load_tiers(args.tiers)

    # 3. Run all 5 validation levels — collect EVERY error
    all_errors: list[tuple[str, str, str]] = []

    for filepath in changed_files:
        # Level 5 – filename (independent of content)
        for msg in validate_filename(filepath):
            all_errors.append((filepath, "文件名", msg))

        # Level 1 – YAML syntax
        yaml_errors, data = validate_yaml_syntax(filepath)
        all_errors.extend(yaml_errors)

        if data is None:
            continue  # can't check content-based rules

        # Level 2 – Required fields
        all_errors.extend(validate_required_fields(filepath, data))

        # Level 3 – Field formats
        all_errors.extend(validate_field_formats(filepath, data))

        # Level 4 – BVID dedup
        all_errors.extend(validate_bvid_dedup(filepath, data))

    # 4. Generate report
    if all_errors:
        generate_failure_report(all_errors)
        print(f"❌ Validation failed with {len(all_errors)} error(s)")
        sys.exit(1)
    else:
        generate_success_report(changed_files, meme_tiers, contributor_tiers)
        print("✅ All checks passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
