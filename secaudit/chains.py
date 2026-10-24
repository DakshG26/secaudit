"""
chains.py — Attack chain grouper for SecAudit.

Combines related findings into named attack chains, each representing a
multi-step attack that is more severe than its individual parts.

A chain is formed when a defined combination of rule IDs co-occurs in
the scan results. The chain's severity is elevated above its highest component.

Example:
  A01-NOAUTH-001 + A05-SQL-001 → "Full Database Takeover"
  (unauthenticated admin route + SQL injection = anyone can dump the DB)
"""

from __future__ import annotations

from typing import List

from secaudit.models import AttackChain, Finding

# ---------------------------------------------------------------------------
# Chain definitions
# Each chain is a dict:
#   id         : unique chain ID
#   name       : human-readable name
#   description: what the chain enables
#   severity   : elevated severity of the combined attack
#   requires   : list of rule IDs that must ALL be present to form the chain
#   narrative  : plain-language attack story for the report
# ---------------------------------------------------------------------------

CHAIN_DEFINITIONS = [
    {
        "id": "CHAIN-001",
        "name": "Full Database Takeover",
        "description": (
            "An unauthenticated sensitive route combined with SQL injection enables "
            "full database read, modification, and deletion without any credentials."
        ),
        "severity": "critical",
        "requires": ["A01-NOAUTH-001", "A05-SQL-001"],
        "narrative": (
            "Step 1: The /admin or other sensitive route is accessible without authentication "
            "(A01-NOAUTH-001). Step 2: A SQL injection vulnerability on a search or data endpoint "
            "(A05-SQL-001) allows arbitrary database queries. Together: an attacker accesses the "
            "admin endpoint to enumerate structure, then uses SQL injection to exfiltrate, modify, "
            "or delete all database records."
        ),
    },
    {
        "id": "CHAIN-002",
        "name": "Remote Code Execution via Open Admin",
        "description": (
            "An unauthenticated admin route plus an eval/exec call allows arbitrary "
            "OS command execution by any unauthenticated user."
        ),
        "severity": "critical",
        "requires": ["A01-NOAUTH-001", "A05-EXEC-001"],
        "narrative": (
            "Step 1: Admin or management endpoints are accessible without authentication "
            "(A01-NOAUTH-001). Step 2: eval() or exec() is called with user-controlled input "
            "(A05-EXEC-001). Together: an attacker sends crafted input to the open admin endpoint, "
            "achieving arbitrary code execution on the server with the app's OS privileges."
        ),
    },
    {
        "id": "CHAIN-003",
        "name": "Authentication Bypass via JWT Forgery",
        "description": (
            "A JWT with algorithm='none' combined with a protected route means any attacker "
            "can forge an admin token and access protected resources."
        ),
        "severity": "critical",
        "requires": ["A04-JWT-001", "A01-NOAUTH-001"],
        "narrative": (
            "Step 1: The JWT implementation accepts algorithm='none', disabling signature "
            "verification (A04-JWT-001). Step 2: Admin routes lack authentication (A01-NOAUTH-001). "
            "Together: an attacker crafts a JWT claiming admin role without knowing any secret, "
            "then accesses all admin functionality."
        ),
    },
    {
        "id": "CHAIN-004",
        "name": "Credential Harvest via Debug Console",
        "description": (
            "Flask debug=True exposes an interactive Python console; combined with hardcoded "
            "secrets, all credentials are immediately available."
        ),
        "severity": "critical",
        "requires": ["A02-DEBUG-001", "A04-SECRET-001"],
        "narrative": (
            "Step 1: Flask is running with debug=True, exposing the Werkzeug interactive debugger "
            "on any exception page (A02-DEBUG-001). Step 2: Hardcoded secrets exist in the source "
            "(A04-SECRET-001). Together: an attacker triggers an exception to access the debugger "
            "console, reads the running source, and extracts all hardcoded credentials."
        ),
    },
    {
        "id": "CHAIN-005",
        "name": "IDOR + Weak Hash = Account Takeover",
        "description": (
            "Insecure Direct Object Reference combined with MD5/SHA1 password hashing enables "
            "account takeover: enumerate user IDs via IDOR, then crack the weak hashes."
        ),
        "severity": "critical",
        "requires": ["A01-IDOR-001", "A04-WEAKHASH-001"],
        "narrative": (
            "Step 1: User data endpoints return records for any ID without ownership checks "
            "(A01-IDOR-001), allowing enumeration of user records. Step 2: Passwords are hashed "
            "with MD5 (A04-WEAKHASH-001), which can be cracked in seconds with GPU rainbow tables. "
            "Together: an attacker enumerates user records, extracts password hashes, cracks them, "
            "and logs in as any user."
        ),
    },
]


# ---------------------------------------------------------------------------
# Chain detection
# ---------------------------------------------------------------------------

def detect_chains(findings: List[Finding]) -> List[AttackChain]:
    """
    Scan active findings for co-occurring rule combinations that form attack chains.

    Parameters
    ----------
    findings : All findings from the scan (active + ignored).

    Returns
    -------
    List[AttackChain]
        Named attack chains detected, each with finding IDs and elevated severity.
    """
    active_rules: set[str] = {
        f.rule_id for f in findings if not f.ignored
    }
    rule_to_finding_ids: dict[str, List[str]] = {}
    for f in findings:
        if not f.ignored:
            rule_to_finding_ids.setdefault(f.rule_id, []).append(f.id)

    chains: List[AttackChain] = []
    for chain_def in CHAIN_DEFINITIONS:
        required_rules: List[str] = chain_def["requires"]
        # Check all required rules are present in active findings
        if all(r in active_rules for r in required_rules):
            # Collect finding IDs that make up this chain
            component_ids: List[str] = []
            for rule_id in required_rules:
                component_ids.extend(rule_to_finding_ids.get(rule_id, []))

            chains.append(
                AttackChain(
                    id=chain_def["id"],
                    name=chain_def["name"],
                    description=chain_def["description"],
                    severity=chain_def["severity"],
                    finding_ids=component_ids,
                    narrative=chain_def["narrative"],
                )
            )

    return chains
