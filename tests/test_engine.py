"""
tests/test_engine.py — Tests for the rule engine against the demo app.

The main purpose is to verify that every planted flaw in demo_app/ is
detected (recall = 100%) and that demo_app_fixed/ produces zero findings
for the same rules (zero false negatives on patched code).

Also prints precision and recall metrics at the end.
"""

import os
from pathlib import Path
import pytest

from secaudit.engine import load_rules, run_scan, _load_ignore_file
from secaudit.inventory import extract_endpoints
from secaudit.models import Finding

DEMO_APP = str(Path(__file__).parent.parent / "demo_app")
DEMO_FIXED = str(Path(__file__).parent.parent / "demo_app_fixed")

# ── Planted flaws and the rule IDs that should catch each one ──────────────
PLANTED_FLAWS = [
    ("Flaw 1: No-auth /admin route",          "A01-NOAUTH-001"),
    ("Flaw 2: IDOR on /user/<id>",            "A01-IDOR-001"),
    ("Flaw 3: SQL injection via f-string",    "A05-SQL-001"),
    ("Flaw 4: Hardcoded SECRET_KEY",          "A04-SECRET-001"),
    ("Flaw 5: MD5 for passwords",             "A04-WEAKHASH-001"),
    ("Flaw 6: debug=True",                    "A02-DEBUG-001"),
    ("Flaw 7: Stack trace to client",         "A10-STACKTRACE-001"),
    ("Flaw 8: CORS wildcard",                 "A01-CORS-001"),
    ("Flaw 9: Unpinned deps",                 "A03-UNPINNED-001"),
    ("Flaw 10: eval() on user input",         "A05-EXEC-001"),
    ("Flaw 11: No login failure logging",     "A09-NOLOG-001"),
    ("Flaw 12: JWT algorithm=none",           "A04-JWT-001"),
]


def _scan_demo(path: str):
    """Run a full scan on the given path and return findings."""
    endpoints = extract_endpoints(path)
    findings = run_scan(path, endpoints, ignore_ids=set())
    return [f for f in findings if not f.ignored]


# ---------------------------------------------------------------------------
# Recall test: demo_app catches every planted flaw
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def demo_findings():
    return _scan_demo(DEMO_APP)


def test_all_planted_flaws_detected(demo_findings):
    """Recall = 100%: every planted flaw must be found."""
    found_rule_ids = {f.rule_id for f in demo_findings}
    missing = []
    for description, rule_id in PLANTED_FLAWS:
        if rule_id not in found_rule_ids:
            missing.append(f"{description} ({rule_id})")

    if missing:
        pytest.fail(
            f"Missing {len(missing)} planted flaw(s):\n" +
            "\n".join(f"  - {m}" for m in missing)
        )


def test_demo_has_critical_findings(demo_findings):
    """demo_app must have at least one critical finding."""
    criticals = [f for f in demo_findings if f.severity == "critical"]
    assert len(criticals) > 0, "Expected critical findings in demo_app"


def test_demo_has_expected_count(demo_findings):
    """demo_app should produce at least 12 distinct findings."""
    assert len(demo_findings) >= 12, (
        f"Expected at least 12 findings, got {len(demo_findings)}"
    )


# ---------------------------------------------------------------------------
# Zero false-negatives on fixed app
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def fixed_findings():
    return _scan_demo(DEMO_FIXED)


def test_fixed_app_has_zero_findings(fixed_findings):
    """demo_app_fixed must have zero findings across all rules."""
    assert len(fixed_findings) == 0, f"Expected 0 findings in fixed app, got {len(fixed_findings)}: {fixed_findings}"


def test_fixed_app_no_critical_or_high(fixed_findings):
    """demo_app_fixed must have no critical or high findings."""
    bad = [f for f in fixed_findings if f.severity in ("critical", "high")]
    if bad:
        for f in bad:
            print(f"  UNEXPECTED: [{f.severity}] {f.rule_id} — {f.title} @ {f.location}")
    assert len(bad) == 0, (
        f"Fixed app still has {len(bad)} critical/high finding(s). "
        "Check demo_app_fixed/app.py for remaining vulnerabilities."
    )


def test_fixed_app_no_injection(fixed_findings):
    """Fixed app must have no SQL injection or code execution findings."""
    injection = [f for f in fixed_findings if f.rule_id in ("A05-SQL-001", "A05-EXEC-001")]
    assert len(injection) == 0, f"Injection findings still present: {injection}"


def test_fixed_app_no_debug(fixed_findings):
    """Fixed app must not have debug=True."""
    debug = [f for f in fixed_findings if f.rule_id == "A02-DEBUG-001"]
    assert len(debug) == 0, "debug=True still present in fixed app"


def test_fixed_app_no_hardcoded_secrets(fixed_findings):
    """Fixed app must not have hardcoded secrets."""
    secrets = [f for f in fixed_findings if f.rule_id == "A04-SECRET-001"]
    assert len(secrets) == 0, f"Hardcoded secrets still in fixed app: {secrets}"


def test_fixed_app_no_weak_hash(fixed_findings):
    """Fixed app must not use MD5/SHA1 for passwords."""
    weak = [f for f in fixed_findings if f.rule_id == "A04-WEAKHASH-001"]
    assert len(weak) == 0, f"Weak hash still in fixed app: {weak}"


def test_fixed_app_no_jwt_none(fixed_findings):
    """Fixed app must not have JWT algorithm=none."""
    jwt = [f for f in fixed_findings if f.rule_id == "A04-JWT-001"]
    assert len(jwt) == 0, f"JWT algorithm=none still in fixed app: {jwt}"


# ---------------------------------------------------------------------------
# Precision/Recall report (informational, not a failing test)
# ---------------------------------------------------------------------------

def test_print_precision_recall(demo_findings, fixed_findings, capsys):
    """Print precision and recall metrics."""
    found_rule_ids = {f.rule_id for f in demo_findings}
    planted_rule_ids = {rule_id for _, rule_id in PLANTED_FLAWS}

    true_positives = len(planted_rule_ids & found_rule_ids)
    false_negatives = len(planted_rule_ids - found_rule_ids)
    total_findings = len(demo_findings)

    recall = true_positives / len(planted_rule_ids) if planted_rule_ids else 0
    # Precision = TP / (TP + FP) — FP = findings not in planted flaws
    false_positives = len(found_rule_ids - planted_rule_ids)
    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) else 0

    print(f"\n{'='*50}")
    print("SecAudit Precision/Recall Report")
    print(f"{'='*50}")
    print(f"  Planted flaws:       {len(planted_rule_ids)}")
    print(f"  Detected:            {true_positives} / {len(planted_rule_ids)}")
    print(f"  Missed:              {false_negatives}")
    print(f"  Extra findings:      {false_positives} (may include demo_fixed false positives)")
    print(f"  Total findings:      {total_findings}")
    print(f"  Recall:              {recall:.0%}")
    print(f"  Precision (rules):   {precision:.0%}")
    print(f"  Fixed app findings:  {len(fixed_findings)}")
    print(f"{'='*50}")

    # Recall must be 100%
    assert recall == 1.0, f"Recall is {recall:.0%}, expected 100%"
