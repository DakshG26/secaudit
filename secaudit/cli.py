"""
cli.py — Command-line interface for SecAudit.

Commands:
  secaudit scan <path>       Full scan with optional policy, live probes, and reports.
  secaudit inventory <path>  Show the endpoint inventory table only.
  secaudit compare a.json b.json  Diff two JSON scan reports.
  secaudit rules             List all loaded rules.

Exit codes:
  0 — No findings, or only medium/low
  1 — Critical or high findings detected
  2 — Error (bad arguments, safety violation, etc.)
"""

from __future__ import annotations

import datetime
import sys
from pathlib import Path

import click

from secaudit import __version__
from secaudit.chains import detect_chains
from secaudit.compare import compare_reports, print_comparison
from secaudit.engine import _load_ignore_file, load_rules, run_scan
from secaudit.inventory import extract_endpoints, print_inventory_table
from secaudit.models import ScanResult
from secaudit.policy import build_access_matrix, load_policy, print_access_matrix
from secaudit.probes import (
    AUTHORIZATION_BANNER,
    SecurityError,
    confirm_open_endpoints,
    run_http_rules,
    validate_url,
)
from secaudit.report.html import render_html_report
from secaudit.report.json_export import write_json_report
from secaudit.report.sarif import write_sarif_report

BANNER = """
╔══════════════════════════════════════════════════════╗
║   SecAudit v{version:<6}  —  Authorized Security Auditor   ║
║   READ-ONLY static analysis. No code execution.      ║
║   Live probes: localhost only, GET/HEAD/OPTIONS only. ║
╚══════════════════════════════════════════════════════╝
""".format(version=__version__)


@click.group()
@click.version_option(__version__, prog_name="secaudit")
def cli():
    """SecAudit — authorized, non-destructive security auditor for AI-generated web apps."""


# ---------------------------------------------------------------------------
# scan command
# ---------------------------------------------------------------------------

@cli.command()
@click.argument("path", type=click.Path(exists=True))
@click.option("--policy", type=click.Path(exists=True), default=None, help="Path to policy.yml")
@click.option("--url", default=None, help="Base URL of running app for live probes (e.g. http://localhost:5000)")
@click.option("--i-own-this-target", "i_own", is_flag=True, default=False, help="Confirm you own and authorise probing of this target")
@click.option("--check-pypi", is_flag=True, default=False, help="Check PyPI for hallucinated packages (makes network requests to pypi.org)")
@click.option("--out", default=None, help="Output HTML report path (default: secaudit_report.html)")
@click.option("--json", "json_out", default=None, help="Output JSON report path")
@click.option("--sarif", "sarif_out", default=None, help="Output SARIF report path")
@click.option("--rules-dir", default=None, help="Override rules directory")
def scan(path, policy, url, i_own, check_pypi, out, json_out, sarif_out, rules_dir):
    """
    Scan a directory for security vulnerabilities.

    Performs static analysis on Python/Flask/FastAPI code.
    Optionally runs live HTTP probes if --url and --i-own-this-target are provided.
    """
    print(BANNER)

    # Safety: validate URL before doing anything
    if url:
        if not i_own:
            click.echo(
                "ERROR: --i-own-this-target is required before any live probe.\n"
                "       Confirm you own and are authorised to test this application.",
                err=True,
            )
            sys.exit(2)
        try:
            validate_url(url)
        except SecurityError as exc:
            click.echo(f"SECURITY ERROR: {exc}", err=True)
            sys.exit(2)

    target = str(Path(path).resolve())
    click.echo(f"Scanning: {target}")

    # Step 1: Extract endpoint inventory
    click.echo("⟳ Extracting endpoint inventory...")
    endpoints = extract_endpoints(target)
    click.echo(f"  Found {len(endpoints)} endpoints")

    # Step 2: Load ignore rules
    ignore_ids = _load_ignore_file(target)
    if ignore_ids:
        click.echo(f"  Ignoring rule IDs: {', '.join(ignore_ids)}")

    # Step 3: Run static analysis
    rules_path = Path(rules_dir) if rules_dir else None
    click.echo("⟳ Running rule engine...")
    findings = run_scan(
        target,
        endpoints,
        rules_dir=rules_path,
        check_pypi=check_pypi,
        ignore_ids=ignore_ids,
    )

    # Step 4: Live HTTP probes (if URL provided)
    if url:
        print(AUTHORIZATION_BANNER)
        click.echo(f"⟳ Running live probes against {url}...")
        rules = load_rules(rules_path)
        http_findings = run_http_rules(url, rules, ignore_ids)
        findings.extend(http_findings)

        click.echo("⟳ Confirming open endpoints via live probe...")
        findings = confirm_open_endpoints(url, findings)

    # Step 5: Policy comparison
    access_matrix = []
    if policy:
        click.echo(f"⟳ Comparing against policy: {policy}")
        try:
            policy_rules = load_policy(policy)
            access_matrix = build_access_matrix(endpoints, policy_rules)
        except ValueError as exc:
            click.echo(f"  WARNING: {exc}", err=True)

    # Step 6: Detect attack chains
    click.echo("⟳ Detecting attack chains...")
    chains = detect_chains(findings)
    if chains:
        click.echo(f"  Detected {len(chains)} attack chain(s)")

    # Step 7: Build ScanResult
    active = [f for f in findings if not f.ignored]
    ignored = [f for f in findings if f.ignored]

    result = ScanResult(
        target_path=target,
        scan_time=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        findings=active,
        endpoints=endpoints,
        access_matrix=access_matrix,
        chains=chains,
        ignored=ignored,
    )
    result.compute_stats()

    # Step 8: Print summary
    _print_summary(result)
    print_inventory_table(endpoints)
    if access_matrix:
        print_access_matrix(access_matrix)

    # Step 9: Write reports
    html_path = out or "secaudit_report.html"
    render_html_report(result, html_path)
    click.echo(f"\n📄 HTML report: {html_path}")

    if json_out:
        write_json_report(result, json_out)
        click.echo(f"📄 JSON report: {json_out}")

    if sarif_out:
        write_sarif_report(active, sarif_out)
        click.echo(f"📄 SARIF report: {sarif_out}")

    # Exit code 1 if critical or high findings
    has_critical_or_high = (
        result.stats.get("critical", 0) > 0 or result.stats.get("high", 0) > 0
    )
    sys.exit(1 if has_critical_or_high else 0)


