"""Audit tracked repository files against project hygiene rules.

The script is intentionally read-only. It checks files already tracked by Git
and exits with a non-zero status when forbidden paths or file types are found.
"""

from __future__ import annotations

import hashlib
import re
import subprocess
import sys
import tomllib
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Rule:
    name: str
    pattern: re.Pattern[str]
    description: str


@dataclass(frozen=True)
class Violation:
    path: str
    rule: Rule
    detail: str = ""


@dataclass(frozen=True)
class DependencySpec:
    name: str
    version: str


RULES = [
    Rule(
        name="legacy-top-level-directory",
        pattern=re.compile(r"^(Manage|Back|python|GasModelTest|img|chemical-park-monitor|algorithm_tests)/"),
        description="old top-level directory name",
    ),
    Rule(
        name="legacy-frontend-view-directory",
        pattern=re.compile(r"^frontend/src/views/(Car|YOLO|map_test)/"),
        description="old frontend view directory name",
    ),
    Rule(
        name="dependency-or-build-output",
        pattern=re.compile(r"(^|/)(node_modules|__pycache__|\.venv|target|dist|build)(/|$)"),
        description="dependency cache or build output",
    ),
    Rule(
        name="compiled-or-cache-file",
        pattern=re.compile(r"\.(pyc|pyo|class|log|tmp|temp|bak|swp)$", re.IGNORECASE),
        description="compiled, log, backup, or temporary file",
    ),
    Rule(
        name="model-or-generated-array",
        pattern=re.compile(r"\.(pt|pth|onnx|npy|npz)$", re.IGNORECASE),
        description="model weight or generated numerical array",
    ),
    Rule(
        name="frontend-source-large-media",
        pattern=re.compile(r"^frontend/(src|public)/.*\.(mp4|glb)$", re.IGNORECASE),
        description="large media or 3D asset inside frontend source or public tree",
    ),
    Rule(
        name="chatgpt-process-image",
        pattern=re.compile(r"(^|/).*ChatGPT(?:[ _-]+|%20)?Image.*\.(png|jpe?g|webp)$", re.IGNORECASE),
        description="chat-generated process image",
    ),
    Rule(
        name="environment-or-secret-file",
        pattern=re.compile(r"(^|/)(\.env|\.env\..*\.local|.*\.pem|.*\.key|.*\.p12)$", re.IGNORECASE),
        description="environment or secret-bearing file",
    ),
    Rule(
        name="stale-entrypoint-artifact",
        pattern=re.compile(r"(^|/)(apiServer\.py|gasDiffusionAstar\.py|.*\.spec|pnpm-lock\.yaml|vite\.svg)$"),
        description="stale generated or duplicate entrypoint artifact",
    ),
]

WINDOWS_LOCAL_PATH_ROOTS = ("Users", "Migrated_From_C", "BaiduNetdiskDownload", "apache-maven")
POSIX_LOCAL_PATH_ROOTS = ("Users", "home")
LOCAL_ABSOLUTE_PATH_PATTERN = re.compile(
    r"(?i)(?:[A-Z]:[\\/](?:"
    + "|".join(WINDOWS_LOCAL_PATH_ROOTS)
    + r")[^`'\"\s)]*|(?<![A-Za-z0-9_.-])/(?:"
    + "|".join(POSIX_LOCAL_PATH_ROOTS)
    + r")/[^`'\"\s)]+)"
)

CONTENT_RULES = [
    Rule(
        name="local-absolute-path",
        pattern=LOCAL_ABSOLUTE_PATH_PATTERN,
        description="local absolute path; use a relative path, env var, or source note that is not machine-bound",
    ),
]

IMAGE_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")
TEXT_SUFFIXES = (
    ".bat",
    ".css",
    ".html",
    ".java",
    ".js",
    ".json",
    ".md",
    ".properties",
    ".ps1",
    ".py",
    ".sh",
    ".sql",
    ".toml",
    ".ts",
    ".txt",
    ".vue",
    ".xml",
    ".yaml",
    ".yml",
)
DUPLICATE_ASSET_PREFIXES = ("assets/", "frontend/public/", "frontend/src/assets/")
MAX_TRACKED_IMAGE_BYTES = 2 * 1024 * 1024

