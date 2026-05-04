"""Shared tier-lookup logic used by both compute.py and validate.py."""

import sys
from pathlib import Path

import yaml


def load_tiers(path):
    """Parse tiers.yaml. Returns (meme_tiers, contributor_tiers). Exits on error."""
    p = Path(path)
    if not p.exists():
        print(f"ERROR: tiers.yaml not found at {p}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(p, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"ERROR: Failed to parse tiers.yaml: {e}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, dict):
        print("ERROR: tiers.yaml must be a mapping at the top level", file=sys.stderr)
        sys.exit(1)

    meme_tiers = data.get("meme_tiers")
    contributor_tiers = data.get("contributor_tiers")

    if not isinstance(meme_tiers, list) or len(meme_tiers) == 0:
        print("ERROR: meme_tiers is missing or empty in tiers.yaml", file=sys.stderr)
        sys.exit(1)

    if not isinstance(contributor_tiers, list) or len(contributor_tiers) == 0:
        print("ERROR: contributor_tiers is missing or empty in tiers.yaml", file=sys.stderr)
        sys.exit(1)

    for i, tier in enumerate(meme_tiers):
        if "name" not in tier:
            print(f"ERROR: meme_tiers[{i}] missing 'name' key", file=sys.stderr)
            sys.exit(1)
    for i, tier in enumerate(contributor_tiers):
        if "name" not in tier:
            print(f"ERROR: contributor_tiers[{i}] missing 'name' key", file=sys.stderr)
            sys.exit(1)

    return meme_tiers, contributor_tiers


def lookup_tier(submissions, tiers):
    """Find the first tier where submissions falls within [min, max].

    Returns the tier name (string), or the *lowest* tier's name as fallback
    (which is also unreachable under correct configs).
    """
    if not tiers:
        return "unknown"

    for tier in tiers:
        tier_min = tier.get("min", 0)
        tier_max = tier.get("max")
        # Guard against explicit null: treat as no lower/upper bound.
        if tier_min is None:
            tier_min = 0
        if tier_max is None:
            tier_max = float("inf")
        if tier_min <= submissions <= tier_max:
            return tier["name"]

    # Fallback — should be unreachable with sensible tier configs.
    fallback_min = tiers[0].get("min", 0)
    if fallback_min is None:
        fallback_min = 0
    if submissions < fallback_min:
        return "unknown"
    return tiers[0]["name"]
