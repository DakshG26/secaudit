"""
tests/test_compare.py — Tests for the before/after comparison command.

Verifies that compare_reports correctly identifies fixed, still-open,
and newly introduced findings.
"""

import json
import textwrap
from pathlib import Path

import pytest

from secaudit.compare import compare_reports, _finding_key


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def write_report(path: Path, findings: list) -> str:
    report = {
        "target_path": "/demo",
        "scan_time": "2026-01-01T00:00:00Z",
        "stats": {},
        "findings": findings,
        "endpoints": [],
        "access_matrix": [],
        "chains": [],
        "ignored": [],
    }
    filepath = str(path)
    Path(filepath).write_text(json.dumps(report))
    return filepath


def make_finding(rule_id: str, location: str, severity: str = "high"):
    return {
        "id": f"{rule_id}-1",
        "rule_id": rule_id,
        "title": f"Test {rule_id}",
        "owasp": "A01",
        "cwe": "CWE-000",
        "severity": severity,
        "confidence": "likely",
        "location": location,
        "evidence": "test evidence",
        "impact": "test impact",
        "remediation": "test fix",
        "fixed_code": "",
        "ignored": False,
        "ignore_reason": "",
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_all_fixed(tmp_path):
    """When after has zero findings, 100% fix rate."""
    before = write_report(tmp_path / "before.json", [
        make_finding("A01-NOAUTH-001", "app.py:10"),
    ])
    after = write_report(tmp_path / "after.json", [])

    diff = compare_reports(before, after)
    assert len(diff["fixed"]) == 1
    assert len(diff["still_open"]) == 0
    assert len(diff["new"]) == 0
    assert diff["fix_percent"] == 100.0


def test_all_still_open(tmp_path):
    """When after has same findings, 0% fix rate."""
    finding = make_finding("A05-SQL-001", "app.py:20")
    before = write_report(tmp_path / "before.json", [finding])
    after = write_report(tmp_path / "after.json", [finding])

    diff = compare_reports(before, after)
    assert len(diff["still_open"]) == 1
    assert len(diff["fixed"]) == 0
    assert diff["fix_percent"] == 0.0


def test_new_finding_introduced(tmp_path):
    """New findings in after are reported separately."""
    before = write_report(tmp_path / "before.json", [])
    after = write_report(tmp_path / "after.json", [
        make_finding("A02-DEBUG-001", "app.py:99"),
    ])

    diff = compare_reports(before, after)
    assert len(diff["new"]) == 1
    assert len(diff["fixed"]) == 0


def test_partial_fix(tmp_path):
    """Mix of fixed, still open, and new findings."""
    before = write_report(tmp_path / "before.json", [
        make_finding("A01-NOAUTH-001", "app.py:10"),
        make_finding("A05-SQL-001", "app.py:20"),
    ])
    after = write_report(tmp_path / "after.json", [
        make_finding("A05-SQL-001", "app.py:20"),  # still open
        make_finding("A02-DEBUG-001", "app.py:99"),  # new
    ])

    diff = compare_reports(before, after)
    assert len(diff["fixed"]) == 1
    assert diff["fixed"][0]["rule_id"] == "A01-NOAUTH-001"
    assert len(diff["still_open"]) == 1
    assert len(diff["new"]) == 1
    assert diff["fix_percent"] == 50.0


def test_finding_key_normalizes_line(tmp_path):
    """Line numbers should not affect the finding key (minor code shifts OK)."""
    f1 = make_finding("A04-JWT-001", "app.py:42")
    f2 = make_finding("A04-JWT-001", "app.py:45")
    assert _finding_key(f1) == _finding_key(f2)


def test_invalid_json_raises(tmp_path):
    """Bad JSON file raises ValueError."""
    bad_file = tmp_path / "bad.json"
    bad_file.write_text("not json {{{")
    with pytest.raises(ValueError):
        compare_reports(str(bad_file), str(bad_file))
