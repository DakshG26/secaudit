# EXPLAINED.md — How SecAudit Works

This document explains every module in plain language so you can describe
each part to judges without reading the source code first.

---

## models.py

**What it is**: The shared data language of the whole tool.

This module defines Python dataclasses — simple, typed containers for data.
Every other module either creates objects from these classes or reads them.

- `Finding` — one security problem found. Has an ID, the rule that found it, OWASP/CWE tags, severity, confidence, where it is (`file.py:42` or a URL), the evidence snippet, the impact, the fix, and a code example.
- `Endpoint` — one HTTP route found in the code. Has the method (GET/POST), path (`/admin`), the handler function name, where it's defined, any path parameters, inputs it reads from the request, and auth decorators.
- `PolicyRule` — one line from `policy.yml`: "path X must require Y".
- `AccessMatrixRow` — one row in the access matrix: route, what the policy says, what the code actually does, and whether that's OK, a violation, or weaker-than-required.
- `AttackChain` — a named combination of findings that together enable a worse attack than either part alone.
- `ScanResult` — the complete output of a scan. Contains all findings, the endpoint inventory, the access matrix, chains, and severity counts.

---

## inventory.py

**What it is**: The "map reader" that finds every HTTP endpoint in the code.

Uses Python's built-in `ast` module to parse source files into an Abstract Syntax Tree (AST) — a structured representation of the code as a tree of nodes. It never executes the code; it only reads and analyses the tree.

**How it works, step by step**:
1. Open a `.py` file and call `ast.parse()` to turn it into a tree.
2. Walk every node in the tree looking for function definitions (`FunctionDef` / `AsyncFunctionDef`).
3. For each function, look at its `decorator_list` (decorators are applied above the function with `@`).
4. If a decorator is a `@app.route(...)` call, extract the path and HTTP methods from its arguments.
5. If a decorator is a `@router.get(...)` / `@router.post(...)` call (FastAPI), extract the method from the decorator name and the path from its arguments.
6. Check whether any other decorators are known auth guards (`login_required`, `jwt_required`, etc.).
7. Walk the function body to find `request.args.get()` / `request.form.get()` calls to list what inputs the handler reads.

The result is a list of `Endpoint` objects — a complete inventory of the app's surface.

---

## engine.py

**What it is**: The rule loader and scan orchestrator.

The engine does two things:
1. **Load rules**: reads every `.yml` file in the `rules/` directory and returns a list of rule dicts. Adding a new rule file automatically adds a new check — no code changes needed.
2. **Dispatch rules**: for each rule, calls the right checker based on the `type` field.

**Rule types**:
- `regex` — compiles the rule's `pattern` and scans every matching file line by line. If the pattern matches, a Finding is created. For `A04-SECRET-001`, it also computes Shannon entropy (a measure of randomness) to distinguish real secrets from placeholder strings.
- `route` — takes the endpoint inventory and applies logic specific to that rule. For example, `A01-NOAUTH-001` looks for endpoints whose path contains "admin" with no auth decorator.
- `deps` — parses `requirements.txt` files and flags lines without a `==` version pin.
- `pypi` — (only with `--check-pypi`) queries the PyPI JSON API to see if each package name actually exists.
- `http` — delegated to `probes.py` for live network checks.

**Shannon entropy** (used for secret detection): a number from 0 (all same character) to log₂(charset size) (fully random). A random API key like `sk-a9f2e8...` has high entropy (≥3.5 bits/char). The word "password" has low entropy. The engine uses this to avoid flagging `SECRET_KEY = "change-me"` as a confirmed secret.

**Ignore support**: before creating a Finding, the engine checks two things:
1. Is the rule ID in the `.secauditignore` file (loaded at start)?
2. Does the specific source line contain `# secaudit: ignore RULE-ID`?
If either is true, the finding is created but marked `ignored=True`. It still appears in the report in a separate "Ignored" section.

---

## policy.py

**What it is**: The access control policy engine — SecAudit's main differentiator.

**How it works**:
1. Load `policy.yml` which declares what authentication level each route must have (e.g. `/admin → admin`, `/login → public`).
2. For each detected endpoint, use `fnmatch` glob matching to find the most specific policy rule that covers it. `/admin/users` is matched by `/admin/*`.
3. Determine the "actual" auth level from the endpoint's decorators: `admin_required` → admin, `login_required` → authenticated, no decorators → none.
4. Compare expected vs actual using a hierarchy: public < authenticated < owner < admin.
5. Produce a status: `OK`, `VIOLATION` (actual is "none" but something is required), `WEAKER` (actual is weaker than expected), or `UNCOVERED` (no policy rule covers this route).

The result is a list of `AccessMatrixRow` objects shown as a table in the report.

---

## probes.py

**What it is**: The safe HTTP engine — everything that touches the network.

This is the most safety-critical module. All safety invariants are concentrated here and tested in `tests/test_safety.py`.

