#!/usr/bin/env python3
import datetime
import json
import sys
from pathlib import Path

import yaml

from tiers import load_tiers, lookup_tier

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MEMES_DIR = PROJECT_ROOT / "memes"
DATA_DIR = PROJECT_ROOT / "_data"
TIERS_FILE = DATA_DIR / "tiers.yaml"
OUTPUT_FILE = DATA_DIR / "computed.json"
PAGES_OUTPUT = PROJECT_ROOT / "docs" / "_data" / "computed.json"
FULL_OUTPUT = DATA_DIR / "memes-full.json"
FULL_PAGES = PROJECT_ROOT / "docs" / "_data" / "memes-full.json"


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )


def load_json_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def reuse_generated_at_if_unchanged(path, output):
    existing = load_json_file(path)
    if not existing:
        return output

    existing_body = dict(existing)
    new_body = dict(output)
    existing_body.pop("generated_at", None)
    new_body.pop("generated_at", None)

    if existing_body == new_body and existing.get("generated_at"):
        output["generated_at"] = existing["generated_at"]
    return output


# Step 1: Load tiers (imported)

# Step 2: Iterate all memes

def parse_all_memes(memes_dir, meme_tiers):
    """Read memes/*.yaml. Returns list of {id, submissions, tier, hall_of_fame}."""
    yaml_files = sorted(memes_dir.glob("*.yaml"))
    if not yaml_files:
        print("WARNING: No .yaml files found in memes/ directory", file=sys.stderr)

    top_tier_name = meme_tiers[-1]["name"]
    memes = []

    for yf in yaml_files:
        try:
            with open(yf, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
        except (yaml.YAMLError, OSError, ValueError) as e:
            print(f"WARNING: Skipping {yf.name} — YAML parse error: {e}", file=sys.stderr)
            continue

        if not isinstance(data, dict):
            print(f"WARNING: Skipping {yf.name} — not a mapping", file=sys.stderr)
            continue

        meme_id = data.get("name", yf.stem)
        videos = data.get("videos")
        submissions = len(videos) if isinstance(videos, list) else 0
        tier_name = lookup_tier(submissions, meme_tiers)

        memes.append({
            "id": str(meme_id),
            "submissions": submissions,
            "tier": tier_name,
            "hall_of_fame": tier_name == top_tier_name,
        })

    return memes


# ============================================================================
# Step 3: Aggregate contributors
# ============================================================================

def aggregate_contributors(memes_dir):
    """Count contributor occurrences across all meme videos. Returns {username: count}."""
    yaml_files = sorted(memes_dir.glob("*.yaml"))
    counts = {}

    for yf in yaml_files:
        try:
            with open(yf, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
        except (yaml.YAMLError, OSError, ValueError):
            continue

        if not isinstance(data, dict):
            continue

        videos = data.get("videos")
        if not isinstance(videos, list):
            continue

        for video in videos:
            if isinstance(video, dict):
                contributor = video.get("contributor")
                if isinstance(contributor, str):
                    username = contributor.strip()
                    if username:
                        counts[username] = counts.get(username, 0) + 1

    return counts


# ============================================================================
# Step 4: Rankings
# ============================================================================

def compute_meme_rankings(memes):
    """Sort by submissions desc, tiebreak by id. Assign rank 1..N in-place."""
    memes.sort(key=lambda m: (-m["submissions"], m["id"]))
    for i, meme in enumerate(memes):
        meme["rank"] = i + 1
    return memes


def compute_contributor_rankings(counts, contributor_tiers):
    """Sort by count desc, tiebreak by github. Assign rank and calculated title."""
    contributors = [{"github": user, "count": cnt} for user, cnt in counts.items()]
    contributors.sort(key=lambda c: (-c["count"], c["github"]))
    for i, contributor in enumerate(contributors):
        contributor["rank"] = i + 1
        contributor["title"] = lookup_tier(contributor["count"], contributor_tiers)
    return contributors


# ============================================================================
# Step 5: Compute stats
# ============================================================================

def compute_stats(memes, contributors):
    return {
        "total_memes": len(memes),
        "total_videos": sum(m["submissions"] for m in memes),
        "total_contributors": len(contributors),
        "hall_of_fame_count": sum(1 for m in memes if m["hall_of_fame"]),
    }


# ============================================================================
# Step 6: Write computed.json
# ============================================================================

def write_output(memes, contributors, stats):
    """Serialize and write _data/computed.json + docs/_data/computed.json."""
    now = utc_now()

    output = {
        "generated_at": now,
        "memes": [
            {"id": m["id"], "submissions": m["submissions"],
             "tier": m["tier"], "hall_of_fame": m["hall_of_fame"],
             "rank": m["rank"]}
            for m in memes
        ],
        "contributors": [
            {"github": c["github"], "count": c["count"],
             "title": c["title"], "rank": c["rank"]}
            for c in contributors
        ],
        "stats": stats,
    }
    output = reuse_generated_at_if_unchanged(OUTPUT_FILE, output)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    payload = json.dumps(output, indent=2, ensure_ascii=False) + "\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(payload)

    with open(PAGES_OUTPUT, "w", encoding="utf-8") as f:
        f.write(payload)


def build_full_memes(memes_dir, memes):
    """Read raw YAML, merge with computed rankings. Returns list of full meme dicts."""
    lookup = {m["id"]: m for m in memes}
    yaml_files = sorted(memes_dir.glob("*.yaml"))
    full = []

    for yf in yaml_files:
        try:
            with open(yf, "r", encoding="utf-8") as f:
                raw = yaml.safe_load(f)
        except (yaml.YAMLError, OSError, ValueError):
            continue
        if not isinstance(raw, dict):
            continue

        meme_id = str(raw.get("name", yf.stem))
        computed = lookup.get(meme_id, {})

        full.append({
            "id": str(meme_id),
            "aliases": raw.get("aliases") if isinstance(raw.get("aliases"), list) else [],
            "origin_video": raw.get("origin_video", "") or "",
            "origin_date": raw.get("origin_date", "") or "",
            "description": raw.get("description", "") or "",
            "tags": raw.get("tags") if isinstance(raw.get("tags"), list) else [],
            "videos": raw.get("videos") if isinstance(raw.get("videos"), list) else [],
            "submissions": computed.get("submissions", 0),
            "tier": computed.get("tier", ""),
            "hall_of_fame": computed.get("hall_of_fame", False),
            "rank": computed.get("rank", 0),
        })

    return full


def write_full_output(full_memes):
    """Write _data/memes-full.json + docs/_data/memes-full.json."""
    now = utc_now()
    output = {
        "generated_at": now,
        "memes": full_memes,
    }
    output = reuse_generated_at_if_unchanged(FULL_OUTPUT, output)

    FULL_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    FULL_PAGES.parent.mkdir(parents=True, exist_ok=True)

    payload = json.dumps(output, indent=2, ensure_ascii=False) + "\n"

    with open(FULL_OUTPUT, "w", encoding="utf-8") as f:
        f.write(payload)

    with open(FULL_PAGES, "w", encoding="utf-8") as f:
        f.write(payload)


# ============================================================================
# Step 7: Print summary
# ============================================================================

def print_summary(stats):
    print("\u2705 computed.json generated successfully")
    print(f"   Memes: {stats['total_memes']}")
    print(f"   Videos: {stats['total_videos']}")
    print(f"   Contributors: {stats['total_contributors']}")
    print(f"   Hall of Fame: {stats['hall_of_fame_count']}")


# ============================================================================
# Main
# ============================================================================

def main():
    try:
        _main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

def _main():
    meme_tiers, contributor_tiers = load_tiers(TIERS_FILE)
    # NOTE: YAML files are parsed 3 times (meme list, contributor counts, full data).
    # Acceptable at current scale (< 100 memes); refactor to single-pass if the
    # dataset grows significantly.
    memes = parse_all_memes(MEMES_DIR, meme_tiers)
    contributor_counts = aggregate_contributors(MEMES_DIR)
    memes = compute_meme_rankings(memes)
    contributors = compute_contributor_rankings(contributor_counts, contributor_tiers)
    stats = compute_stats(memes, contributors)
    write_output(memes, contributors, stats)
    full_memes = build_full_memes(MEMES_DIR, memes)
    write_full_output(full_memes)
    print_summary(stats)


if __name__ == "__main__":
    main()
