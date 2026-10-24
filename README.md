# SecAudit

**Authorized, non-destructive security auditor for AI-generated web applications.**

SecAudit finds exposed endpoints, weak input validation, and missing access controls in Flask/FastAPI apps. It maps every finding to OWASP Top 10:2025 and a CWE ID, shows evidence, severity, and practical fixes, and never attacks anything.

---

## Quick Start

```bash
pip install -e ".[dev]"

# Static scan only
secaudit scan demo_app/ --policy demo_app/policy.yml --out report.html --json report.json --sarif report.sarif

# List endpoint inventory
secaudit inventory demo_app/

# With live probes (localhost only, requires --i-own-this-target)
secaudit scan demo_app/ --url http://localhost:5000 --i-own-this-target --policy demo_app/policy.yml

# Compare before and after a fix
secaudit scan demo_app/       --json before.json
secaudit scan demo_app_fixed/ --json after.json
secaudit compare before.json after.json

# List all rules
secaudit rules
```

### Web dashboard

The Vite/React dashboard is in `web/`. Install its locked dependencies and
start the development server with:

```bash
cd web
npm ci
npm run dev
```

Open `http://localhost:5173`. The dashboard starts in Demo Mode when the
optional local API gateway is not running, so the UI can be reviewed without
starting a target application. To verify a production bundle instead, run
`npm run build` (or preview the generated bundle with `npm run preview`).

---

## Features

| Feature | Description |
|---------|-------------|
| **Endpoint Inventory** | AST-based extraction of every Flask/FastAPI route with method, path, handler, auth decorators, path params |
| **22 Data-Driven Rules** | One YAML file per rule — add rules with no code changes |
| **Access Control Policy** | `policy.yml` declares what auth each route must have; SecAudit reports every violation |
| **Access Matrix** | Route × expected × actual table in the HTML report |
| **Live Confirmation** | Safe GET/HEAD probes to localhost; upgrades confidence to "confirmed" on HTTP 200 |
| **Attack Chains** | Combines related findings into named multi-step attacks with elevated severity |
| **Before/After Compare** | Tracks remediation progress between two scan reports |
| **Severity Formula** | `impact × exploitability × confidence_multiplier`, documented in report appendix |
| **Ignore Support** | `.secauditignore` + inline `# secaudit: ignore RULE-ID` comments |
| **HTML + JSON + SARIF** | Self-contained offline HTML report, machine-readable JSON, GitHub-compatible SARIF |

---

## Planted Flaws (demo_app)

The demo app contains exactly 12 intentional vulnerabilities:

| # | Flaw | Rule ID | OWASP | Severity |
|---|------|---------|-------|----------|
| 1 | `/admin` route, no auth decorator | A01-NOAUTH-001 | A01 | Critical |
| 2 | IDOR: `/user/<id>` no ownership check | A01-IDOR-001 | A01 | High |
| 3 | SQL injection via f-string | A05-SQL-001 | A05 | Critical |
| 4 | `SECRET_KEY = "hardcoded-..."` | A04-SECRET-001 | A04 | High |
| 5 | MD5 for password hashing | A04-WEAKHASH-001 | A04 | High |
| 6 | `app.run(debug=True)` | A02-DEBUG-001 | A02 | High |
| 7 | Stack trace returned to client | A10-STACKTRACE-001 | A10 | Medium |
| 8 | CORS `*` with credentials | A01-CORS-001 | A01 | High |
| 9 | Unpinned `flask` in requirements.txt | A03-UNPINNED-001 | A03 | Low |
| 10 | `eval(user_input)` | A05-EXEC-001 | A05 | Critical |
| 11 | No logging on failed login | A09-NOLOG-001 | A09 | Medium |
| 12 | JWT `algorithm="none"` | A04-JWT-001 | A04 | Critical |

---

## Rules

22 YAML-driven rules, one per file in `rules/`:

| Rule ID | Title | OWASP | CWE |
|---------|-------|-------|-----|
| A01-NOAUTH-001 | Route with No Authentication | A01 | CWE-306 |
| A01-IDOR-001 | Insecure Direct Object Reference | A01 | CWE-639 |
| A01-CORS-001 | CORS Wildcard with Credentials | A01 | CWE-942 |
| A01-TODO-001 | TODO/FIXME Auth Marker | A01 | CWE-862 |
| A01-COMMENTED-AUTH-001 | Commented-Out Auth Check | A01 | CWE-862 |
| A02-DEBUG-001 | Flask Debug Mode Enabled | A02 | CWE-94 |
| A02-DEFAULTCRED-001 | Default/Weak Credentials | A02 | CWE-1392 |
| A02-SECHEADERS-001 | Missing Security Headers | A02 | CWE-693 |
| A02-COOKIEFLAGS-001 | Insecure Cookie Flags | A02 | CWE-614 |
| A02-EXPOSEDPATHS-001 | Sensitive Path Exposed | A02 | CWE-538 |
| A03-UNPINNED-001 | Unpinned Dependencies | A03 | CWE-1104 |
| A03-PYPI-001 | Hallucinated PyPI Package | A03 | CWE-1357 |
| A04-SECRET-001 | Hardcoded Secret / API Key | A04 | CWE-798 |
| A04-WEAKHASH-001 | MD5/SHA1 for Passwords | A04 | CWE-916 |
| A04-JWT-001 | JWT algorithm=none / No Verification | A04 | CWE-347 |
| A05-SQL-001 | SQL Injection via String Formatting | A05 | CWE-89 |
| A05-EXEC-001 | eval/exec/os.system Call | A05 | CWE-78 |
| A05-XSS-001 | XSS via innerHTML/dangerouslySetInnerHTML | A05 | CWE-79 |
| A05-NOINPUT-001 | Missing Input Validation | A05 | CWE-20 |
| A09-NOLOG-001 | No Logging on Failed Login | A09 | CWE-778 |
| A10-STACKTRACE-001 | Stack Trace Returned to Client | A10 | CWE-209 |

