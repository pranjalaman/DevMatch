SKILL_ALIASES = {
    "js": "javascript",
    "py": "python",
    "reactjs": "react",
    "react.js": "react",
    "node": "nodejs",
    "node.js": "nodejs",
    "postgres": "postgresql",
    "ml": "machine-learning",
    "cpp": "c++",
    "ts": "typescript",
}


def canonicalize_skill(value: str, catalog: list[dict]) -> str | None:
    text = value.strip().casefold()
    if not text:
        return None
    text = SKILL_ALIASES.get(text, text)
    for row in catalog:
        if row["slug"].casefold() == text or row["label"].casefold() == text:
            return row["slug"]
    return None


def resolve_skill_list(values: list[str], catalog: list[dict]) -> tuple[list[str], list[str]]:
    resolved: list[str] = []
    unknown: list[str] = []
    for value in values:
        canonical = canonicalize_skill(value, catalog)
        if canonical is None:
            unknown.append(value.strip())
        elif canonical not in resolved:
            resolved.append(canonical)
    return resolved, unknown
