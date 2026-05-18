#!/usr/bin/env python3
import argparse
import os
import re
import sys
from pathlib import Path

from validate_issue import EXPECTED_HEADINGS, load_issue_payload, parse_sections, strip_code_block

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MEMES_DIR = PROJECT_ROOT / "memes"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Materialize a meme intake issue into a repository file"
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
    parser.add_argument("--issue-number", type=int, default=0, help="Issue number override")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and print metadata without writing files",
    )
    return parser.parse_args()


def issue_number_from_event(event_path):
    if not event_path:
        return 0
    path = Path(event_path)
    if not path.exists():
        return 0
    import json

    event = json.loads(path.read_text(encoding="utf-8"))
    issue = event.get("issue") or {}
    return int(issue.get("number") or 0)


def get_fields(body):
    sections = parse_sections(body)
    return {
        key: sections.get(heading, "").strip()
        for heading, key in EXPECTED_HEADINGS.items()
    }


def normalize_submission_type(value):
    return (value or "").strip()


def branch_name(issue_number):
    return f"issue-intake/{issue_number}"


def slug_text(value):
    text = (value or "").strip().lower()
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"[^0-9a-zA-Z\u4e00-\u9fff_-]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "meme"


def commit_message(submission_type, meme_name, issue_number):
    if submission_type == "新增梗条目":
        prefix = "add"
    elif submission_type == "为已有梗添加视频收录":
        prefix = "update"
    else:
        prefix = "fix"
    return f"{prefix}: {meme_name} (from issue #{issue_number})"


def pr_title(submission_type, meme_name, issue_number):
    if submission_type == "新增梗条目":
        prefix = "add"
        detail = meme_name
    elif submission_type == "为已有梗添加视频收录":
        prefix = "update"
        detail = f"{meme_name} - 添加视频"
    else:
        prefix = "fix"
        detail = meme_name
    return f"{prefix}: {detail} (issue #{issue_number})"


def output_kv(name, value):
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"{name}={value}\n")
    else:
        print(f"{name}={value}")


def main():
    try:
        _main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


def _main():
    args = parse_args()
    title, body = load_issue_payload(args)
    issue_number = args.issue_number or issue_number_from_event(args.event_path)
    if issue_number <= 0:
        raise ValueError("issue number is required")

    fields = get_fields(body)
    submission_type = normalize_submission_type(fields.get("submission_type"))
    meme_name = fields.get("meme_name", "").strip()
    target_filename = fields.get("target_filename", "").strip()
    yaml_payload = strip_code_block(fields.get("yaml_payload", ""))

    if not target_filename:
        raise ValueError("target filename is missing")
    if not yaml_payload:
        raise ValueError("YAML payload is missing")

    target_path = MEMES_DIR / target_filename
    branch = branch_name(issue_number)
    commit = commit_message(submission_type, meme_name, issue_number)
    pr = pr_title(submission_type, meme_name, issue_number)
    body_slug = slug_text(meme_name)

    if not args.dry_run:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(yaml_payload.rstrip() + "\n", encoding="utf-8")

    output_kv("issue_title", title)
    output_kv("issue_number", str(issue_number))
    output_kv("submission_type", submission_type)
    output_kv("meme_name", meme_name)
    output_kv("target_filename", target_filename)
    output_kv("target_path", str(target_path.relative_to(PROJECT_ROOT)).replace("\\", "/"))
    output_kv("branch_name", branch)
    output_kv("branch_slug", body_slug)
    output_kv("commit_message", commit)
    output_kv("pr_title", pr)


if __name__ == "__main__":
    main()