REQUIRED_DOCKERIGNORE_PATTERNS = {
    ".dockerignore": ("*.mp4", "*.glb", "*.pt", "*.npy", "frontend/node_modules/"),
    "algorithm/.dockerignore": ("*.mp4", "*.glb", "*.pt", "*.npy", ".venv/", "__pycache__/"),
}

FORBIDDEN_DATASET_DOC_FRAGMENTS = {
    "docs/dataset-sources.md": {
        "algorithm/diffusion/test_calibration.py": "dataset source ledger references a non-existent validation script",
        "<原始文件本地路径>": "dataset provenance must not use placeholder local paths",
    },
    "datasets/samples/prairie_grass/README.md": {
        "<原始文件本地路径>": "Prairie Grass sample provenance must not use placeholder local paths",
    },
}

FORBIDDEN_DEPLOY_DOC_FRAGMENTS = {
    "deploy/nginx/default.conf": {
        "location /ws/": "nginx must not proxy an unimplemented WebSocket channel",
        "proxy_set_header Upgrade": "nginx must not advertise WebSocket upgrade without a backend contract",
        "connection_upgrade": "nginx must not keep WebSocket upgrade helpers without a backend contract",
    },
    "deploy/README.md": {
        "/ws/": "deployment docs must not document an unimplemented WebSocket channel",
    },
}

ALLOWED_TOP_LEVEL_DIRECTORIES = {
    ".github",
    "algorithm",
    "assets",
    "backend",
    "config",
    "datasets",
    "db",
    "deploy",
    "docker",
    "docs",
    "frontend",
    "logs",
    "models",
    "scripts",
    "tests",
    "tools",
    "twin",
    "uploads",
}

ALLOWED_TOP_LEVEL_FILES = {
    ".dockerignore",
    ".gitignore",
    "AGENTS.md",
    "README.md",
    "pyproject.toml",
    "start.bat",
    "shutdown.bat",
    "startup.bat",
    "uv.lock",
}


def tracked_files(repo_root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=repo_root,
        check=True,
        capture_output=True,
    )
    paths = result.stdout.decode("utf-8", errors="replace").split("\0")
    return [path.replace("\\", "/") for path in paths if path]


def is_image_file(path: str) -> bool:
    return path.lower().endswith(IMAGE_SUFFIXES)


def is_text_file(path: str) -> bool:
    return Path(path).suffix.lower() in TEXT_SUFFIXES


def is_duplicate_asset_candidate(path: str) -> bool:
    return path.startswith(DUPLICATE_ASSET_PREFIXES) and is_image_file(path)


def check_content_rules(repo_root: Path, path: str) -> list[Violation]:
    if not is_text_file(path):
        return []

    file_path = repo_root / path
    if not file_path.exists():
        return []

    text = file_path.read_text(encoding="utf-8", errors="replace")
    violations: list[Violation] = []
    for rule in CONTENT_RULES:
        for line_number, line in enumerate(text.splitlines(), start=1):
            if rule.pattern.search(line):
                violations.append(Violation(path, rule, detail=f"line {line_number}"))
                break
    return violations


def check_image_size(repo_root: Path, path: str) -> list[Violation]:
    if not is_image_file(path):
        return []

    file_path = repo_root / path
    if not file_path.exists():
        return []

    size = file_path.stat().st_size
    if size <= MAX_TRACKED_IMAGE_BYTES:
        return []

    max_mib = MAX_TRACKED_IMAGE_BYTES / (1024 * 1024)
    actual_mib = size / (1024 * 1024)
    return [
        Violation(
            path,
            Rule(
                name="large-tracked-image",
                pattern=re.compile(""),
                description=f"tracked raster image exceeds {max_mib:.1f} MiB",
            ),
            detail=f"{actual_mib:.1f} MiB",
        )
    ]


