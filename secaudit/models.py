"""
models.py — Core data models for SecAudit.

Defines the canonical dataclasses used throughout the tool:
Finding, Endpoint, PolicyRule, AccessMatrixRow, AttackChain, ScanResult.
All models are JSON-serialisable via the to_dict() helper.
"""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Severity / Confidence helpers
# ---------------------------------------------------------------------------

SEVERITY_LEVELS = ["critical", "high", "medium", "low", "info"]
CONFIDENCE_LEVELS = ["confirmed", "likely", "possible"]

# Impact score for the documented formula
IMPACT_SCORE = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}
CONFIDENCE_MULTIPLIER = {"confirmed": 1.0, "likely": 0.85, "possible": 0.65}

# Exploitability labels mapped to scores
EXPLOITABILITY_SCORE = {"trivial": 1.0, "easy": 0.75, "moderate": 0.5, "hard": 0.25}


def compute_severity(
    base_severity: str,
    exploitability: str = "easy",
    confidence: str = "likely",
) -> str:
    """
    Return an adjusted severity string using the documented formula:

        adjusted = impact_score × exploitability_score × confidence_multiplier

        ≥ 3.5  → critical
        ≥ 2.5  → high
        ≥ 1.5  → medium
        else   → low

    This allows confidence to downgrade a finding without hiding it.
    """
    impact = IMPACT_SCORE.get(base_severity, 1)
    exploit = EXPLOITABILITY_SCORE.get(exploitability, 0.75)
    conf = CONFIDENCE_MULTIPLIER.get(confidence, 0.85)
    score = impact * exploit * conf
    if score >= 3.5:
        return "critical"
    if score >= 2.5:
        return "high"
    if score >= 1.5:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Finding
# ---------------------------------------------------------------------------

@dataclass
class Finding:
    """
    One security finding produced by a rule.

    Attributes
    ----------
    id          : Unique finding ID, e.g. "A05-SQL-001-1"
    rule_id     : The rule that produced this finding, e.g. "A05-SQL-001"
    title       : Human-readable title from the rule
    owasp       : OWASP Top 10:2025 category, e.g. "A05"
    cwe         : CWE identifier, e.g. "CWE-89"
    severity    : critical / high / medium / low / info
    confidence  : confirmed / likely / possible
    location    : "path/to/file.py:42" or "http://localhost:5000/admin"
    evidence    : Code snippet or HTTP response excerpt (secrets redacted)
    impact      : Description of the business impact
    remediation : Step-by-step fix
    fixed_code  : Before/after code example
    ignored     : True if suppressed by .secauditignore or inline comment
    ignore_reason: Why this finding was ignored
    """

    id: str
    rule_id: str
    title: str
    owasp: str
    cwe: str
    severity: str
    confidence: str
    location: str
    evidence: str
    impact: str
    remediation: str
    fixed_code: str = ""
    ignored: bool = False
    ignore_reason: str = ""

    def to_dict(self) -> dict:
        """Return a JSON-serialisable dict."""
        return dataclasses.asdict(self)


# ---------------------------------------------------------------------------
# Endpoint (inventory)
# ---------------------------------------------------------------------------

@dataclass
class Endpoint:
    """
    One HTTP endpoint extracted from the target codebase.

    Attributes
    ----------
    method          : HTTP method(s), e.g. ["GET", "POST"]
    path            : URL path, e.g. "/admin/users"
    handler         : Python function name, e.g. "admin_users"
    location        : "file.py:42"
    path_params     : List of path parameter names, e.g. ["user_id"]
    request_inputs  : Form fields / query params observed in the handler
    auth_decorators : Auth-related decorators found above the handler
    is_protected    : True if at least one auth decorator is present
    """

    method: List[str]
    path: str
    handler: str
    location: str
    path_params: List[str] = field(default_factory=list)
    request_inputs: List[str] = field(default_factory=list)
    auth_decorators: List[str] = field(default_factory=list)
    is_protected: bool = False

    def to_dict(self) -> dict:
        """Return a JSON-serialisable dict."""
        return dataclasses.asdict(self)


# ---------------------------------------------------------------------------
# Policy models
# ---------------------------------------------------------------------------

@dataclass
class PolicyRule:
    """
    One entry in policy.yml stating what auth a route must have.

    Example YAML entry::

        - path: "/admin/*"
          requires: admin
    """

    path: str           # Glob-style path pattern
    requires: str       # admin | owner | authenticated | public

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


@dataclass
class AccessMatrixRow:
    """One row in the access-control matrix."""

    method: str
    path: str
    expected: str       # from policy.yml, or "uncovered"
    actual: str         # "protected" / "none"
    auth_decorators: List[str]
    status: str         # OK | VIOLATION | WEAKER | UNCOVERED

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


# ---------------------------------------------------------------------------
# Attack chain
# ---------------------------------------------------------------------------

@dataclass
class AttackChain:
    """
    A named combination of findings that together enable a higher-impact attack.

    Example: unauthenticated admin route + SQL injection = "Full DB Takeover"
    The chain severity is elevated above its component parts.
    """

    id: str
    name: str
    description: str
    severity: str           # Elevated severity of the chain
    finding_ids: List[str]  # IDs of the component findings
    narrative: str          # Plain-language attack story

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


# ---------------------------------------------------------------------------
# ScanResult
# ---------------------------------------------------------------------------

@dataclass
class ScanResult:
    """
    The complete output of a scan, ready to serialise to JSON / HTML / SARIF.

    Attributes
    ----------
    target_path   : Scanned directory path
    scan_time     : ISO 8601 timestamp
    findings      : All findings (including ignored)
    endpoints     : Full endpoint inventory
    access_matrix : Route-by-route policy comparison
    chains        : Detected attack chains
    ignored       : Findings suppressed by ignore rules
    stats         : Counts by severity
    """

    target_path: str
    scan_time: str
    findings: List[Finding] = field(default_factory=list)
    endpoints: List[Endpoint] = field(default_factory=list)
    access_matrix: List[AccessMatrixRow] = field(default_factory=list)
    chains: List[AttackChain] = field(default_factory=list)
    ignored: List[Finding] = field(default_factory=list)
    stats: dict = field(default_factory=dict)

    def active_findings(self) -> List[Finding]:
        """Return non-ignored findings."""
        return [f for f in self.findings if not f.ignored]

    def compute_stats(self) -> dict:
        """Compute severity counts from active findings."""
        counts = {sev: 0 for sev in SEVERITY_LEVELS}
        for f in self.active_findings():
            counts[f.severity] = counts.get(f.severity, 0) + 1
        self.stats = counts
        return counts

    def to_dict(self) -> dict:
        """Return a JSON-serialisable dict of the full result."""
        self.compute_stats()
        return {
            "target_path": self.target_path,
            "scan_time": self.scan_time,
            "stats": self.stats,
            "findings": [f.to_dict() for f in self.findings],
            "endpoints": [e.to_dict() for e in self.endpoints],
            "access_matrix": [r.to_dict() for r in self.access_matrix],
            "chains": [c.to_dict() for c in self.chains],
            "ignored": [f.to_dict() for f in self.ignored],
        }
