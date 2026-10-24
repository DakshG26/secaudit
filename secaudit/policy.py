"""
policy.py — Access-control policy loader and access matrix builder.

Loads policy.yml, which declares what authentication level each route requires.
Compares the policy to the endpoint inventory and produces an access matrix
showing violations, weaker-than-required access, and uncovered routes.
"""

from __future__ import annotations

import fnmatch
from pathlib import Path
from typing import List, Optional, Tuple

import yaml

from secaudit.models import AccessMatrixRow, Endpoint, PolicyRule

# ---------------------------------------------------------------------------
# Policy loading
# ---------------------------------------------------------------------------

def load_policy(policy_path: str) -> List[PolicyRule]:
    """
    Load an access-control policy from a YAML file.

    The YAML must have a top-level "routes" key with a list of entries,
    each having "path" and "requires" fields.

    Parameters
    ----------
    policy_path : str
        Path to the policy.yml file.

    Returns
    -------
    List[PolicyRule]
        Parsed policy rules ordered as in the file.
    """
    try:
        data = yaml.safe_load(Path(policy_path).read_text(encoding="utf-8"))
    except (yaml.YAMLError, OSError) as exc:
        raise ValueError(f"Cannot load policy file {policy_path}: {exc}") from exc

    rules = []
    for entry in data.get("routes", []):
        if "path" in entry and "requires" in entry:
            rules.append(PolicyRule(path=entry["path"], requires=entry["requires"]))
    return rules


# ---------------------------------------------------------------------------
# Path matching
# ---------------------------------------------------------------------------

def _match_policy(path: str, rules: List[PolicyRule]) -> Optional[PolicyRule]:
    """
    Find the most specific policy rule that matches a given path.

    Uses fnmatch glob matching so "/admin/*" matches "/admin/users".
    Returns None if no policy rule covers the path.
    """
    matched: Optional[PolicyRule] = None
    best_len = -1
    for rule in rules:
        # Convert Flask-style <param> to fnmatch wildcard
        pat = rule.path.replace("<id>", "*").replace("<int:id>", "*")
        pat = __import__("re").sub(r"<\w+:\w+>", "*", pat)
        pat = __import__("re").sub(r"<\w+>", "*", pat)
        if fnmatch.fnmatch(path, pat):
            if len(rule.path) > best_len:
                best_len = len(rule.path)
                matched = rule
    return matched


# ---------------------------------------------------------------------------
# Access matrix builder
# ---------------------------------------------------------------------------

# Hierarchy of auth levels (higher index = stronger auth)
_AUTH_HIERARCHY = ["public", "authenticated", "owner", "admin"]


def _auth_strength(level: str) -> int:
    """Return the integer strength of an auth level (higher = stricter)."""
    try:
        return _AUTH_HIERARCHY.index(level.lower())
    except ValueError:
        return 1  # Default to "authenticated" for unknown levels


def _actual_level(endpoint: Endpoint) -> str:
    """Determine the actual auth level of an endpoint from its decorators."""
    if not endpoint.is_protected:
        return "none"
    decorators_lower = [d.lower() for d in endpoint.auth_decorators]
    if any("admin" in d for d in decorators_lower):
        return "admin"
    if any("owner" in d for d in decorators_lower):
        return "owner"
    return "authenticated"


def _compute_status(expected: str, actual: str) -> str:
    """
    Compare the expected and actual auth levels and return a status string.

    OK        — actual meets or exceeds expected
    VIOLATION — actual provides no protection (none) but something is required
    WEAKER    — actual is weaker than expected but not completely open
    UNCOVERED — no policy rule covers this route
    """
    if expected == "uncovered":
        return "UNCOVERED"
    if actual == "none" and expected != "public":
        return "VIOLATION"
    if expected == "public":
        return "OK"
    exp_strength = _auth_strength(expected)
    act_strength = _auth_strength(actual)
    if act_strength >= exp_strength:
        return "OK"
    return "WEAKER"


def build_access_matrix(
    endpoints: List[Endpoint],
    policy_rules: List[PolicyRule],
) -> List[AccessMatrixRow]:
    """
    Build the access matrix comparing endpoints to policy expectations.

    Parameters
    ----------
    endpoints    : Full endpoint inventory.
    policy_rules : Loaded policy rules from policy.yml.

    Returns
    -------
    List[AccessMatrixRow]
        One row per endpoint, sorted by path then method.
    """
    rows: List[AccessMatrixRow] = []
    for ep in sorted(endpoints, key=lambda e: (e.path, e.method)):
        matched_policy = _match_policy(ep.path, policy_rules)
        expected = matched_policy.requires if matched_policy else "uncovered"
        actual = _actual_level(ep)
        status = _compute_status(expected, actual)

        rows.append(
            AccessMatrixRow(
                method=",".join(ep.method),
                path=ep.path,
                expected=expected,
                actual=actual,
                auth_decorators=ep.auth_decorators,
                status=status,
            )
        )
    return rows


def print_access_matrix(rows: List[AccessMatrixRow]) -> None:
    """Print the access matrix as a formatted table to stdout."""
    STATUS_SYMBOLS = {
        "OK": "✅",
        "VIOLATION": "❌",
        "WEAKER": "⚠️ ",
        "UNCOVERED": "？",
    }

    print("\nAccess Control Matrix")
    print("=" * 80)
    print(f"{'Method':<10} {'Path':<30} {'Expected':<15} {'Actual':<15} {'Status'}")
    print("-" * 80)
    for row in rows:
        symbol = STATUS_SYMBOLS.get(row.status, row.status)
        print(f"{row.method:<10} {row.path:<30} {row.expected:<15} {row.actual:<15} {symbol} {row.status}")
    print("-" * 80)
    violations = sum(1 for r in rows if r.status == "VIOLATION")
    weaker = sum(1 for r in rows if r.status == "WEAKER")
    uncovered = sum(1 for r in rows if r.status == "UNCOVERED")
    print(f"Violations: {violations}  Weaker: {weaker}  Uncovered: {uncovered}  OK: {sum(1 for r in rows if r.status == 'OK')}")
