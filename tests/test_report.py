"""
tests/test_report.py — Tests for HTML, JSON, and SARIF report generation,
and ignore mechanisms (.secauditignore & inline comments).
"""

import json
from pathlib import Path
import pytest

from secaudit.models import Finding, ScanResult, Endpoint, AccessMatrixRow, AttackChain
from secaudit.report.html import render_html_report
from secaudit.report.json_export import write_json_report
from secaudit.report.sarif import write_sarif_report
from secaudit.engine import _check_inline_ignore, _load_ignore_file, run_scan


def make_sample_result() -> ScanResult:
    f1 = Finding(
        id="A01-NOAUTH-001-1",
        rule_id="A01-NOAUTH-001",
        title="Route with No Authentication",
        owasp="A01",
        cwe="CWE-306",
        severity="critical",
        confidence="confirmed",
        location="app.py:42",
        evidence="GET /admin — no auth decorator",
        impact="Unauthorized admin access",
        remediation="Add @login_required",
        fixed_code="@app.route('/admin')\n@login_required\ndef admin(): ...",
    )
    f2 = Finding(
        id="A05-SQL-001-1",
        rule_id="A05-SQL-001",
        title="SQL Injection via String Formatting",
        owasp="A05",
        cwe="CWE-89",
        severity="critical",
        confidence="likely",
        location="app.py:80",
        evidence="query = f'SELECT * FROM users WHERE name={name}'",
        impact="Full database read/write",
        remediation="Use parameterised queries",
        fixed_code="cur.execute('SELECT * FROM users WHERE name=?', (name,))",
    )
    ignored = Finding(
        id="A03-UNPINNED-001-1",
        rule_id="A03-UNPINNED-001",
        title="Unpinned Dependencies",
        owasp="A03",
        cwe="CWE-1104",
        severity="low",
        confidence="confirmed",
        location="requirements.txt:1",
        evidence="flask",
        impact="Supply chain instability",
        remediation="Pin to exact version",
        ignored=True,
        ignore_reason="Rule A03-UNPINNED-001 in .secauditignore",
    )
    ep = Endpoint(
        method=["GET"],
        path="/admin",
        handler="admin",
        location="app.py:42",
        auth_decorators=[],
        is_protected=False,
    )
    row = AccessMatrixRow(
        method="GET",
        path="/admin",
        expected="admin",
        actual="none",
        auth_decorators=[],
        status="VIOLATION",
    )
    chain = AttackChain(
        id="CHAIN-001",
        name="Full Database Takeover",
        description="Unauthenticated admin route + SQL injection",
        severity="critical",
        finding_ids=["A01-NOAUTH-001-1", "A05-SQL-001-1"],
        narrative="Attacker accesses open admin route and executes SQL injection.",
    )
    res = ScanResult(
        target_path="/demo",
        scan_time="2026-10-24T12:00:00Z",
        findings=[f1, f2, ignored],
        endpoints=[ep],
        access_matrix=[row],
        chains=[chain],
        ignored=[ignored],
    )
    res.compute_stats()
    return res


def test_html_report_rendering(tmp_path):
    res = make_sample_result()
    out_html = tmp_path / "test_report.html"
    render_html_report(res, str(out_html))

    assert out_html.exists()
    content = out_html.read_text(encoding="utf-8")
    assert "SecAudit Security Report" in content
    assert "Executive Summary" in content
    assert "Endpoint Inventory" in content
    assert "Access Control Matrix" in content
    assert "Attack Chains" in content
    assert "CHAIN-001" in content
    assert "Full Database Takeover" in content
    assert "A01-NOAUTH-001" in content
    assert "Ignored Findings" in content
    assert "A03-UNPINNED-001" in content
    assert "Severity Scoring Formula" in content
    assert "Limitations" in content


def test_json_report_export(tmp_path):
    res = make_sample_result()
    out_json = tmp_path / "test_report.json"
    write_json_report(res, str(out_json))

    assert out_json.exists()
    data = json.loads(out_json.read_text(encoding="utf-8"))
    assert data["target_path"] == "/demo"
    assert data["stats"]["critical"] == 2
    assert len(data["findings"]) == 3
    assert len(data["endpoints"]) == 1
    assert len(data["access_matrix"]) == 1
    assert len(data["chains"]) == 1
    assert len(data["ignored"]) == 1


def test_sarif_report_export(tmp_path):
    res = make_sample_result()
    out_sarif = tmp_path / "test_report.sarif"
    write_sarif_report(res.findings, str(out_sarif))

    assert out_sarif.exists()
    data = json.loads(out_sarif.read_text(encoding="utf-8"))
    assert data["version"] == "2.1.0"
    assert "$schema" in data
    runs = data["runs"]
    assert len(runs) == 1
    driver = runs[0]["tool"]["driver"]
    assert driver["name"] == "SecAudit"
    assert len(driver["rules"]) == 2
    # Only active findings should be in results
    assert len(runs[0]["results"]) == 2
    rule_ids = {r["ruleId"] for r in runs[0]["results"]}
    assert "A01-NOAUTH-001" in rule_ids
    assert "A05-SQL-001" in rule_ids


def test_inline_ignore():
    line_with_ignore = "cur.execute(query)  # secaudit: ignore A05-SQL-001"
    line_without_ignore = "cur.execute(query)  # regular comment"
    assert _check_inline_ignore(line_with_ignore, "A05-SQL-001") is True
    assert _check_inline_ignore(line_without_ignore, "A05-SQL-001") is False


def test_load_ignore_file(tmp_path):
    ignore_file = tmp_path / ".secauditignore"
    ignore_file.write_text("# Comment\nA01-NOAUTH-001\nA05-SQL-001\n")
    rule_ids = _load_ignore_file(str(tmp_path))
    assert "A01-NOAUTH-001" in rule_ids
    assert "A05-SQL-001" in rule_ids
    assert len(rule_ids) == 2