def check_duplicate_assets(repo_root: Path, paths: list[str]) -> list[Violation]:
    groups: defaultdict[tuple[int, str], list[str]] = defaultdict(list)
    for path in paths:
        if not is_duplicate_asset_candidate(path):
            continue
        file_path = repo_root / path
        if not file_path.exists():
            continue
        digest = hashlib.sha256(file_path.read_bytes()).hexdigest()
        groups[(file_path.stat().st_size, digest)].append(path)

    duplicate_rule = Rule(
        name="duplicate-tracked-asset",
        pattern=re.compile(""),
        description="same image bytes are tracked in more than one asset location",
    )
    violations: list[Violation] = []
    for duplicate_paths in groups.values():
        if len(duplicate_paths) < 2:
            continue
        sorted_paths = sorted(duplicate_paths)
        for path in sorted_paths:
            others = ", ".join(item for item in sorted_paths if item != path)
            violations.append(Violation(path, duplicate_rule, detail=f"duplicate of {others}"))
    return violations


def normalize_package_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def parse_dependency_spec(raw: str) -> DependencySpec | None:
    line = raw.split("#", 1)[0].strip()
    if not line or line.startswith(("-r", "--", "-e")):
        return None

    match = re.match(
        r"^\s*([A-Za-z0-9_.-]+)(?:\[[^\]]+\])?\s*(?:==|>=|~=|<=|>|<)?\s*([^;,\s]+)?",
        line,
    )
    if not match:
        return None

    return DependencySpec(
        name=normalize_package_name(match.group(1)),
        version=match.group(2) or "",
    )


def read_requirement_specs(path: Path) -> dict[str, DependencySpec]:
    specs: dict[str, DependencySpec] = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        spec = parse_dependency_spec(line)
        if spec:
            specs[spec.name] = spec
    return specs


def is_uv_exported_requirements(text: str) -> bool:
    lines = text.splitlines()[:3]
    return any("autogenerated by uv" in line for line in lines) and any(
        "uv export" in line and "--frozen" in line for line in lines
    )


def check_python_dependency_sync(repo_root: Path) -> list[Violation]:
    pyproject_path = repo_root / "pyproject.toml"
    requirements_path = repo_root / "algorithm" / "requirements.txt"
    rule = Rule(
        name="python-dependency-drift",
        pattern=re.compile(""),
        description="algorithm/requirements.txt must be a uv export from pyproject.toml and uv.lock",
    )
    if not pyproject_path.exists() or not requirements_path.exists():
        return [
            Violation(
                "pyproject.toml",
                rule,
                detail="missing pyproject.toml or algorithm/requirements.txt",
            )
        ]

    pyproject = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    requirements_text = requirements_path.read_text(encoding="utf-8", errors="replace")
    pyproject_specs: dict[str, DependencySpec] = {}
    for dependency in pyproject.get("project", {}).get("dependencies", []):
        spec = parse_dependency_spec(dependency)
        if spec:
            pyproject_specs[spec.name] = spec

    requirements_specs = read_requirement_specs(requirements_path)
    missing_from_requirements = sorted(pyproject_specs.keys() - requirements_specs.keys())
    violations: list[Violation] = []
    if not is_uv_exported_requirements(requirements_text):
        violations.append(
            Violation(
                "algorithm/requirements.txt",
                rule,
                detail="missing uv export --frozen header",
            )
        )

    if missing_from_requirements:
        violations.append(
            Violation(
                "algorithm/requirements.txt",
                rule,
                detail="export missing direct dependency " + ", ".join(missing_from_requirements),
            )
        )

    yolo_extra = pyproject.get("project", {}).get("optional-dependencies", {}).get("yolo", [])
    yolo_specs = {spec.name for raw in yolo_extra if (spec := parse_dependency_spec(raw))}
    default_heavy_specs = sorted(yolo_specs & set(pyproject_specs))
    if default_heavy_specs:
        violations.append(
            Violation(
                "pyproject.toml",
                rule,
                detail="YOLO-only dependencies are in default dependencies: "
                + ", ".join(default_heavy_specs),
            )
        )

    heavy_exported = sorted(yolo_specs & set(requirements_specs))
    if heavy_exported:
        violations.append(
            Violation(
                "algorithm/requirements.txt",
                rule,
                detail="default Docker export includes YOLO-only dependencies: "
                + ", ".join(heavy_exported),
            )
        )
    return violations


