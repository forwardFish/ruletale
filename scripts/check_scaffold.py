from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PATHS = [
    REPO_ROOT / ".agents" / "project.yaml",
    REPO_ROOT / ".agents" / "commands.yaml",
    REPO_ROOT / "apps" / "api" / "src" / "main.py",
    REPO_ROOT / "apps" / "web" / "src" / "app" / "page.tsx",
    REPO_ROOT / "docs" / "contracts" / "api" / "game-api.md",
    REPO_ROOT / "tasks" / "story_status_registry.json",
    REPO_ROOT / "tasks" / "story_acceptance_reviews.json",
]


def main() -> None:
    missing = [str(path.relative_to(REPO_ROOT)) for path in REQUIRED_PATHS if not path.exists()]
    if missing:
        raise SystemExit(f"Missing scaffold paths: {missing}")

    registry = json.loads((REPO_ROOT / "tasks" / "story_status_registry.json").read_text(encoding="utf-8"))
    reviews = json.loads((REPO_ROOT / "tasks" / "story_acceptance_reviews.json").read_text(encoding="utf-8"))
    if "stories" not in registry or "reviews" not in reviews:
        raise SystemExit("Task registries are malformed.")

    print("Ruletale scaffold check passed.")


if __name__ == "__main__":
    main()

# Database Agent scaffold
