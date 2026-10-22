"""Read-only inventory and redacted secret checks; run with python3 -I -S.

This is a focused check, not a replacement for a full secret/malware scanner.
Never emits matching credential values, source lines, or log content.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "github-token": re.compile(rb"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b"),
    "aws-access-key": re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "provider-key": re.compile(rb"\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}|AIza[A-Za-z0-9_-]{35})\b"),
    "database-credential": re.compile(rb"postgres(?:ql)?://[^\s/:]+:[^\s/@]+@"),
    "npm-token": re.compile(rb"\bnpm_[A-Za-z0-9]{30,}\b"),
}
IOC = re.compile(rb"litellm|cook\.pth|remote_code_loader|sitecustomize\.py|1bbcb1443bc962e45", re.I)


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def matches(data, location):
    results = []
    for label, pattern in PATTERNS.items():
        for match in pattern.finditer(data):
            results.append({"kind": label, "location": location,
                            "line": data[:match.start()].count(b"\n") + 1})
    return results


result = {"head": git("rev-parse", "HEAD").decode().strip(),
          "working_tree": [], "history": [], "ioc_paths": [], "history_iocs": [],
          "locks": {}, "lifecycle": [], "unexpected_registries": []}
for filename in ("package-lock.json", "node_modules/.package-lock.json"):
    path = ROOT / filename
    if not path.exists():
        continue
    data = path.read_bytes()
    packages = json.loads(data)["packages"]
    result["locks"][filename] = {"sha256": hashlib.sha256(data).hexdigest(), "packages": len(packages)}
    for name, metadata in packages.items():
        if metadata.get("resolved") and not metadata["resolved"].startswith("https://registry.npmjs.org/"):
            result["unexpected_registries"].append({"lock": filename, "package": name})
        if metadata.get("hasInstallScript") and filename == "package-lock.json":
            installed = ROOT / name / "package.json"
            result["lifecycle"].append({"package": name, "version": metadata.get("version"),
                "scripts": json.loads(installed.read_bytes()).get("scripts", {}) if installed.exists() else "not installed"})

for directory, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "dist")]
    for filename in files:
        path = Path(directory) / filename
        if path.is_symlink() or path.stat().st_size > 10_000_000:
            continue
        relative = str(path.relative_to(ROOT))
        data = path.read_bytes()
        result["working_tree"].extend(matches(data, relative))
        if "output/security/" not in relative and "security-precheck.py" not in relative:
            if IOC.search(filename.encode()) or (path.suffix in (".json", ".toml", ".txt", ".yml", ".yaml", ".log", ".pth") and IOC.search(data)):
                result["ioc_paths"].append(relative)

seen = set()
for line in git("rev-list", "--objects", "--all").decode().splitlines():
    oid, _, name = line.partition(" ")
    if not name or oid in seen:
        continue
    seen.add(oid)
    kind = git("cat-file", "-t", oid).decode().strip()
    if kind != "blob" or int(git("cat-file", "-s", oid)) > 2_000_000:
        continue
    data = git("cat-file", "blob", oid)
    result["history"].extend(matches(data, oid[:12] + ":" + name))
    if ("lock" in name or name.endswith((".toml", ".txt", "Dockerfile"))) and IOC.search(data):
        result["history_iocs"].append({"blob": oid, "path": name})
result["historical_objects_checked"] = len(seen)
print(json.dumps(result, indent=2))
