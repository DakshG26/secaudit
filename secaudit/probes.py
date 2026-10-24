"""
probes.py — Safe HTTP probe engine for SecAudit.

All safety invariants are enforced here and tested in tests/test_safety.py:

  * Only GET, HEAD, OPTIONS requests are ever sent.
  * Only localhost / 127.0.0.1 / ::1 are allowed; every other host raises SecurityError.
  * Redirects to non-localhost hosts are refused.
  * The --i-own-this-target flag must have been provided before this module is called.
  * Every request is written to audit_log.jsonl (time, method, URL, status).
  * A small delay is injected between requests to avoid hammering the target.
  * The only allowed external network call is the PyPI existence check, and only
    when check_pypi=True is explicitly requested.
"""

from __future__ import annotations

import datetime
import json
import re
import time
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

import requests

from secaudit.models import Finding

# ---------------------------------------------------------------------------
# Safety constants
# ---------------------------------------------------------------------------

ALLOWED_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})
ALLOWED_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
REQUEST_DELAY_SECONDS = 1.0
AUDIT_LOG_PATH = "audit_log.jsonl"
PYPI_API_URL = "https://pypi.org/pypi/{package}/json"

AUTHORIZATION_BANNER = """
╔══════════════════════════════════════════════════════════════════════╗
║                    SecAudit — LIVE PROBE MODE                       ║
║                                                                      ║
║  You have confirmed with --i-own-this-target that you own and        ║
║  authorise scanning of this application.                             ║
║                                                                      ║
║  Only safe read-only requests (GET, HEAD, OPTIONS) will be sent.     ║
║  Only localhost targets are permitted.                               ║
║  Every request is logged to audit_log.jsonl.                         ║
╚══════════════════════════════════════════════════════════════════════╝
"""


class SecurityError(Exception):
    """Raised when a safety invariant would be violated."""


# ---------------------------------------------------------------------------
# Safety enforcement
# ---------------------------------------------------------------------------

def validate_url(url: str) -> None:
    """
    Raise SecurityError if the URL is not pointing to localhost.

    This is the single choke-point for all URL validation.
    It must be called before every network request.
    """
    parsed = urlparse(url)
    host = parsed.hostname or ""
    if host not in ALLOWED_HOSTS:
        raise SecurityError(
            f"Refused: target host '{host}' is not localhost. "
            f"SecAudit only probes localhost / 127.0.0.1 / ::1. "
            f"Use --url http://localhost:PORT to specify a local app."
        )


def _safe_request(method: str, url: str, timeout: int = 5) -> requests.Response:
    """
    Send an HTTP request with all safety checks enforced.

    Raises SecurityError if:
    - The method is not GET, HEAD, or OPTIONS.
    - The URL is not localhost.
    - A redirect would send the request to a non-localhost host.
    """
    method = method.upper()
    if method not in ALLOWED_METHODS:
        raise SecurityError(f"Refused: method '{method}' is not in {ALLOWED_METHODS}")

    validate_url(url)

    def check_redirect(response: requests.Response, **kwargs):
        """Hook: refuse redirects to non-localhost hosts."""
        if response.is_redirect:
            location = response.headers.get("Location", "")
            if location.startswith("http"):
                validate_url(location)

    session = requests.Session()
    session.hooks["response"] = [check_redirect]

    response = session.request(
        method,
        url,
        timeout=timeout,
        allow_redirects=True,
    )
    return response


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

