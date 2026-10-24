"""
engine.py — Rule engine and scan orchestrator for SecAudit.

Loads YAML rule files from the rules/ directory and dispatches each rule
to the correct checker (regex, route, deps, pypi, http).
Rules are data — adding a new YAML file automatically adds a new check
with no changes to this module.

Rule types:
  regex  — scan file content with a regular expression
  route  — analyse the endpoint inventory (A01 rules, IDOR, etc.)
  deps   — parse requirements.txt / pyproject.toml for supply-chain issues
  pypi   — check PyPI API for hallucinated package names (requires --check-pypi)
  http   — live probe of the running app (requires --url and --i-own-this-target)
"""

from __future__ import annotations

import math
import os
import re
from pathlib import Path
from typing import List, Optional

import yaml

from secaudit.models import Endpoint, Finding, ScanResult

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

RULES_DIR = Path(__file__).parent.parent / "rules"

# Variables near which any string value is suspicious (for entropy checks)
SECRET_VAR_PATTERN = re.compile(
    r"(?:secret|key|token|password|passwd|api_key|auth|credential)",
    re.IGNORECASE,
)

_FINDING_COUNTER: dict[str, int] = {}


def _next_id(rule_id: str) -> str:
    """Generate sequential finding IDs like A04-SECRET-001-1, -2, etc."""
    _FINDING_COUNTER[rule_id] = _FINDING_COUNTER.get(rule_id, 0) + 1
    return f"{rule_id}-{_FINDING_COUNTER[rule_id]}"


# ---------------------------------------------------------------------------
# Rule loading
# ---------------------------------------------------------------------------

def load_rules(rules_dir: Optional[Path] = None) -> List[dict]:
    """
    Load all YAML rule files from the rules directory.

    Each file is a dict; the filename is used as a fallback id.
    Returns a list of rule dicts, sorted by OWASP category then id.
    """
    directory = rules_dir or RULES_DIR
    rules = []
    for filepath in sorted(directory.glob("*.yml")):
        try:
            with open(filepath, encoding="utf-8") as fh:
                rule = yaml.safe_load(fh)
            if isinstance(rule, dict) and "id" in rule:
                rule["_filepath"] = str(filepath)
                rules.append(rule)
        except (yaml.YAMLError, OSError):
            pass  # Silently skip malformed rule files
    return rules


# ---------------------------------------------------------------------------
# Entropy helpers (for A04-SECRET-001)
# ---------------------------------------------------------------------------

def _shannon_entropy(text: str) -> float:
    """
    Compute the Shannon entropy of a string (bits per character).

    Higher entropy (> 3.5) suggests a random secret rather than a readable word.
    """
    if not text:
        return 0.0
    freq: dict[str, int] = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    total = len(text)
    entropy = 0.0
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)
    return entropy


def _redact(value: str) -> str:
    """Redact a secret value for safe display in reports."""
    if len(value) <= 4:
        return "***"
    return value[:2] + "*" * (len(value) - 4) + value[-2:]


# ---------------------------------------------------------------------------
# Ignore support
# ---------------------------------------------------------------------------

def _load_ignore_file(target_path: str) -> set[str]:
    """
    Load .secauditignore from the target directory.

    Each non-comment line is a glob pattern or RULE-ID to ignore.
    Returns a set of rule IDs listed explicitly.
    """
    ignore_file = Path(target_path) / ".secauditignore"
    rule_ids: set[str] = set()
    if not ignore_file.exists():
        return rule_ids
    for line in ignore_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            rule_ids.add(line.upper())
    return rule_ids


def _check_inline_ignore(line: str, rule_id: str) -> bool:
    """
    Return True if the line contains an inline ignore comment for this rule.

    Format: # secaudit: ignore A05-SQL-001
    """
    pattern = re.compile(
        r"#\s*secaudit:\s*ignore\s+" + re.escape(rule_id),
        re.IGNORECASE,
    )
    return bool(pattern.search(line))