def check_dockerignore_contract(repo_root: Path) -> list[Violation]:
    rule = Rule(
        name="dockerignore-contract",
        pattern=re.compile(""),
        description="Docker build contexts must have effective .dockerignore coverage",
    )
    violations: list[Violation] = []
    for relative_path, required_patterns in REQUIRED_DOCKERIGNORE_PATTERNS.items():
        file_path = repo_root / relative_path
        if not file_path.exists():
            violations.append(Violation(relative_path, rule, detail="missing file"))
            continue
        lines = {
            line.strip()
            for line in file_path.read_text(encoding="utf-8", errors="replace").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        }
        missing_patterns = [pattern for pattern in required_patterns if pattern not in lines]
        if missing_patterns:
            violations.append(
                Violation(
                    relative_path,
                    rule,
                    detail="missing " + ", ".join(missing_patterns),
                )
            )
    return violations


def check_dataset_source_docs(repo_root: Path) -> list[Violation]:
    rule = Rule(
        name="dataset-source-doc-drift",
        pattern=re.compile(""),
        description="dataset provenance docs must not reference missing scripts or placeholder source paths",
    )
    violations: list[Violation] = []
    for relative_path, forbidden_fragments in FORBIDDEN_DATASET_DOC_FRAGMENTS.items():
        file_path = repo_root / relative_path
        if not file_path.exists():
            violations.append(Violation(relative_path, rule, detail="missing file"))
            continue
        text = file_path.read_text(encoding="utf-8", errors="replace")
        for fragment, detail in forbidden_fragments.items():
            if fragment in text:
                violations.append(Violation(relative_path, rule, detail=detail))
    return violations


def check_deploy_contract_docs(repo_root: Path) -> list[Violation]:
    rule = Rule(
        name="deploy-contract-drift",
        pattern=re.compile(""),
        description="deployment config and docs must not advertise unimplemented runtime channels",
    )
    violations: list[Violation] = []
    for relative_path, forbidden_fragments in FORBIDDEN_DEPLOY_DOC_FRAGMENTS.items():
        file_path = repo_root / relative_path
        if not file_path.exists():
            continue
        text = file_path.read_text(encoding="utf-8", errors="replace")
        for fragment, detail in forbidden_fragments.items():
            if fragment in text:
                violations.append(Violation(relative_path, rule, detail=detail))
    return violations


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    violations: list[Violation] = []

    paths = tracked_files(repo_root)
    for path in paths:
        top_level = path.split("/", 1)[0]
        if "/" not in path and top_level not in ALLOWED_TOP_LEVEL_FILES:
            violations.append(
                Violation(
                    path,
                    Rule(
                        name="unexpected-top-level-file",
                        pattern=re.compile(""),
                        description="file is not allowed at repository root",
                    ),
                )
            )
        if "/" in path and top_level not in ALLOWED_TOP_LEVEL_DIRECTORIES:
            violations.append(
                Violation(
                    path,
                    Rule(
                        name="unexpected-top-level-directory",
                        pattern=re.compile(""),
                        description="directory is not listed in the root folder standard",
                    ),
                )
            )
        for rule in RULES:
            if rule.pattern.search(path):
                violations.append(Violation(path, rule))
        violations.extend(check_content_rules(repo_root, path))
        violations.extend(check_image_size(repo_root, path))

    violations.extend(check_duplicate_assets(repo_root, paths))
    violations.extend(check_python_dependency_sync(repo_root))
    violations.extend(check_dockerignore_contract(repo_root))
    violations.extend(check_dataset_source_docs(repo_root))
    violations.extend(check_deploy_contract_docs(repo_root))

    if not violations:
        print("Repository tracked-file audit passed.")
        return 0

    print("Repository tracked-file audit failed:")
    for violation in violations:
        detail = f"; {violation.detail}" if violation.detail else ""
        print(f"- [{violation.rule.name}] {violation.path} ({violation.rule.description}{detail})")
    return 1


if __name__ == "__main__":
    sys.exit(main())
