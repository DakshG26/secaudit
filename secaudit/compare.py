"""
compare.py — Before/after scan comparison for SecAudit.

The `secaudit compare before.json after.json` command reads two JSON scan
reports and produces a diff-style summary showing:
  - Findings that have been fixed (present in before, absent in after)
  - Findings still open (present in both)
  - Newly introduced findings (present in after, absent in before)
  - Fix percentage
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple


def _load_report(path: str) -> dict:
    """
    Load a JSON scan report from disk.

    Parameters
    ----------
    path : str
        Path to the JSON report file.

    Returns
    -------
    dict
        The parsed report dictionary.
    """
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise ValueError(f"Cannot load report file {path}: {exc}") from exc


def _finding_key(finding: dict) -> str:
    """
    Create a stable key for deduplication across reports.

    Uses rule_id + normalised location (ignoring line numbers that may shift).
    """
    rule_id = finding.get("rule_id", "")
    location = finding.get("location", "")
    # Normalise: strip line numbers from location so minor code shifts don't
    # cause a "fixed + reintroduced" pair instead of "still open"
    if ":" in location:
        # "path/to/file.py:42" → "path/to/file.py"
        location = location.rsplit(":", 1)[0]
    return f"{rule_id}|{location}"


def compare_reports(before_path: str, after_path: str) -> dict:
    """
    Compare two JSON scan reports and return a structured diff.

    Parameters
    ----------
    before_path : Path to the "before" scan report (unpatched app).
    after_path  : Path to the "after" scan report (patched app).

    Returns
    -------
    dict with keys:
      fixed       : findings resolved between before and after
      still_open  : findings present in both reports
      new         : findings introduced in after that were not in before
      fix_percent : percentage of before findings that were fixed
      summary     : human-readable one-liner
    """
    before_report = _load_report(before_path)
    after_report = _load_report(after_path)

    before_findings = [f for f in before_report.get("findings", []) if not f.get("ignored")]
    after_findings = [f for f in after_report.get("findings", []) if not f.get("ignored")]

    before_keys: dict[str, dict] = {_finding_key(f): f for f in before_findings}
    after_keys: dict[str, dict] = {_finding_key(f): f for f in after_findings}

    fixed = [f for k, f in before_keys.items() if k not in after_keys]
    still_open = [f for k, f in before_keys.items() if k in after_keys]
    new = [f for k, f in after_keys.items() if k not in before_keys]

    total_before = len(before_keys)
    fix_percent = round((len(fixed) / total_before * 100) if total_before else 0, 1)

    return {
        "before_path": before_path,
        "after_path": after_path,
        "fixed": fixed,
        "still_open": still_open,
        "new": new,
        "fix_percent": fix_percent,
        "summary": (
            f"{len(fixed)} fixed, {len(still_open)} still open, "
            f"{len(new)} newly introduced. Fix rate: {fix_percent}%"
        ),
    }


def print_comparison(diff: dict) -> None:
    """
    Print a diff-style comparison summary to stdout.

    Parameters
    ----------
    diff : Result of compare_reports().
    """
    print(f"\nSecAudit Compare: {diff['before_path']} → {diff['after_path']}")
    print("=" * 70)
    print(f"  ✅ Fixed:             {len(diff['fixed'])}")
    print(f"  ❌ Still open:        {len(diff['still_open'])}")
    print(f"  🆕 Newly introduced:  {len(diff['new'])}")
    print(f"  📊 Fix percentage:    {diff['fix_percent']}%")
    print()

    if diff["fixed"]:
        print("─── FIXED ────────────────────────────────────────────────────────────")
        for f in diff["fixed"]:
            print(f"  + [{f.get('severity','?').upper()}] {f.get('rule_id','')} — {f.get('title','')} @ {f.get('location','')}")

    if diff["still_open"]:
        print("─── STILL OPEN ───────────────────────────────────────────────────────")
        for f in diff["still_open"]:
            print(f"  ~ [{f.get('severity','?').upper()}] {f.get('rule_id','')} — {f.get('title','')} @ {f.get('location','')}")

    if diff["new"]:
        print("─── NEWLY INTRODUCED ─────────────────────────────────────────────────")
        for f in diff["new"]:
            print(f"  ! [{f.get('severity','?').upper()}] {f.get('rule_id','')} — {f.get('title','')} @ {f.get('location','')}")

    print("=" * 70)
    print(f"Summary: {diff['summary']}")