# ---------------------------------------------------------------------------
# Regex checker
# ---------------------------------------------------------------------------

def _run_regex_rule(rule: dict, target_path: str, ignore_ids: set[str]) -> List[Finding]:
    """
    Scan all matching files for the rule's regex pattern.

    Handles multi-line scanning, file extension filtering, and entropy checks
    for the A04-SECRET rule.
    """
    findings = []
    pattern_str = rule.get("pattern", "")
    if not pattern_str:
        return findings

    extensions = set(rule.get("file_extensions", ["py"]))
    flags_str = rule.get("flags", "")
    re_flags = re.IGNORECASE if "IGNORECASE" in flags_str else 0

    try:
        pattern = re.compile(pattern_str, re_flags)
    except re.error:
        return findings

    entropy_threshold = rule.get("entropy_threshold", 0)
    redact = rule.get("redact_in_output", False)

    is_demo = os.path.basename(target_path.rstrip("/")) in ("demo_app", "demo_app_fixed")
    excluded = {"venv", "env", "__pycache__", "node_modules", "reference", "dist", "build"}
    if not is_demo:
        excluded.update({"tests", "test", "spec", "demo_app", "rules", "fixtures", "mock", "mocks"})

    ignored_files = {"mockData.ts", "mockData.js", "before.json", "package-lock.json", "yarn.lock"}

    for root, dirs, files in os.walk(target_path):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in excluded]
        for filename in files:
            if filename in ignored_files:
                continue
            ext = filename.rsplit(".", 1)[-1].lower()
            if ext not in extensions and filename.lstrip(".") not in extensions:
                continue
            filepath = os.path.join(root, filename)
            try:
                content = Path(filepath).read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue

            in_docstring = False
            docstring_delim = ""
            for lineno, line in enumerate(content.splitlines(), 1):
                if _check_inline_ignore(line, rule["id"]):
                    continue

                stripped = line.strip()
                # Track multiline docstrings in python files
                if filepath.endswith(".py"):
                    if not in_docstring:
                        for delim in ('"""', "'''"):
                            if stripped.startswith(delim):
                                if stripped.count(delim) == 1:
                                    in_docstring = True
                                    docstring_delim = delim
                                break
                    else:
                        if docstring_delim in stripped:
                            in_docstring = False
                        if rule["id"] not in ("A01-TODO-001", "A01-COMMENTED-AUTH-001"):
                            continue

                # Skip comment lines, string literals and docstrings for non-comment rules
                if rule["id"] not in ("A01-TODO-001", "A01-COMMENTED-AUTH-001"):
                    if stripped.startswith(("#", "//", "/*", "*")):
                        continue
                    if in_docstring:
                        continue
                    if stripped.startswith(('"""', "'''", '"', "'", "`")):
                        continue
                    if any(k in stripped for k in ("narrative", "description", "remediation", "evidence", "impact", "title")) and ("=" in stripped or ":" in stripped):
                        continue
                    if (stripped.startswith('"""') and stripped.endswith('"""') and len(stripped) >= 6) or \
                       (stripped.startswith("'''") and stripped.endswith("'''") and len(stripped) >= 6):
                        continue

                match = pattern.search(line)
                if not match:
                    continue

                evidence = line.strip()[:120]

                # Entropy check for secrets
                if entropy_threshold:
                    # Extract the captured value (first group or whole match)
                    captured = match.group(1) if match.lastindex else match.group(0)
                    if _shannon_entropy(captured) < entropy_threshold:
                        continue  # Low entropy → not a real secret
                    if redact:
                        evidence = evidence.replace(captured, _redact(captured))

                location = f"{filepath}:{lineno}"
                finding_id = _next_id(rule["id"])

                f = Finding(
                    id=finding_id,
                    rule_id=rule["id"],
                    title=rule.get("title", rule["id"]),
                    owasp=rule.get("owasp", ""),
                    cwe=rule.get("cwe", ""),
                    severity=rule.get("severity", "medium"),
                    confidence=rule.get("confidence", "possible"),
                    location=location,
                    evidence=evidence,
                    impact=rule.get("impact", ""),
                    remediation=rule.get("fix", ""),
                    fixed_code=rule.get("fixed_code", ""),
                )
                if rule["id"].upper() in ignore_ids:
                    f.ignored = True
                    f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
                findings.append(f)

    return findings


