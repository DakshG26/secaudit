"""
tests/test_chains.py — Tests for attack chain detection.

Verifies that chains are detected when the required rule IDs co-occur
in the findings list, and that they are elevated to the correct severity.
"""

import pytest

from secaudit.chains import detect_chains, CHAIN_DEFINITIONS
from secaudit.models import Finding


def make_finding(rule_id: str, severity: str = "high") -> Finding:
    """Create a minimal Finding for testing chain detection."""
    return Finding(
        id=f"{rule_id}-1",
        rule_id=rule_id,
        title=f"Test {rule_id}",
        owasp="A01",
        cwe="CWE-000",
        severity=severity,
        confidence="likely",
        location="app.py:1",
        evidence="test",
        impact="test impact",
        remediation="fix it",
    )


# ---------------------------------------------------------------------------
# Chain detection tests
# ---------------------------------------------------------------------------

def test_full_db_takeover_chain_detected():
    """A01-NOAUTH-001 + A05-SQL-001 should trigger CHAIN-001."""
    findings = [
        make_finding("A01-NOAUTH-001", "critical"),
        make_finding("A05-SQL-001", "critical"),
    ]
    chains = detect_chains(findings)
    chain_ids = [c.id for c in chains]
    assert "CHAIN-001" in chain_ids, f"Expected CHAIN-001 in {chain_ids}"


def test_chain_severity_elevated():
    """Chain severity must be critical regardless of component severities."""
    findings = [
        make_finding("A01-NOAUTH-001", "medium"),
        make_finding("A05-SQL-001", "medium"),
    ]
    chains = detect_chains(findings)
    full_db_chain = next((c for c in chains if c.id == "CHAIN-001"), None)
    assert full_db_chain is not None
    assert full_db_chain.severity == "critical"


def test_no_chain_without_all_components():
    """A chain requires ALL its rule IDs to be present."""
    findings = [make_finding("A01-NOAUTH-001")]
    chains = detect_chains(findings)
    chain_ids = [c.id for c in chains]
    assert "CHAIN-001" not in chain_ids


def test_rce_chain_detected():
    """A01-NOAUTH-001 + A05-EXEC-001 → CHAIN-002 (RCE)."""
    findings = [
        make_finding("A01-NOAUTH-001"),
        make_finding("A05-EXEC-001"),
    ]
    chains = detect_chains(findings)
    chain_ids = [c.id for c in chains]
    assert "CHAIN-002" in chain_ids


def test_jwt_forgery_chain():
    """A04-JWT-001 + A01-NOAUTH-001 → CHAIN-003."""
    findings = [
        make_finding("A04-JWT-001"),
        make_finding("A01-NOAUTH-001"),
    ]
    chains = detect_chains(findings)
    chain_ids = [c.id for c in chains]
    assert "CHAIN-003" in chain_ids


def test_ignored_findings_not_counted():
    """Ignored findings should not contribute to chain detection."""
    f1 = make_finding("A01-NOAUTH-001")
    f1.ignored = True  # suppress this one
    f2 = make_finding("A05-SQL-001")
    chains = detect_chains([f1, f2])
    chain_ids = [c.id for c in chains]
    assert "CHAIN-001" not in chain_ids


def test_multiple_chains_detected():
    """Multiple chains can fire simultaneously."""
    findings = [
        make_finding("A01-NOAUTH-001"),
        make_finding("A05-SQL-001"),
        make_finding("A05-EXEC-001"),
        make_finding("A04-JWT-001"),
        make_finding("A02-DEBUG-001"),
        make_finding("A04-SECRET-001"),
    ]
    chains = detect_chains(findings)
    assert len(chains) >= 3, f"Expected at least 3 chains, got {len(chains)}"


def test_chain_finding_ids_populated():
    """Chain must include the finding IDs of its components."""
    findings = [
        make_finding("A01-NOAUTH-001"),
        make_finding("A05-SQL-001"),
    ]
    chains = detect_chains(findings)
    chain = next(c for c in chains if c.id == "CHAIN-001")
    assert "A01-NOAUTH-001-1" in chain.finding_ids
    assert "A05-SQL-001-1" in chain.finding_ids


def test_all_chain_definitions_have_required_fields():
    """Every chain definition must have id, name, severity, requires, narrative."""
    for chain in CHAIN_DEFINITIONS:
        assert "id" in chain
        assert "name" in chain
        assert "severity" in chain
        assert "requires" in chain
        assert len(chain["requires"]) >= 2
        assert "narrative" in chain
