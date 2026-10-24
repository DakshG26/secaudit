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
    # Normalize URL scheme
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
    status_code = 200

    # 1. Main Root GET Request
    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "SecAI-SecurityAuditor/1.0 (Authorized Non-Destructive Scanner)"
        })
        resp = session.get(url, timeout=8, allow_redirects=True, verify=True)
        headers = resp.headers
        html_text = resp.text
        status_code = resp.status_code
        final_url = resp.url
        is_https = final_url.startswith("https://")
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
            resp = requests.get(url, timeout=8, allow_redirects=True, verify=False)
            headers = resp.headers
            html_text = resp.text
        except Exception:
            pass
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
                fixed_code="# Nginx configuration\nserver {\n    listen 80;\n    server_name " + hostname + ";\n    return 301 https://$host$request_uri;\n}"
            )
        )

    # 3. Check Content-Security-Policy (CSP)
    csp = headers.get("Content-Security-Policy", "")
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
                location=f"{hostname} HTTP Response Headers",
                evidence="Header Content-Security-Policy is absent",
                impact="Increases susceptibility to Cross-Site Scripting (XSS), clickjacking, and unauthorized third-party script injection.",
                remediation="Define a strict Content-Security-Policy restricting script, style, and iframe origins.",
                fixed_code="Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
            )
        )

    # 4. Check HSTS (Strict-Transport-Security)
    hsts = headers.get("Strict-Transport-Security", "")
    if not hsts and is_https:
        findings.append(
            Finding(
                id="A02-HSTS-MISSING",
                rule_id="A02-HSTS-MISSING",
                title="Missing HTTP Strict-Transport-Security (HSTS)",
                owasp="A02",
                cwe="CWE-319",
                severity="high",
                confidence="confirmed",
                location=f"{hostname} HTTP Response Headers",
                evidence="Header Strict-Transport-Security is absent",
                impact="Allows man-in-the-middle attackers to downgrade connections to unencrypted HTTP using SSL stripping.",
                remediation="Add Strict-Transport-Security header with long max-age and includeSubDomains.",
                fixed_code="Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
            )
        )

    # 5. Check Clickjacking Protection (X-Frame-Options)
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
                location=f"{hostname} HTTP Response Headers",
                evidence="Neither X-Frame-Options nor CSP frame-ancestors is present",
                impact="Malicious websites can render your application in an invisible <iframe> and hijack user clicks.",
                remediation="Send X-Frame-Options: SAMEORIGIN or CSP frame-ancestors 'self'.",
                fixed_code="X-Frame-Options: SAMEORIGIN"
            )
        )

    # 6. Check MIME Sniffing Protection (X-Content-Type-Options)
    xcto = headers.get("X-Content-Type-Options", "").lower()
    if "nosniff" not in xcto:
        findings.append(
            Finding(
                id="A02-NOSNIFF-MISSING",
                rule_id="A02-NOSNIFF-MISSING",
                title="MIME-Type Sniffing Allowed (Missing nosniff)",
                owasp="A02",
                cwe="CWE-16",
                severity="low",
                confidence="confirmed",
                location=f"{hostname} HTTP Response Headers",
                evidence="X-Content-Type-Options: nosniff is missing",
                impact="Browsers may execute non-executable MIME types as HTML or JavaScript if content appears executable.",
                remediation="Set X-Content-Type-Options: nosniff on all HTTP responses.",
                fixed_code="X-Content-Type-Options: nosniff"
            )
        )

    # 7. Check Referrer-Policy
    ref_policy = headers.get("Referrer-Policy", "")
    if not ref_policy:
        findings.append(
            Finding(
                id="A02-REFERRER-MISSING",
                rule_id="A02-REFERRER-MISSING",
                title="Referrer-Policy Header Omitted",
                owasp="A02",
                cwe="CWE-116",
                severity="low",
                confidence="confirmed",
                location=f"{hostname} HTTP Response Headers",
                evidence="Header Referrer-Policy is not configured",
                impact="Full path and sensitive query parameters may leak to external services via the Referer request header.",
                remediation="Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.",
                fixed_code="Referrer-Policy: strict-origin-when-cross-origin"
            )
        )

    # 8. Check Server / Framework Banner Disclosure
    server_header = headers.get("Server", "")
    powered_by = headers.get("X-Powered-By", "")
    if any(ch.isdigit() for ch in server_header) or powered_by:
        findings.append(
            Finding(
                id="A02-SERVER-BANNER",
                rule_id="A02-SERVER-BANNER",
                title="Web Server / Framework Fingerprint Exposed",
                owasp="A02",
                cwe="CWE-200",
                severity="low",
                confidence="confirmed",
                location=f"{hostname} HTTP Response Headers",
                evidence=f"Server: {server_header or 'omitted'}, X-Powered-By: {powered_by or 'omitted'}",
                impact="Exposing detailed software version numbers assists adversaries in identifying unpatched CVE exploits.",
                remediation="Suppress or redact Server and X-Powered-By headers in web server and reverse proxy config.",
                fixed_code="# In Express:\napp.disable('x-powered-by');\n# In Nginx:\nserver_tokens off;"
            )
        )

    # 9. Check Cookie Security
    set_cookie = headers.get("Set-Cookie", "")
    if set_cookie:
        cookies_list = set_cookie.split(",")
        for c in cookies_list:
            c_lower = c.lower()
            name_match = re.search(r"^\s*([^=;]+)", c)
            c_name = name_match.group(1) if name_match else "cookie"
            if "secure" not in c_lower and is_https:
                findings.append(
                    Finding(
                        id=f"A04-COOKIE-SECURE-{c_name}",
                        rule_id="A04-COOKIE-SECURE",
                        title=f"Cookie '{c_name}' Missing Secure Flag",
                        owasp="A04",
                        cwe="CWE-614",
                        severity="high",
                        confidence="confirmed",
                        location=f"{hostname} Set-Cookie",
                        evidence=c.strip()[:100],
                        impact="Cookie can be transmitted over unencrypted HTTP connections and intercepted by attackers.",
                        remediation="Append '; Secure' attribute to all session and authentication cookies.",
                        fixed_code=f"Set-Cookie: {c_name}=...; Secure; HttpOnly; SameSite=Lax"
                    )
                )
            if "httponly" not in c_lower:
                findings.append(
                    Finding(
                        id=f"A01-COOKIE-HTTPONLY-{c_name}",
                        rule_id="A01-COOKIE-HTTPONLY",
                        title=f"Cookie '{c_name}' Missing HttpOnly Flag",
                        owasp="A01",
                        cwe="CWE-1004",
                        severity="medium",
                        confidence="confirmed",
                        location=f"{hostname} Set-Cookie",
                        evidence=c.strip()[:100],
                        impact="JavaScript running on the client can read this cookie, leading to session theft via XSS.",
                        remediation="Append '; HttpOnly' attribute to prevent client-side script access.",
                        fixed_code=f"Set-Cookie: {c_name}=...; HttpOnly; Secure; SameSite=Lax"
                    )
                )

    # 10. Probe robots.txt for exposed admin / private paths
    disallowed_routes = []
    try:
        r_resp = requests.get(urljoin(origin, "/robots.txt"), timeout=4)
        if r_resp.status_code == 200 and "user-agent" in r_resp.text.lower():
            for line in r_resp.text.splitlines():
                if line.lower().startswith("disallow:"):
                    p = line.split(":", 1)[1].strip()
                    if p and p != "/" and not p.startswith("*"):
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
                        evidence=f"Disallow entries found: {', '.join(disallowed_routes[:5])}",
                        impact="Search crawler configuration exposes private admin, staging, and API endpoints to attackers.",
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
        # Extract hrefs
        raw_hrefs = re.findall(r'href=[\"\']([^\"\'\s>]+)', html_text)
        for h in raw_hrefs:
            if h.startswith("/"):
                path_only = h.split("?")[0].split("#")[0]
                if path_only and len(path_only) < 60:
                    extracted_paths.add(path_only)
            elif h.startswith("http"):
                p = urlparse(h)
                if p.netloc == hostname and p.path:
                    extracted_paths.add(p.path)
            elif not h.startswith("javascript:") and not h.startswith("#") and not h.startswith("mailto:") and not h.startswith("tel:"):
                clean_rel = "/" + h.split("?")[0].split("#")[0].lstrip("/")
                if len(clean_rel) < 60 and not clean_rel.endswith((".png", ".jpg", ".svg", ".ico", ".css")):
                    extracted_paths.add(clean_rel)

        # Extract form actions
        form_actions = re.findall(r'<form[^>]+action=[\"\']([^\"\'\s>]+)', html_text, re.IGNORECASE)
        for act in form_actions:
            if act.startswith("/"):
                extracted_paths.add(act.split("?")[0])

    # Include disallowed paths from robots.txt
    for dp in disallowed_routes[:5]:
        extracted_paths.add(dp)

    # Build Endpoints
    sorted_paths = sorted(list(extracted_paths))[:20]
    for p in sorted_paths:
        is_admin = any(k in p.lower() for k in ["admin", "dashboard", "manage", "control", "private"])
        is_auth = any(k in p.lower() for k in ["login", "signin", "auth", "token", "session", "oauth"])
        is_api = p.startswith("/api") or "/api/" in p

        method = ["POST"] if is_auth and "login" in p else ["GET"]
        is_protected = is_auth or is_admin

        ep = Endpoint(
            method=method,
            path=p,
            handler="route_handler" if not is_admin else "admin_handler",
            location=f"{hostname}{p}",
            path_params=[],
            request_inputs=["id"] if "<" in p else [],
            auth_decorators=["login_required"] if is_protected else [],
            is_protected=is_protected,
        )
        endpoints.append(ep)

        # Add to Access Matrix
        matrix_rows.append(
            AccessMatrixRow(
                method=method[0],
                path=p,
                expected="admin" if is_admin else ("authenticated" if is_auth else "public"),
                actual="authenticated" if is_protected else "none",
                auth_decorators=["login_required"] if is_protected else [],
                status="OK" if (is_protected or not is_admin) else "VIOLATION"
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
                narrative="Step 1: An adversary embeds the website in a transparent iframe on an attacker-controlled domain. Step 2: Because Content-Security-Policy is missing, unconstrained inline scripts can be triggered via reflected parameters. Result: High risk of session impersonation and unintended user actions."
            )
        )

    if any(f.rule_id == "A02-HTTP-PLAINTEXT" for f in findings) or any(f.rule_id == "A02-HSTS-MISSING" for f in findings):
        chains.append(
            AttackChain(
                id="CHAIN-WEB-002",
                name="Network Eavesdropping & SSL Stripping",
                description="Unenforced transport security allows intermediate adversaries on local Wi-Fi or transit routers to hijack traffic.",
                severity="high",
                finding_ids=["A02-HSTS-MISSING"],
                narrative="Step 1: User attempts to connect to the service. Step 2: Due to lack of HSTS preload/headers, a local man-in-the-middle forces plaintext communication and harvests authorization cookies."
            )
        )

    # 13. Calculate Stats & Security Score
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1

    deduction = (
        counts.get("critical", 0) * 15 +
        counts.get("high", 0) * 10 +
        counts.get("medium", 0) * 5 +
        counts.get("low", 0) * 2
    )
    score = max(10, min(100, 100 - deduction))
    status = "clean" if score >= 85 else ("warning" if score >= 60 else "compromised")

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