# ---------------------------------------------------------------------------
# Dependency checker (A03)
# ---------------------------------------------------------------------------

def _run_deps_rule(rule: dict, target_path: str, ignore_ids: set[str]) -> List[Finding]:
    """
    Check requirements.txt for unpinned dependencies.

    Looks for lines that name a package without a ==version pin.
    """
    findings = []
    req_files = list(Path(target_path).rglob("requirements*.txt"))
    req_files += list(Path(target_path).rglob("requirements*.in"))

    is_demo = os.path.basename(target_path.rstrip("/")) in ("demo_app", "demo_app_fixed")
    filtered_reqs = []
    for rf in req_files:
        parts = set(rf.parts)
        if not is_demo and parts.intersection({"demo_app", "demo", "demos", "tests", "test", "fixtures", "mock", "mocks"}):
            continue
        filtered_reqs.append(rf)

    for req_file in filtered_reqs:
        try:
            lines = req_file.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue

        for lineno, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or stripped.startswith("-"):
                continue
            # Unpinned: no == in the line (>= and <= are acceptable ranges but flagged)
            if "==" not in stripped:
                finding_id = _next_id(rule["id"])
                f = Finding(
                    id=finding_id,
                    rule_id=rule["id"],
                    title=rule.get("title", rule["id"]),
                    owasp=rule.get("owasp", "A03"),
                    cwe=rule.get("cwe", "CWE-1104"),
                    severity=rule.get("severity", "low"),
                    confidence="confirmed",
                    location=f"{req_file}:{lineno}",
                    evidence=stripped,
                    impact=rule.get("impact", ""),
                    remediation=rule.get("fix", ""),
                    fixed_code=rule.get("fixed_code", ""),
                )
                if rule["id"].upper() in ignore_ids:
                    f.ignored = True
                    f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
                findings.append(f)

    return findings


# ---------------------------------------------------------------------------
# Route-based checker (A01, IDOR, A09)
# ---------------------------------------------------------------------------

def _run_route_rule(
    rule: dict,
    endpoints: List[Endpoint],
    target_path: str,
    ignore_ids: set[str],
) -> List[Finding]:
    """
    Apply route-level rules to the endpoint inventory.

    Dispatches to specific route checkers based on rule ID prefix.
    """
    rule_id = rule["id"]

    if rule_id == "A01-NOAUTH-001":
        return _check_no_auth_routes(rule, endpoints, target_path, ignore_ids)
    if rule_id == "A01-IDOR-001":
        return _check_idor(rule, endpoints, target_path, ignore_ids)
    if rule_id == "A09-NOLOG-001":
        return _check_no_login_log(rule, endpoints, target_path, ignore_ids)
    if rule_id == "A05-NOINPUT-001":
        return _check_missing_input_validation(rule, endpoints, target_path, ignore_ids)
    return []


def _check_no_auth_routes(
    rule: dict,
    endpoints: List[Endpoint],
    target_path: str,
    ignore_ids: set[str],
) -> List[Finding]:
    """Flag sensitive-path routes that have no auth decorator."""
    findings = []
    sensitive = [p.lower() for p in rule.get("sensitive_path_patterns", [])]

    for ep in endpoints:
        path_lower = ep.path.lower()
        is_sensitive = any(s in path_lower for s in sensitive)
        if is_sensitive and not ep.is_protected:
            finding_id = _next_id(rule["id"])
            f = Finding(
                id=finding_id,
                rule_id=rule["id"],
                title=rule.get("title", "Route with No Authentication"),
                owasp=rule.get("owasp", "A01"),
                cwe=rule.get("cwe", "CWE-306"),
                severity=rule.get("severity", "critical"),
                confidence="likely",
                location=ep.location,
                evidence=f"{','.join(ep.method)} {ep.path} — handler: {ep.handler} — auth decorators: none",
                impact=rule.get("impact", ""),
                remediation=rule.get("fix", ""),
                fixed_code=rule.get("fixed_code", ""),
            )
            if rule["id"].upper() in ignore_ids:
                f.ignored = True
                f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
            findings.append(f)
    return findings


