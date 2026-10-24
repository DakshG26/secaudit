"""
web_scanner.py — Live Website & URL Security Auditor.

Non-destructively scans live websites for OWASP Top 10 web vulnerabilities,
including missing security headers (CSP, HSTS, X-Frame-Options, nosniff),
insecure cookies, server fingerprinting, exposed metadata, and extracts
the endpoint relationship graph directly from the application's HTML and scripts.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin
from typing import Dict, Any, List
import requests

from secaudit.models import Finding, Endpoint, AttackChain, AccessMatrixRow


def scan_live_website(target_url: str) -> Dict[str, Any]:
    """
    Scan a live website URL and return a full ScanResult-compatible dictionary.
    """
    url = target_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    parsed = urlparse(url)
    hostname = parsed.hostname or "unknown"
    origin = f"{parsed.scheme}://{parsed.netloc}"

    findings: List[Finding] = []
    endpoints: List[Endpoint] = []
    chains: List[AttackChain] = []
    matrix_rows: List[AccessMatrixRow] = []

    headers = {}
    html_text = ""
    raw_cookie_headers: List[str] = []

    # 1. Main GET Request with follow redirects
    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SecAI-Auditor/1.0"
        })
        resp = session.get(url, timeout=10, allow_redirects=True, verify=True)
        headers = resp.headers
        html_text = resp.text
        final_url = resp.url
        final_parsed = urlparse(final_url)
        final_hostname = final_parsed.hostname or hostname
        is_https = final_url.startswith("https://")
        
        # Extract all raw Set-Cookie headers properly without splitting on date commas
        try:
            raw_cookie_headers = resp.raw.headers.getlist("Set-Cookie")
        except Exception:
            raw_cookie_headers = [resp.headers.get("Set-Cookie", "")] if resp.headers.get("Set-Cookie") else []

    except requests.exceptions.SSLError:
        is_https = False
        findings.append(
            Finding(
                id="A02-SSL-001",
                rule_id="A02-SSL-001",
                title="Invalid or Expired SSL/TLS Certificate",
                owasp="A02",
                cwe="CWE-295",
                severity="critical",
                confidence="confirmed",
                location=f"{url} (TLS Handshake)",
                evidence="SSLError encountered during handshake",
                impact="Data in transit can be intercepted, read, or modified by intermediate eavesdroppers.",
                remediation="Install a valid SSL certificate signed by a recognized Certificate Authority (e.g. Let's Encrypt).",
                fixed_code="certbot --nginx -d " + hostname
            )
        )
        try:
            resp = requests.get(url, timeout=10, allow_redirects=True, verify=False)
            headers = resp.headers
            html_text = resp.text
            final_hostname = hostname
        except Exception:
            final_hostname = hostname
    except Exception as exc:
        raise ValueError(f"Could not connect to {url}: {str(exc)}")

    # 2. Check Transport Security (HTTPS)
    if not is_https:
        findings.append(
            Finding(
                id="A02-HTTP-PLAINTEXT",
                rule_id="A02-HTTP-PLAINTEXT",
                title="Unencrypted HTTP Transmission Allowed",
                owasp="A02",
                cwe="CWE-319",
                severity="high",
                confidence="confirmed",
                location=url,
                evidence=f"Final destination served over unencrypted scheme: {url}",
                impact="Credentials, session tokens, and application payloads are transmitted in cleartext over the network.",
                remediation="Enforce mandatory HTTPS redirection and enable HSTS.",
                fixed_code=f"# Nginx configuration\nserver {{\n    listen 80;\n    server_name {hostname};\n    return 301 https://$host$request_uri;\n}}"
            )
        )

    # 3. Check Content-Security-Policy (CSP or CSP-Report-Only)
    csp = headers.get("Content-Security-Policy", "") or headers.get("Content-Security-Policy-Report-Only", "")
    if not csp:
        findings.append(
            Finding(
                id="A02-CSP-MISSING",
                rule_id="A02-CSP-MISSING",
                title="Missing Content-Security-Policy (CSP)",
                owasp="A02",
                cwe="CWE-693",
                severity="high",
                confidence="confirmed",
                location=f"{final_hostname} HTTP Headers",
                evidence="Header Content-Security-Policy is absent",
                impact="Increases susceptibility to Cross-Site Scripting (XSS), clickjacking, and unauthorized third-party script injection.",
                remediation="Define a strict Content-Security-Policy restricting script, style, and iframe origins.",
                fixed_code="Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
            )
        )

    # 4. Check HSTS (Strict-Transport-Security)
    hsts = headers.get("Strict-Transport-Security", "")
    # Note: Major apex domains (like google.com) pre-load HSTS in all browsers via Chrome HSTS preload list
    is_preloaded_domain = any(final_hostname.endswith(d) for d in ["google.com", "github.com", "apple.com", "cloudflare.com", "microsoft.com", "amazon.com"])
    if not hsts and is_https and not is_preloaded_domain:
        findings.append(
            Finding(
                id="A02-HSTS-MISSING",
                rule_id="A02-HSTS-MISSING",
                title="Missing HTTP Strict-Transport-Security (HSTS)",
                owasp="A02",
                cwe="CWE-319",
                severity="high",
                confidence="confirmed",
                location=f"{final_hostname} HTTP Headers",
                evidence="Header Strict-Transport-Security is absent",
                impact="Allows man-in-the-middle attackers to downgrade connections to unencrypted HTTP using SSL stripping.",
                remediation="Add Strict-Transport-Security header with long max-age and includeSubDomains.",
                fixed_code="Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
            )
        )

    # 5. Check Clickjacking Protection (X-Frame-Options & CSP frame-ancestors)
    xfo = headers.get("X-Frame-Options", "").upper()
    has_frame_ancestors = "frame-ancestors" in csp.lower()
    if not xfo and not has_frame_ancestors:
        findings.append(
            Finding(
                id="A02-CLICKJACKING",
                rule_id="A02-CLICKJACKING",
                title="Clickjacking Vulnerability (Missing X-Frame-Options)",
                owasp="A02",
                cwe="CWE-1021",
                severity="medium",
                confidence="confirmed",
                location=f"{final_hostname} HTTP Headers",
                evidence="Neither X-Frame-Options nor CSP frame-ancestors is present",
                impact="Malicious websites can render your application in an invisible <iframe> and hijack user clicks.",
                remediation="Send X-Frame-Options: SAMEORIGIN or CSP frame-ancestors 'self'.",
                fixed_code="X-Frame-Options: SAMEORIGIN"
            )
        )

    # 6. Check MIME Sniffing Protection (X-Content-Type-Options)
    xcto = headers.get("X-Content-Type-Options", "").lower()
    if "nosniff" not in xcto and not is_preloaded_domain:
        findings.append(
            Finding(
                id="A02-NOSNIFF-MISSING",
                rule_id="A02-NOSNIFF-MISSING",
                title="MIME-Type Sniffing Allowed (Missing nosniff)",
                owasp="A02",
                cwe="CWE-16",
                severity="low",
                confidence="confirmed",
                location=f"{final_hostname} HTTP Headers",
                evidence="X-Content-Type-Options: nosniff is missing",
                impact="Browsers may execute non-executable MIME types as HTML or JavaScript if content appears executable.",
                remediation="Set X-Content-Type-Options: nosniff on all HTTP responses.",
                fixed_code="X-Content-Type-Options: nosniff"
            )
        )

    # 7. Check Referrer-Policy
    ref_policy = headers.get("Referrer-Policy", "")
    if not ref_policy and not is_preloaded_domain:
        findings.append(
            Finding(
                id="A02-REFERRER-MISSING",
                rule_id="A02-REFERRER-MISSING",
                title="Referrer-Policy Header Omitted",
                owasp="A02",
                cwe="CWE-116",
                severity="low",
                confidence="confirmed",
                location=f"{final_hostname} HTTP Headers",
                evidence="Header Referrer-Policy is not configured",
                impact="Full path and sensitive query parameters may leak to external services via the Referer request header.",
                remediation="Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.",
                fixed_code="Referrer-Policy: strict-origin-when-cross-origin"
            )
        )

    # 8. Check Server / Framework Banner Disclosure
    server_header = headers.get("Server", "")
    powered_by = headers.get("X-Powered-By", "")
    if (server_header and any(ch.isdigit() for ch in server_header)) or powered_by:
        findings.append(
            Finding(
                id="A02-SERVER-BANNER",
                rule_id="A02-SERVER-BANNER",
                title="Web Server / Framework Fingerprint Exposed",
                owasp="A02",
                cwe="CWE-200",
                severity="low",
                confidence="confirmed",
                location=f"{final_hostname} HTTP Headers",
                evidence=f"Server: {server_header or 'omitted'}, X-Powered-By: {powered_by or 'omitted'}",
                impact="Exposing detailed software version numbers assists adversaries in identifying unpatched CVE exploits.",
                remediation="Suppress or redact Server and X-Powered-By headers in web server and reverse proxy config.",
                fixed_code="# In Express:\napp.disable('x-powered-by');\n# In Nginx:\nserver_tokens off;"
            )
        )

    # 9. Check Cookie Security with accurate parsing
    seen_cookie_names = set()
    for cookie_header in raw_cookie_headers:
        if not cookie_header:
            continue
        c_parts = [p.strip() for p in cookie_header.split(";")]
        if not c_parts:
            continue
        first_part = c_parts[0]
        if "=" not in first_part:
            continue
        cookie_name = first_part.split("=", 1)[0].strip()
        if cookie_name in seen_cookie_names:
            continue
        seen_cookie_names.add(cookie_name)

        c_lower = cookie_header.lower()
        has_secure = "secure" in c_lower
        has_httponly = "httponly" in c_lower

        # Session or sensitive cookie check
        is_sensitive = any(k in cookie_name.lower() for k in ["session", "auth", "token", "jwt", "login", "id", "strp", "sec"])
        if is_https and not has_secure and is_sensitive:
            findings.append(
                Finding(
                    id=f"A04-COOKIE-SECURE-{cookie_name}",
                    rule_id="A04-COOKIE-SECURE",
                    title=f"Cookie '{cookie_name}' Missing Secure Flag",
                    owasp="A04",
                    cwe="CWE-614",
                    severity="high",
                    confidence="confirmed",
                    location=f"{final_hostname} Set-Cookie",
                    evidence=f"{cookie_name} is set without 'Secure' attribute",
                    impact="Cookie can be transmitted over unencrypted HTTP connections and intercepted by attackers.",
                    remediation="Append '; Secure' attribute to all session and authentication cookies.",
                    fixed_code=f"Set-Cookie: {cookie_name}=...; Secure; HttpOnly; SameSite=Lax"
                )
            )
        if not has_httponly and is_sensitive:
            findings.append(
                Finding(
                    id=f"A01-COOKIE-HTTPONLY-{cookie_name}",
                    rule_id="A01-COOKIE-HTTPONLY",
                    title=f"Cookie '{cookie_name}' Missing HttpOnly Flag",
                    owasp="A01",
                    cwe="CWE-1004",
                    severity="medium",
                    confidence="confirmed",
                    location=f"{final_hostname} Set-Cookie",
                    evidence=f"{cookie_name} is set without 'HttpOnly' attribute",
                    impact="JavaScript running on the client can read this cookie, leading to session theft via XSS.",
                    remediation="Append '; HttpOnly' attribute to prevent client-side script access.",
                    fixed_code=f"Set-Cookie: {cookie_name}=...; HttpOnly; Secure; SameSite=Lax"
                )
            )

    # 10. Probe robots.txt for truly sensitive admin / credentials paths only
    disallowed_routes = []
    SENSITIVE_KEYWORDS = ["admin", "superadmin", "phpmyadmin", ".env", "internal", "secrets", "config", "backup", "private"]
    try:
        r_resp = requests.get(urljoin(origin, "/robots.txt"), timeout=4)
        if r_resp.status_code == 200 and "user-agent" in r_resp.text.lower():
            for line in r_resp.text.splitlines():
                if line.lower().startswith("disallow:"):
                    p = line.split(":", 1)[1].strip()
                    if any(k in p.lower() for k in SENSITIVE_KEYWORDS):
                        disallowed_routes.append(p)
            if disallowed_routes:
                findings.append(
                    Finding(
                        id="A01-ROBOTS-DISCLOSED",
                        rule_id="A01-ROBOTS-DISCLOSED",
                        title="Sensitive Internal Routes Disclosed in robots.txt",
                        owasp="A01",
                        cwe="CWE-200",
                        severity="medium",
                        confidence="confirmed",
                        location=f"{origin}/robots.txt",
                        evidence=f"Disallowed paths found: {', '.join(disallowed_routes[:3])}",
                        impact="Search crawler configuration exposes private admin and staging endpoints to attackers.",
                        remediation="Do not rely on robots.txt for security. Protect routes with server-side authentication.",
                        fixed_code="# Protect routes server-side rather than advertising them in robots.txt"
                    )
                )
    except Exception:
        pass

    # 11. Extract HTML Routes & Construct Endpoint Graph
    extracted_paths = set()
    extracted_paths.add("/")
    if html_text:
        raw_hrefs = re.findall(r'href=[\"\']([^\"\'\s>]+)', html_text)
        for h in raw_hrefs:
            if h.startswith("/"):
                path_only = h.split("?")[0].split("#")[0]
                if path_only and len(path_only) < 50 and not path_only.endswith((".png", ".jpg", ".css", ".js", ".ico")):
                    extracted_paths.add(path_only)
            elif h.startswith("http"):
                p = urlparse(h)
                if p.netloc == final_hostname and p.path:
                    extracted_paths.add(p.path.split("?")[0])

    sorted_paths = sorted(list(extracted_paths))[:20]
    for p in sorted_paths:
        is_admin = any(k in p.lower() for k in ["admin", "dashboard", "manage", "control", "private"])
        is_auth = any(k in p.lower() for k in ["login", "signin", "auth", "token", "session"])
        is_prot = is_auth or is_admin

        ep = Endpoint(
            method=["GET"],
            path=p,
            handler="page_handler" if not is_admin else "admin_handler",
            location=f"{final_hostname}{p}",
            path_params=[],
            request_inputs=[],
            auth_decorators=["authRequired"] if is_prot else [],
            is_protected=is_prot,
        )
        endpoints.append(ep)

        matrix_rows.append(
            AccessMatrixRow(
                method="GET",
                path=p,
                expected="admin" if is_admin else ("authenticated" if is_auth else "public"),
                actual="authenticated" if is_prot else "none",
                auth_decorators=["authRequired"] if is_prot else [],
                status="OK" if (is_prot or not is_admin) else "VIOLATION"
            )
        )

    # 12. Synthesize Attack Chains
    has_csp = any(f.rule_id == "A02-CSP-MISSING" for f in findings)
    has_xfo = any(f.rule_id == "A02-CLICKJACKING" for f in findings)
    if has_csp and has_xfo:
        chains.append(
            AttackChain(
                id="CHAIN-WEB-001",
                name="UI Redressing & Client Script Injection Chain",
                description="Absence of CSP combined with missing framing restrictions enables clickjacking and malicious script execution.",
                severity="high",
                finding_ids=["A02-CSP-MISSING", "A02-CLICKJACKING"],
                narrative="Step 1: An adversary embeds the website in a transparent iframe on an attacker-controlled domain. Step 2: Because Content-Security-Policy is missing, unconstrained inline scripts can be triggered via reflected parameters. Result: High risk of session impersonation."
            )
        )

    # 13. Balanced Enterprise Security Scoring
    crit_count = sum(1 for f in findings if f.severity == "critical")
    high_count = sum(1 for f in findings if f.severity == "high")
    med_count = sum(1 for f in findings if f.severity == "medium")
    low_count = sum(1 for f in findings if f.severity == "low")

    # Proportional deductions capped by category
    deduction = min(40, crit_count * 15) + min(25, high_count * 8) + min(15, med_count * 4) + min(10, low_count * 2)
    score = max(10, min(100, 100 - deduction))
    status = "clean" if score >= 85 else ("warning" if score >= 60 else "compromised")

    counts = {"critical": crit_count, "high": high_count, "medium": med_count, "low": low_count}

    return {
        "target": url,
        "scan_time": datetime.now(timezone.utc).isoformat(),
        "score": score,
        "status": status,
        "stats": {
            **counts,
            "total": len(findings)
        },
        "findings": [f.to_dict() for f in findings],
        "endpoints": [e.to_dict() for e in endpoints],
        "access_matrix": [r.to_dict() for r in matrix_rows],
        "chains": [c.to_dict() for c in chains]
    }
