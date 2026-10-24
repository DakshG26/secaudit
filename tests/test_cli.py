"""
tests/test_cli.py — Tests for the Click CLI commands and exit codes.
"""

from click.testing import CliRunner
from secaudit.cli import cli


def test_cli_rules():
    runner = CliRunner()
    result = runner.invoke(cli, ["rules"])
    assert result.exit_code == 0
    assert "Loaded" in result.output
    assert "A01-NOAUTH-001" in result.output
    assert "A05-SQL-001" in result.output


def test_cli_inventory():
    runner = CliRunner()
    result = runner.invoke(cli, ["inventory", "demo_app/"])
    assert result.exit_code == 0
    assert "Endpoint" in result.output or "Method" in result.output
    assert "/admin" in result.output
    assert "get_user" in result.output


def test_cli_scan_exit_code_1_on_vulnerabilities(tmp_path):
    runner = CliRunner()
    out_html = tmp_path / "test.html"
    out_json = tmp_path / "test.json"
    result = runner.invoke(
        cli,
        [
            "scan",
            "demo_app/",
            "--policy",
            "demo_app/policy.yml",
            "--out",
            str(out_html),
            "--json",
            str(out_json),
        ],
    )
    # Must exit 1 because critical/high findings exist
    assert result.exit_code == 1
    assert "SCAN RESULTS" in result.output
    assert "Critical" in result.output
    assert out_html.exists()
    assert out_json.exists()


def test_cli_scan_exit_code_0_on_fixed(tmp_path):
    runner = CliRunner()
    out_html = tmp_path / "clean.html"
    out_json = tmp_path / "clean.json"
    result = runner.invoke(
        cli,
        [
            "scan",
            "demo_app_fixed/",
            "--policy",
            "demo_app_fixed/policy.yml",
            "--out",
            str(out_html),
            "--json",
            str(out_json),
        ],
    )
    # Must exit 0 because no critical/high findings
    assert result.exit_code == 0
    assert "Total    : 0" in result.output


def test_cli_refuse_external_url():
    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["scan", "demo_app/", "--url", "https://google.com", "--i-own-this-target"],
    )
    assert result.exit_code == 2
    assert "SECURITY ERROR" in result.output


def test_cli_require_authorization_flag():
    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["scan", "demo_app/", "--url", "http://localhost:5000"],
    )
    assert result.exit_code == 2
    assert "--i-own-this-target is required" in result.output


def test_cli_compare(tmp_path):
    runner = CliRunner()
    # First generate before and after
    before_json = tmp_path / "b.json"
    after_json = tmp_path / "a.json"
    runner.invoke(cli, ["scan", "demo_app/", "--json", str(before_json)])
    runner.invoke(cli, ["scan", "demo_app_fixed/", "--json", str(after_json)])

    result = runner.invoke(cli, ["compare", str(before_json), str(after_json)])
    assert result.exit_code == 0
    assert "SecAudit Compare" in result.output
    assert "Fixed" in result.output
    assert "100.0%" in result.output