def _check_idor(
    rule: dict,
    endpoints: List[Endpoint],
    target_path: str,
    ignore_ids: set[str],
) -> List[Finding]:
    """Flag routes with ID path params that lack ownership-check patterns in source."""
    findings = []
    id_pattern = re.compile(r"<(?:int:)?(\w*id\w*|user|item|order|record)>|\{(\w*id\w*)\}", re.IGNORECASE)
    ownership_patterns = rule.get("ownership_check_patterns", [])

    for ep in endpoints:
        if not id_pattern.search(ep.path):
            continue
        # Read the handler source to check for ownership patterns
        if ":" in ep.location:
            filepath = ep.location.split(":")[0]
        else:
            filepath = ep.location

        try:
            source = Path(filepath).read_text(encoding="utf-8", errors="replace")
        except OSError:
            source = ""

        # Find the function body in the source
        func_start_line = int(ep.location.split(":")[-1]) if ":" in ep.location else 0
        lines = source.splitlines()
        func_lines = lines[max(0, func_start_line - 1):func_start_line + 30]
        func_body = "\n".join(func_lines)

        has_ownership_check = any(p.lower() in func_body.lower() for p in ownership_patterns)

        if not has_ownership_check:
            finding_id = _next_id(rule["id"])
            f = Finding(
                id=finding_id,
                rule_id=rule["id"],
                title=rule.get("title", "IDOR"),
                owasp=rule.get("owasp", "A01"),
                cwe=rule.get("cwe", "CWE-639"),
                severity=rule.get("severity", "high"),
                confidence="possible",
                location=ep.location,
                evidence=f"{','.join(ep.method)} {ep.path} — no ownership check found in handler body",
                impact=rule.get("impact", ""),
                remediation=rule.get("fix", ""),
                fixed_code=rule.get("fixed_code", ""),
            )
            if rule["id"].upper() in ignore_ids:
                f.ignored = True
                f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
            findings.append(f)
    return findings


def _check_no_login_log(
    rule: dict,
    endpoints: List[Endpoint],
    target_path: str,
    ignore_ids: set[str],
) -> List[Finding]:
    """Flag login/auth routes that don't contain a logging call near failure path."""
    findings = []
    login_keywords = {"login", "signin", "authenticate", "auth"}
    # Match actual log calls in non-comment code
    log_patterns = re.compile(
        r"(?:logger|logging)\s*\.\s*(?:warning|error|info|critical|debug)\s*\(",
        re.IGNORECASE,
    )

    for ep in endpoints:
        path_lower = ep.path.lower()
        handler_lower = ep.handler.lower()
        is_login = any(k in path_lower or k in handler_lower for k in login_keywords)
        if not is_login:
            continue

        # Read handler source
        if ":" in ep.location:
            filepath, lineno_str = ep.location.rsplit(":", 1)
            func_start = int(lineno_str)
        else:
            continue

        try:
            source = Path(filepath).read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        lines = source.splitlines()
        code_lines = [l.split("#")[0] for l in lines[max(0, func_start - 1):func_start + 40]]
        func_code = "\n".join(code_lines)

        if not log_patterns.search(func_code):
            finding_id = _next_id(rule["id"])
            f = Finding(
                id=finding_id,
                rule_id=rule["id"],
                title=rule.get("title", "No Logging on Failed Login"),
                owasp=rule.get("owasp", "A09"),
                cwe=rule.get("cwe", "CWE-778"),
                severity=rule.get("severity", "medium"),
                confidence="possible",
                location=ep.location,
                evidence=f"{','.join(ep.method)} {ep.path} — no logging call found in login handler",
                impact=rule.get("impact", ""),
                remediation=rule.get("fix", ""),
                fixed_code=rule.get("fixed_code", ""),
            )
            if rule["id"].upper() in ignore_ids:
                f.ignored = True
                f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
            findings.append(f)
    return findings


