"""
report/sarif.py — SARIF 2.1.0 export for SecAudit.

Produces a SARIF file compatible with GitHub Advanced Security,
VS Code, and any tool that consumes the SARIF standard.

Only security findings (non-ignored) are included; web quality items
are excluded so the security verdict isn't diluted.

Reference: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

from secaudit.models import Finding

SARIF_LEVEL = {
    "critical": "error",
    "high": "error",
    "medium": "warning",
    "low": "note",
    "info": "note",
}

TOOL_NAME = "SecAudit"
TOOL_VERSION = "1.0.0"
TOOL_URI = "https://github.com/your-org/secaudit"


def _make_rule(finding: Finding) -> dict:
    """Build a SARIF reportingDescriptor from a finding's rule metadata."""
    return {
        "id": finding.rule_id,
        "name": finding.title.replace(" ", ""),
        "shortDescription": {"text": finding.title},
        "fullDescription": {"text": finding.impact or finding.title},
        "helpUri": f"https://owasp.org/Top10/{finding.owasp}/",
        "properties": {
            "tags": [finding.owasp, finding.cwe],
            "precision": "medium",
            "problem.severity": finding.severity,
        },
        "help": {
            "text": finding.remediation or "See SecAudit documentation.",
            "markdown": finding.remediation or "See SecAudit documentation.",
        },
    }


def _make_location(finding: Finding) -> dict:
    """Build a SARIF location object from finding.location (file:line or URL)."""
    location_str = finding.location or ""
    if location_str.startswith("http"):
        return {
            "physicalLocation": {
                "artifactLocation": {"uri": location_str},
            }
        }
    # "path/to/file.py:42"
    if ":" in location_str:
        parts = location_str.rsplit(":", 1)
        file_path = parts[0]
        try:
            line_num = int(parts[1])
        except ValueError:
            line_num = 1
    else:
        file_path = location_str
        line_num = 1

    return {
        "physicalLocation": {
            "artifactLocation": {"uri": file_path, "uriBaseId": "%SRCROOT%"},
            "region": {"startLine": line_num},
        }
    }


def write_sarif_report(findings: List[Finding], output_path: str) -> None:
    """
    Write a SARIF 2.1.0 file from the list of active findings.

    Parameters
    ----------
    findings    : Active (non-ignored) findings from the scan.
    output_path : Where to write the .sarif file.
    """
    active = [f for f in findings if not f.ignored]

    # Deduplicate rules
    rules_seen: dict[str, dict] = {}
    for f in active:
        if f.rule_id not in rules_seen:
            rules_seen[f.rule_id] = _make_rule(f)

    results = []
    for f in active:
        result = {
            "ruleId": f.rule_id,
            "level": SARIF_LEVEL.get(f.severity, "warning"),
            "message": {
                "text": f"{f.title} — {f.evidence[:200] if f.evidence else ''}",
            },
            "locations": [_make_location(f)],
            "properties": {
                "severity": f.severity,
                "confidence": f.confidence,
                "owasp": f.owasp,
                "cwe": f.cwe,
            },
        }
        results.append(result)

    sarif_doc = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": TOOL_NAME,
                        "version": TOOL_VERSION,
                        "informationUri": TOOL_URI,
                        "rules": list(rules_seen.values()),
                    }
                },
                "results": results,
            }
        ],
    }

    Path(output_path).write_text(
        json.dumps(sarif_doc, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