def _print_summary(result: ScanResult) -> None:
    """Print a coloured summary of finding counts to stdout."""
    s = result.stats
    click.echo("\n" + "=" * 50)
    click.echo("SCAN RESULTS")
    click.echo("=" * 50)
    click.echo(f"  Critical : {s.get('critical', 0)}")
    click.echo(f"  High     : {s.get('high', 0)}")
    click.echo(f"  Medium   : {s.get('medium', 0)}")
    click.echo(f"  Low      : {s.get('low', 0)}")
    click.echo(f"  Total    : {sum(s.values())}")
    if result.chains:
        click.echo(f"  Chains   : {len(result.chains)}")
    if result.ignored:
        click.echo(f"  Ignored  : {len(result.ignored)}")
    click.echo("=" * 50 + "\n")

    for f in result.findings:
        prefix = {
            "critical": "💥",
            "high": "🔴",
            "medium": "🟡",
            "low": "🟢",
        }.get(f.severity, "ℹ")
        click.echo(
            f"  {prefix} [{f.severity.upper():<8}] [{f.confidence:<10}] "
            f"{f.rule_id} — {f.title}\n"
            f"               @ {f.location}"
        )

    if result.chains:
        click.echo("\nAttack Chains:")
        for chain in result.chains:
            click.echo(f"  ⛓ [{chain.severity.upper()}] {chain.name}")


# ---------------------------------------------------------------------------
# inventory command
# ---------------------------------------------------------------------------

@cli.command()
@click.argument("path", type=click.Path(exists=True))
def inventory(path):
    """
    Extract and display the endpoint inventory for a target directory.

    Parses Python files using the AST module to find Flask and FastAPI routes,
    their HTTP methods, auth decorators, and whether each is protected.
    """
    print(BANNER)
    target = str(Path(path).resolve())
    endpoints = extract_endpoints(target)
    print_inventory_table(endpoints)


# ---------------------------------------------------------------------------
# compare command
# ---------------------------------------------------------------------------

@cli.command()
@click.argument("before", type=click.Path(exists=True))
@click.argument("after", type=click.Path(exists=True))
def compare(before, after):
    """
    Compare two JSON scan reports to track remediation progress.

    Shows findings that were fixed, are still open, and newly introduced,
    with a fix percentage.
    """
    try:
        diff = compare_reports(before, after)
        print_comparison(diff)
        # Exit 1 if any still-open or new findings
        if diff["still_open"] or diff["new"]:
            sys.exit(1)
    except ValueError as exc:
        click.echo(f"ERROR: {exc}", err=True)
        sys.exit(2)


# ---------------------------------------------------------------------------
# rules command
# ---------------------------------------------------------------------------

@cli.command()
@click.option("--rules-dir", default=None, help="Override rules directory")
def rules(rules_dir):
    """
    List all loaded security rules.

    Displays rule ID, title, OWASP category, CWE, severity, and type for
    every rule file found in the rules directory.
    """
    rules_path = Path(rules_dir) if rules_dir else None
    all_rules = load_rules(rules_path)

    click.echo(f"\nLoaded {len(all_rules)} rules:\n")
    click.echo(f"{'ID':<25} {'Title':<45} {'OWASP':<6} {'CWE':<12} {'Sev':<10} {'Type'}")
    click.echo("-" * 115)
    for rule in all_rules:
        click.echo(
            f"{rule.get('id',''):<25} {rule.get('title',''):<45} "
            f"{rule.get('owasp',''):<6} {rule.get('cwe',''):<12} "
            f"{rule.get('severity',''):<10} {rule.get('type','')}"
        )


if __name__ == "__main__":
    cli()