def _write_audit_log(
    method: str,
    url: str,
    status_code: Optional[int],
    log_path: str = AUDIT_LOG_PATH,
) -> None:
    """
    Append one JSON line to the audit log.

    Format: {"time": "ISO8601", "method": "GET", "url": "...", "status": 200}
    """
    entry = {
        "time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "method": method.upper(),
        "url": url,
        "status": status_code,
    }
    with open(log_path, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# Live confirmation of open endpoints
# ---------------------------------------------------------------------------

def confirm_open_endpoints(
    base_url: str,
    findings: List[Finding],
    audit_log_path: str = AUDIT_LOG_PATH,
) -> List[Finding]:
    """
    For each finding that suspects an open route (A01, A02-EXPOSEDPATHS),
    send one GET request to the local app to confirm whether it returns 200.

    If the response is 200 with a non-empty body:
        - confidence is upgraded to "confirmed"
        - request/response excerpt is appended to evidence

    If the response is 4xx/5xx or empty:
        - confidence stays "likely" or "possible"

    Parameters
    ----------
    base_url  : Base URL of the running app, e.g. "http://localhost:5000"
    findings  : List of findings to attempt to confirm.
    audit_log_path : Where to write audit entries.

    Returns
    -------
    List[Finding]
        The same list with confidence and evidence updated where confirmed.
    """
    validate_url(base_url)
    print(AUTHORIZATION_BANNER)

    confirmable_rules = {
        "A01-NOAUTH-001",
        "A02-EXPOSEDPATHS-001",
        "A02-SECHEADERS-001",
        "A02-COOKIEFLAGS-001",
    }

    for finding in findings:
        if finding.rule_id not in confirmable_rules:
            continue
        if finding.ignored:
            continue

        # Determine the URL to probe
        if finding.rule_id == "A01-NOAUTH-001":
            # Extract path from evidence
            path_match = re.search(r"(?:GET|POST|DELETE|PATCH|PUT|HEAD|OPTIONS)[,\s]+(\S+)", finding.evidence)
            if not path_match:
                continue
            path = path_match.group(1).split("—")[0].strip()
            # Skip dynamic paths (contain < or {)
            if "<" in path or "{" in path:
                continue
            url = base_url.rstrip("/") + path
        elif finding.rule_id == "A02-EXPOSEDPATHS-001":
            url = finding.location
        else:
            url = base_url

        try:
            validate_url(url)
        except SecurityError:
            continue

        try:
            time.sleep(REQUEST_DELAY_SECONDS)
            response = _safe_request("GET", url)
            status = response.status_code
            _write_audit_log("GET", url, status, audit_log_path)

            if status == 200 and response.text.strip():
                finding.confidence = "confirmed"
                excerpt = response.text[:200].replace("\n", " ")
                finding.evidence += (
                    f"\n[LIVE CONFIRMED] GET {url} → HTTP {status} | "
                    f"Body excerpt: {excerpt!r}"
                )
            else:
                _write_audit_log("GET", url, status, audit_log_path)

        except (SecurityError, requests.RequestException) as exc:
            _write_audit_log("GET", url, None, audit_log_path)

    return findings


def run_http_rules(
    base_url: str,
    rules: List[dict],
    ignore_ids: set,
    audit_log_path: str = AUDIT_LOG_PATH,
) -> List[Finding]:
    """
    Execute HTTP-type rules against the live app.

    Currently handles:
    - A02-SECHEADERS-001: check for missing security headers
    - A02-COOKIEFLAGS-001: check for missing cookie flags
    - A02-EXPOSEDPATHS-001: probe sensitive paths

    Parameters
    ----------
    base_url      : Base URL of the running app.
    rules         : All loaded rules (only type=http will be processed).
    ignore_ids    : Rule IDs to suppress.
    audit_log_path: Audit log file path.
    """
    from secaudit.engine import _next_id

    validate_url(base_url)
    findings: List[Finding] = []

    for rule in rules:
        if rule.get("type") != "http":
            continue
        rule_id = rule["id"]

        if rule_id == "A02-SECHEADERS-001":
            findings.extend(_check_security_headers(rule, base_url, ignore_ids, audit_log_path))
        elif rule_id == "A02-COOKIEFLAGS-001":
            findings.extend(_check_cookie_flags(rule, base_url, ignore_ids, audit_log_path))
        elif rule_id == "A02-EXPOSEDPATHS-001":
            findings.extend(_check_exposed_paths(rule, base_url, ignore_ids, audit_log_path))

    return findings


def _check_security_headers(
    rule: dict,
    base_url: str,
    ignore_ids: set,
    audit_log_path: str,
) -> List[Finding]:
    """Send HEAD to base URL and check for required security headers."""
    from secaudit.engine import _next_id

    findings = []
    try:
        time.sleep(REQUEST_DELAY_SECONDS)
        response = _safe_request("HEAD", base_url)
        _write_audit_log("HEAD", base_url, response.status_code, audit_log_path)
    except (SecurityError, requests.RequestException):
        return findings

    required = rule.get("required_headers", [])
    missing = [h for h in required if h not in response.headers]

    if missing:
        finding_id = _next_id(rule["id"])
        f = Finding(
            id=finding_id,
            rule_id=rule["id"],
            title=rule.get("title", "Missing Security Headers"),
            owasp=rule.get("owasp", "A02"),
            cwe=rule.get("cwe", "CWE-693"),
            severity=rule.get("severity", "medium"),
            confidence="confirmed",
            location=base_url,
            evidence=f"Missing headers: {', '.join(missing)}",
            impact=rule.get("impact", ""),
            remediation=rule.get("fix", ""),
            fixed_code=rule.get("fixed_code", ""),
        )
        if rule["id"].upper() in ignore_ids:
            f.ignored = True
            f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
        findings.append(f)
    return findings


def _check_cookie_flags(
    rule: dict,
    base_url: str,
    ignore_ids: set,
    audit_log_path: str,
) -> List[Finding]:
    """Check Set-Cookie headers for missing security flags."""
    from secaudit.engine import _next_id

    findings = []
    login_url = base_url.rstrip("/") + "/login"
    try:
        validate_url(login_url)
        time.sleep(REQUEST_DELAY_SECONDS)
        response = _safe_request("GET", login_url)
        _write_audit_log("GET", login_url, response.status_code, audit_log_path)
    except (SecurityError, requests.RequestException):
        return findings

    required_flags = rule.get("check_flags_missing", ["HttpOnly", "Secure", "SameSite"])

    for cookie in response.cookies:
        missing_flags = []
        if "HttpOnly" in required_flags and not cookie.has_nonstandard_attr("HttpOnly") and not getattr(cookie, "_rest", {}).get("HttpOnly"):
            # Check via Set-Cookie header string
            set_cookie_header = response.headers.get("Set-Cookie", "")
            if "httponly" not in set_cookie_header.lower():
                missing_flags.append("HttpOnly")
        if missing_flags:
            finding_id = _next_id(rule["id"])
            f = Finding(
                id=finding_id,
                rule_id=rule["id"],
                title=rule.get("title", "Insecure Cookie Flags"),
                owasp=rule.get("owasp", "A02"),
                cwe=rule.get("cwe", "CWE-614"),
                severity=rule.get("severity", "medium"),
                confidence="confirmed",
                location=login_url,
                evidence=f"Cookie '{cookie.name}' missing flags: {', '.join(missing_flags)}",
                impact=rule.get("impact", ""),
                remediation=rule.get("fix", ""),
                fixed_code=rule.get("fixed_code", ""),
            )
            if rule["id"].upper() in ignore_ids:
                f.ignored = True
                f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
            findings.append(f)
    return findings


def _check_exposed_paths(
    rule: dict,
    base_url: str,
    ignore_ids: set,
    audit_log_path: str,
) -> List[Finding]:
    """Probe sensitive paths and flag any that return HTTP 200 with a body."""
    from secaudit.engine import _next_id

    findings = []
    probe_paths = rule.get("probe_paths", [])

    for path in probe_paths:
        url = base_url.rstrip("/") + path
        try:
            validate_url(url)
            time.sleep(REQUEST_DELAY_SECONDS)
            response = _safe_request("GET", url)
            _write_audit_log("GET", url, response.status_code, audit_log_path)
        except (SecurityError, requests.RequestException):
            continue

        if response.status_code == 200 and response.text.strip():
            finding_id = _next_id(rule["id"])
            excerpt = response.text[:200].replace("\n", " ")
            f = Finding(
                id=finding_id,
                rule_id=rule["id"],
                title=rule.get("title", "Sensitive Path Exposed"),
                owasp=rule.get("owasp", "A02"),
                cwe=rule.get("cwe", "CWE-538"),
                severity=rule.get("severity", "high"),
                confidence="confirmed",
                location=url,
                evidence=f"GET {url} → HTTP 200 | Body: {excerpt!r}",
                impact=rule.get("impact", ""),
                remediation=rule.get("fix", ""),
                fixed_code=rule.get("fixed_code", ""),
            )
            if rule["id"].upper() in ignore_ids:
                f.ignored = True
                f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
            findings.append(f)
    return findings


# ---------------------------------------------------------------------------
# PyPI hallucination check
# ---------------------------------------------------------------------------

def check_pypi_packages(
    rule: dict,
    target_path: str,
    ignore_ids: set,
    audit_log_path: str = AUDIT_LOG_PATH,
) -> List[Finding]:
    """
    Check each package in requirements.txt against the PyPI JSON API.

    Only called when --check-pypi flag is present. This is the ONLY allowed
    external network call in SecAudit.
    """
    from secaudit.engine import _next_id

    findings = []
    req_files = list(Path(target_path).rglob("requirements*.txt"))

    for req_file in req_files:
        try:
            lines = req_file.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue

        for lineno, line in enumerate(lines, 1):
            pkg_line = line.strip()
            if not pkg_line or pkg_line.startswith("#") or pkg_line.startswith("-"):
                continue
            # Extract package name (before any version specifier)
            pkg_name = re.split(r"[>=<!;\[]", pkg_line)[0].strip()
            if not pkg_name:
                continue

            api_url = PYPI_API_URL.format(package=pkg_name)
            try:
                response = requests.get(api_url, timeout=5)
                _write_audit_log("GET", api_url, response.status_code, audit_log_path)
                if response.status_code == 404:
                    finding_id = _next_id(rule["id"])
                    f = Finding(
                        id=finding_id,
                        rule_id=rule["id"],
                        title=rule.get("title", "Hallucinated PyPI Package"),
                        owasp=rule.get("owasp", "A03"),
                        cwe=rule.get("cwe", "CWE-1357"),
                        severity=rule.get("severity", "high"),
                        confidence="confirmed",
                        location=f"{req_file}:{lineno}",
                        evidence=f"Package '{pkg_name}' returned HTTP 404 from PyPI",
                        impact=rule.get("impact", ""),
                        remediation=rule.get("fix", ""),
                        fixed_code=rule.get("fixed_code", ""),
                    )
                    if rule["id"].upper() in ignore_ids:
                        f.ignored = True
                        f.ignore_reason = f"Rule {rule['id']} in .secauditignore"
                    findings.append(f)
            except requests.RequestException:
                pass

    return findings