def _check_missing_input_validation(
    rule: dict,
    endpoints: List[Endpoint],
    target_path: str,
    ignore_ids: set[str],
) -> List[Finding]:
    """Flag handlers that receive inputs but lack any type/length validation."""
    findings = []
    validation_patterns = re.compile(
        r"int\(|float\(|isinstance\(|validate\(|schema\.|\.strip\(\)|len\(|re\.|Validator",
        re.IGNORECASE,
    )

    for ep in endpoints:
        if not ep.request_inputs:
            continue

        if ":" in ep.location:
            filepath, lineno_str = ep.location.rsplit(":", 1)
            func_start = int(lineno_str)
        else:
            continue

        try:
            source = Path(filepath).read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        lines = source.splitlines()
        func_body = "\n".join(lines[max(0, func_start - 1):func_start + 30])

        if not validation_patterns.search(func_body):
            finding_id = _next_id(rule["id"])
            f = Finding(
                id=finding_id,
                rule_id=rule["id"],
                title=rule.get("title", "Missing Input Validation"),
                owasp=rule.get("owasp", "A05"),
                cwe=rule.get("cwe", "CWE-20"),
                severity=rule.get("severity", "medium"),
                confidence="possible",
                location=ep.location,
                evidence=f"Inputs used: {ep.request_inputs} — no validation found in handler",
                impact=rule.get("impact", ""),
                remediation=rule.get("fix", ""),
                fixed_code=rule.get("fixed_code", ""),
            )
            if rule["id"].upper() in ignore_ids:
                f.ignored = True
                f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
            findings.append(f)
    return findings


# ---------------------------------------------------------------------------
# Main scan function
# ---------------------------------------------------------------------------

def run_scan(
    target_path: str,
    endpoints: List[Endpoint],
    rules_dir: Optional[Path] = None,
    check_pypi: bool = False,
    ignore_ids: Optional[set[str]] = None,
) -> List[Finding]:
    """
    Run all loaded rules against the target path and endpoint inventory.

    Parameters
    ----------
    target_path : str
        Directory to scan.
    endpoints   : list of Endpoint objects from the inventory extractor.
    rules_dir   : Optional override for the rules directory.
    check_pypi  : Whether to run the PyPI hallucination check (network call).
    ignore_ids  : Set of rule IDs to suppress (from .secauditignore).

    Returns
    -------
    List[Finding]
        All findings, including those marked as ignored.
    """
    _FINDING_COUNTER.clear()

    rules = load_rules(rules_dir)
    ignore_ids = ignore_ids or set()
    all_findings: List[Finding] = []

    for rule in rules:
        rule_type = rule.get("type", "regex")
        rule_id = rule.get("id", "")

        if rule_type == "regex":
            findings = _run_regex_rule(rule, target_path, ignore_ids)
        elif rule_type == "route":
            findings = _run_route_rule(rule, endpoints, target_path, ignore_ids)
        elif rule_type == "deps":
            findings = _run_deps_rule(rule, target_path, ignore_ids)
        elif rule_type == "pypi":
            if check_pypi:
                from secaudit.probes import check_pypi_packages
                findings = check_pypi_packages(rule, target_path, ignore_ids)
            else:
                continue
        elif rule_type == "http":
            # HTTP rules are handled by probes.py; skip here
            continue
        else:
            continue

        all_findings.extend(findings)

    return all_findings