---

## Access Control Policy

Create a `policy.yml` to declare what authentication level each route must have:

```yaml
routes:
  - path: "/admin"
    requires: admin
  - path: "/user/<id>"
    requires: owner
  - path: "/login"
    requires: public
  - path: "/api/data"
    requires: authenticated
```

SecAudit compares this policy to the detected endpoints and reports:
- `VIOLATION` — route needs auth but has none
- `WEAKER` — route has weaker auth than required
- `UNCOVERED` — route not mentioned in the policy

---

## Attack Chains

| Chain ID | Name | Components | Elevated Severity |
|----------|------|------------|-------------------|
| CHAIN-001 | Full Database Takeover | A01-NOAUTH + A05-SQL | Critical |
| CHAIN-002 | Remote Code Execution via Open Admin | A01-NOAUTH + A05-EXEC | Critical |
| CHAIN-003 | Authentication Bypass via JWT Forgery | A04-JWT + A01-NOAUTH | Critical |
| CHAIN-004 | Credential Harvest via Debug Console | A02-DEBUG + A04-SECRET | Critical |
| CHAIN-005 | IDOR + Weak Hash = Account Takeover | A01-IDOR + A04-WEAKHASH | Critical |

---

## Severity Formula

```
adjusted = impact_score × exploitability_score × confidence_multiplier

impact_score:          critical=4, high=3, medium=2, low=1
exploitability_score:  trivial=1.0, easy=0.75, moderate=0.5, hard=0.25
confidence_multiplier: confirmed=1.0, likely=0.85, possible=0.65

adjusted ≥ 3.5 → critical | ≥ 2.5 → high | ≥ 1.5 → medium | else → low
```

---

## Safety Rules

SecAudit is designed to be **harmless**:

- Static analysis is read-only. The target's code is **never executed**.
- Live probes send only `GET`, `HEAD`, and `OPTIONS`. No `POST`, `PUT`, `DELETE`, or `PATCH`.
- Only `localhost`, `127.0.0.1`, and `::1` are allowed. Every other host is refused.
- `--i-own-this-target` is required before any live probe.
- Every request is logged to `audit_log.jsonl`.
- The only external network call is the optional PyPI hallucination check (`--check-pypi`).

---

## Project Structure

```
secaudit/       Core Python package
├── cli.py          Click CLI (scan, inventory, compare, rules)
├── models.py       Dataclasses (Finding, Endpoint, Chain, etc.)
├── engine.py       Rule loader + scan orchestrator
├── inventory.py    AST-based route extractor
├── policy.py       Policy loader + access matrix builder
├── probes.py       Safe HTTP probes + safety enforcement
├── chains.py       Attack chain combiner
├── compare.py      Before/after JSON diff
└── report/
    ├── html.py         Self-contained HTML report (Jinja2)
    ├── json_export.py  JSON serialiser
    └── sarif.py        SARIF 2.1.0 export

rules/          One YAML file per rule (22 rules)
tests/          pytest test suite
demo_app/       Intentionally vulnerable Flask app (12 flaws)
demo_app_fixed/ Patched version (zero critical/high findings)
```

---

## Limitations

- **Flask/FastAPI focus**: Route inventory uses AST parsing tuned for Flask `@app.route` and FastAPI decorators. Django and Express are partially supported via regex only.
- **Regex false positives**: Pattern-based rules may flag test files, documentation strings, or comments that contain vulnerable-looking code snippets.
- **No runtime taint analysis**: SecAudit cannot trace data flow across function boundaries. A SQL injection hidden inside a helper function called from a route handler may not be detected.
- **Static IDOR detection is limited**: Ownership checks implemented via non-standard logic (custom decorators, business-layer checks) will appear as IDOR findings.
- **Live probes require a running app**: HTTP rules (`A02-SECHEADERS-001`, `A02-EXPOSEDPATHS-001`, etc.) only fire when `--url` is provided.
- **No authenticated testing**: All live probes are unauthenticated. Vulnerabilities behind a login wall are not probed.

---

## Running Tests

```bash
pip install -e ".[dev]"
pytest tests/ -v --tb=short
```

Expected: all tests pass, recall = 100%.

---

## CREDITS

This project studied the following open-source scanners for design inspiration.
No code or rule text was copied. Ideas that were directly influenced are noted below.

| Repo | Author | License | Commit | Influence |
|------|--------|---------|--------|-----------|
| [vibesec](https://github.com/AyushkhatiDev/vibesec) | Ayush Khati | MIT | `ae0a130` | Flask-focused scanner concept; surrounding-line auth indicator check pattern (reimplemented independently) |
| [vibeward](https://github.com/JSiapoDEV/vibeward) | José Siapo (jsiapo.dev) | MIT | `ab57290` | SARIF 2.1.0 output structure; principle of separating security findings from quality findings |

---

## Reference Repo Commit Hashes

| Repo | Commit |
|------|--------|
| vibesec (`github.com/AyushkhatiDev/vibesec`) | `ae0a130` |
| vibeward (`github.com/JSiapoDEV/vibeward`) | `ab57290` |
