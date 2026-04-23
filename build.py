#!/usr/bin/env python3
"""Scan projects/*.json and regenerate projects.json.

Each project is a single JSON file in projects/ whose filename (without .json)
is the slug. The teaser image lives at assets/<slug>.jpg.

Files starting with `_` are ignored (template).

Every field in the schema is required. Projects with `state: "taken"` are
validated like the rest but excluded from the public manifest.

Exits non-zero with a clear per-file report if anything is missing or invalid.
When running in GitHub Actions, also emits ::error:: annotations.
"""
import json
import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
PROJECTS_DIR = ROOT / "projects"
ASSETS_DIR = ROOT / "assets"
VALID_STATES = ("open", "taken")
TARGET_RATIO = 16 / 9
RATIO_TOLERANCE = 0.01
TEMPLATE_IMAGE = ASSETS_DIR / "_template.jpg"
IN_GITHUB_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"


def report(file: Path, message: str) -> None:
    rel = file.relative_to(ROOT)
    print(f"  - {rel}: {message}", file=sys.stderr)
    if IN_GITHUB_ACTIONS:
        print(f"::error file={rel}::{message}")


def is_link(obj) -> bool:
    return isinstance(obj, dict) and isinstance(obj.get("label"), str) and isinstance(obj.get("href"), str) and obj["label"] and obj["href"]


def is_supervisor(obj) -> bool:
    return isinstance(obj, dict) and isinstance(obj.get("name"), str) and isinstance(obj.get("href"), str) and obj["name"] and obj["href"]


def is_nonempty_str_list(v) -> bool:
    return isinstance(v, list) and len(v) > 0 and all(isinstance(x, str) and x for x in v)


def is_nonempty_link_list(v) -> bool:
    return isinstance(v, list) and len(v) > 0 and all(is_link(x) for x in v)


def validate(meta: dict, json_path: Path) -> int:
    """Return the number of validation errors found in meta."""
    errors = 0

    def err(msg: str) -> None:
        nonlocal errors
        report(json_path, msg)
        errors += 1

    # Scalar strings.
    for field in ("title", "email", "teaser", "abstract"):
        if not isinstance(meta.get(field), str) or not meta[field]:
            err(f"missing or empty string field '{field}'")

    # Supervisor object.
    if not is_supervisor(meta.get("supervisor")):
        err("field 'supervisor' must be { \"name\": str, \"href\": str }")

    # String-list fields.
    for field in ("milestones", "tags", "type"):
        if not is_nonempty_str_list(meta.get(field)):
            err(f"field '{field}' must be a non-empty list of strings")

    # Link-list fields.
    for field in ("prerequisites", "references"):
        if not is_nonempty_link_list(meta.get(field)):
            err(f"field '{field}' must be a non-empty list of {{ label, href }} objects")

    # State enum.
    if meta.get("state") not in VALID_STATES:
        err(f"field 'state' must be one of {VALID_STATES}")

    return errors


def find_image(slug: str) -> Path | None:
    candidate = ASSETS_DIR / f"{slug}.jpg"
    return candidate if candidate.exists() else None


def ratio_ok(width: int, height: int) -> bool:
    return abs(width / height - TARGET_RATIO) <= RATIO_TOLERANCE


def pad_to_ratio(path: Path) -> None:
    """Rewrite path as 16:9 with white padding if it isn't already."""
    with Image.open(path) as im:
        w, h = im.size
        if ratio_ok(w, h):
            return
        rgb = im.convert("RGB")
    if w / h > TARGET_RATIO:
        new_w, new_h = w, round(w / TARGET_RATIO)
    else:
        new_w, new_h = round(h * TARGET_RATIO), h
    canvas = Image.new("RGB", (new_w, new_h), (255, 255, 255))
    canvas.paste(rgb, ((new_w - w) // 2, (new_h - h) // 2))
    canvas.save(path, "JPEG", quality=95)


manifest = []
error_count = 0

if TEMPLATE_IMAGE.exists():
    pad_to_ratio(TEMPLATE_IMAGE)

for json_path in sorted(PROJECTS_DIR.glob("*.json")):
    slug = json_path.stem
    if slug.startswith("_"):
        continue

    try:
        meta = json.loads(json_path.read_text())
    except json.JSONDecodeError as e:
        report(json_path, f"invalid JSON ({e.msg} at line {e.lineno})")
        error_count += 1
        continue

    error_count += validate(meta, json_path)

    image = find_image(slug)
    if image is None:
        report(
            json_path,
            f"no teaser image found at assets/{slug}.jpg",
        )
        error_count += 1
    else:
        with Image.open(image) as im:
            w, h = im.size
        if not ratio_ok(w, h):
            report(image, f"teaser must be 16:9 (found {w}x{h}, ratio {w / h:.3f})")
            error_count += 1

    if meta.get("state") == "taken":
        continue

    meta["slug"] = slug
    meta["path"] = f"project.html?slug={slug}"
    if image is not None:
        meta["image"] = f"assets/{image.name}"
    manifest.append(meta)

if error_count:
    print(
        f"\nValidation failed: {error_count} problem(s).\n"
        "Each project needs a complete projects/<slug>.json and a matching\n"
        "assets/<slug>.jpg teaser image.",
        file=sys.stderr,
    )
    sys.exit(1)

(ROOT / "projects.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"wrote projects.json with {len(manifest)} open project(s)")