**Safety rules enforced in code**:
- `validate_url(url)` — parses the URL host and raises `SecurityError` if it's not `localhost`, `127.0.0.1`, or `::1`. This is called before every single network request.
- `_safe_request(method, url)` — checks that the method is in `{GET, HEAD, OPTIONS}` before sending, raises `SecurityError` otherwise. Also hooks into redirects to refuse any redirect to a non-localhost host.
- `_write_audit_log(...)` — appends one JSON line to `audit_log.jsonl` for every request sent.
- A 1-second delay is injected between requests to avoid rate-limiting the target.

**Live confirmation**: for each A01-NOAUTH or A02-EXPOSEDPATHS finding, the module sends one GET to the suspected URL. If the response is HTTP 200 with a non-empty body, the finding's `confidence` is upgraded to `"confirmed"` and the response excerpt is appended to `evidence`.

**PyPI check** (`check_pypi_packages`): this is the only function allowed to make external network calls, and only when `--check-pypi` is explicitly passed. It queries `https://pypi.org/pypi/{package}/json` — a 404 means the package doesn't exist.

---

## chains.py

**What it is**: The attack chain combiner.

Defines a list of `CHAIN_DEFINITIONS` — each is a dict naming a combination of rule IDs that together enable a worse attack.

**How it works**:
1. Build a set of all `rule_id` values from the active (non-ignored) findings.
2. For each chain definition, check if ALL its `requires` rule IDs are in that set.
3. If yes, create an `AttackChain` with the `finding_ids` of each component, and the chain's elevated `severity`.

Example chain: `A01-NOAUTH-001` + `A05-SQL-001` → "Full Database Takeover" at severity `critical`. Even if both individual findings were rated `medium`, the chain is `critical` because combined they enable full database access.

---

## compare.py

**What it is**: The before/after diff engine.

Reads two JSON scan reports (produced by `secaudit scan --json`) and computes which findings were fixed, which are still open, and which are newly introduced.

**Key design**: findings are matched by a "key" that is `rule_id + file_path` (without the line number). This means a finding that moved from line 42 to line 45 during a refactor is still counted as "still open" rather than "fixed + reintroduced".

**Output**: a dict with `fixed`, `still_open`, `new`, `fix_percent`, and a `summary` string. The CLI prints this as a diff-style table.

---

## report/html.py

**What it is**: The HTML report renderer.

Uses Jinja2 to render a single, self-contained HTML file with all CSS inlined. The template (`REPORT_TEMPLATE`) is embedded as a Python string.

**Sections rendered**:
1. Executive Summary — severity counts in coloured cards
2. Endpoint Inventory — table, with unprotected routes highlighted in red
3. Access Control Matrix — table, with violations in red and WEAKER in amber
4. Attack Chains — orange bordered cards with the attack narrative
5. Findings — grouped by OWASP category, each with evidence and a code fix
6. Ignored Findings — listed transparently so the reviewer knows they exist
7. OWASP Coverage — grid showing which OWASP categories had findings
8. Appendix — the severity formula and a limitations section

---

## report/json_export.py

**What it is**: Serialises the `ScanResult` to a JSON file.

Calls `result.to_dict()` which recursively converts all dataclasses to plain dicts, then writes the result as pretty-printed JSON. This JSON is consumed by `secaudit compare`.

---

## report/sarif.py

**What it is**: Exports findings as SARIF 2.1.0 (Static Analysis Results Interchange Format).

SARIF is a standard used by GitHub Advanced Security, VS Code, and CI tools to display security findings. The exporter:
1. Collects one "rule" descriptor per unique `rule_id` (deduplicating across findings).
2. Maps each finding to a SARIF `result` with level (`error`/`warning`/`note`), message, and physical location.
3. Wraps everything in the SARIF envelope (`$schema`, `version`, `runs`).

---

## cli.py

**What it is**: The command-line interface.

Built with Click, which turns Python functions into CLI commands. There are four commands:

- `secaudit scan <path>` — the main command. Runs inventory → static rules → (optional) live probes → policy comparison → chain detection → report generation. Exits with code 1 if critical or high findings exist.
- `secaudit inventory <path>` — prints the endpoint inventory table only.
- `secaudit compare before.json after.json` — runs the diff engine and prints the comparison table.
- `secaudit rules` — lists all loaded rule files in a formatted table.

The CLI is the only entry point that checks for `--i-own-this-target` and calls `validate_url()` before any live probe is attempted.

---

## rules/ (YAML files)

**What they are**: The security knowledge base.

Each `.yml` file defines one rule. The engine loads all files automatically — adding a new rule requires no code changes, only a new YAML file.

**Mandatory fields**: `id`, `title`, `owasp`, `cwe`, `severity`, `confidence`, `type`, `impact`, `fix`.
**Optional fields**: `pattern` (regex), `file_extensions`, `entropy_threshold`, `probe_paths`, `sensitive_path_patterns`, etc.

The rule's `type` field tells the engine which checker to use. This separation of data from logic is the key architectural decision that makes SecAudit extensible.
