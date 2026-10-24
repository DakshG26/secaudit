"""
report/html.py — Self-contained offline HTML report generator.

Renders a complete HTML report using Jinja2 with all CSS and JS inlined.
The output is a single file that works without internet access.

Sections:
  1. Executive Summary (severity counts, risk score)
  2. Endpoint Inventory (table with protected/unprotected highlighted)
  3. Access Control Matrix (policy violations highlighted)
  4. Attack Chains (named multi-finding chains with narratives)
  5. Findings (grouped by OWASP category, with evidence and fixes)
  6. Ignored Findings (suppressed items, listed for transparency)
  7. OWASP Coverage (which categories had findings)
  8. Appendix: Severity Formula, Limitations
"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from jinja2 import Environment, BaseLoader

from secaudit.models import ScanResult

# ---------------------------------------------------------------------------
# Severity colour mapping
# ---------------------------------------------------------------------------

SEVERITY_COLORS = {
    "critical": "#dc2626",
    "high": "#ea580c",
    "medium": "#d97706",
    "low": "#65a30d",
    "info": "#3b82f6",
}

STATUS_COLORS = {
    "VIOLATION": "#dc2626",
    "WEAKER": "#d97706",
    "UNCOVERED": "#6b7280",
    "OK": "#16a34a",
}

# ---------------------------------------------------------------------------
# Jinja2 HTML template
# ---------------------------------------------------------------------------

REPORT_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SecAudit Report — {{ result.target_path }}</title>
<style>
  :root {
    --color-critical: #dc2626;
    --color-high: #ea580c;
    --color-medium: #d97706;
    --color-low: #65a30d;
    --color-info: #3b82f6;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #f8fafc; color: #1e293b; line-height: 1.6; }
  .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
  h1 { font-size: 2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
  h2 { font-size: 1.4rem; font-weight: 600; color: #0f172a; margin: 2rem 0 1rem;
       border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
  h3 { font-size: 1.1rem; font-weight: 600; color: #334155; margin: 1.2rem 0 0.5rem; }
  .subtitle { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    color: white; margin-right: 4px;
  }
  .sev-critical { background: var(--color-critical); }
  .sev-high     { background: var(--color-high); }
  .sev-medium   { background: var(--color-medium); }
  .sev-low      { background: var(--color-low); }
  .sev-info     { background: var(--color-info); }
  .stats-grid { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px;
               padding: 1rem 1.5rem; min-width: 120px; text-align: center; }
  .stat-card .number { font-size: 2rem; font-weight: 700; }
  .stat-card .label  { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; background: white;
          border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
          margin-bottom: 1.5rem; font-size: 0.875rem; }
  th { background: #f1f5f9; text-align: left; padding: 10px 14px;
       font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
  td { padding: 9px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
  .open-route td:first-child { border-left: 3px solid var(--color-critical); }
  .finding-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px;
                  margin-bottom: 1rem; overflow: hidden; }
  .finding-header { padding: 12px 16px; display: flex; align-items: center;
                    gap: 0.5rem; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
  .finding-body { padding: 16px; }
  .finding-body p { margin-bottom: 0.5rem; }
  .finding-body strong { color: #374151; }
  pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 6px;
        overflow-x: auto; font-size: 0.8rem; margin-top: 0.5rem; white-space: pre-wrap; }
  code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
  .tag-owasp { background: #dbeafe; color: #1d4ed8; padding: 2px 6px;
               border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .tag-cwe   { background: #ede9fe; color: #6d28d9; padding: 2px 6px;
               border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .tag-conf  { background: #dcfce7; color: #15803d; padding: 2px 6px;
               border-radius: 4px; font-size: 0.75rem; }
  .tag-conf.possible { background: #fef3c7; color: #b45309; }
  .tag-conf.likely   { background: #dbeafe; color: #1d4ed8; }
  .chain-card { background: #fff7ed; border: 2px solid var(--color-critical);
                border-radius: 8px; padding: 16px; margin-bottom: 1rem; }
  .chain-card h3 { color: var(--color-critical); }
  .violation-row td { background: #fef2f2 !important; }
  .weaker-row   td { background: #fffbeb !important; }
  .uncovered-row td { background: #f9fafb !important; }
  .toc { background: white; border: 1px solid #e2e8f0; border-radius: 8px;
         padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
  .toc a { color: #2563eb; text-decoration: none; display: block; padding: 2px 0; }
  .toc a:hover { text-decoration: underline; }
  .section-anchor { scroll-margin-top: 1rem; }
  .ignored-section { opacity: 0.7; }
  .owasp-coverage { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.75rem; margin-bottom: 1.5rem; }
  .owasp-item { background: white; border: 1px solid #e2e8f0; border-radius: 6px;
                padding: 0.75rem; }
  .owasp-item.has-findings { border-left: 4px solid var(--color-high); }
  .owasp-item .owasp-id { font-weight: 700; font-size: 0.9rem; color: #0f172a; }
  .owasp-item .count { font-size: 0.8rem; color: #64748b; }
  .formula-box { background: #f1f5f9; border-left: 4px solid #3b82f6;
                 padding: 1rem 1.5rem; border-radius: 0 6px 6px 0; margin-bottom: 1rem; }
  .limitations { background: #fff7ed; border: 1px solid #fed7aa;
                 border-radius: 8px; padding: 1rem 1.5rem; }
  .limitations ul { padding-left: 1.2rem; margin-top: 0.5rem; }
  .limitations li { margin-bottom: 0.3rem; }
  footer { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.8rem; margin-top: 2rem; }
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <h1>🔐 SecAudit Security Report</h1>
  <div class="subtitle">
    Target: <strong>{{ result.target_path }}</strong> &nbsp;|&nbsp;
    Scanned: <strong>{{ result.scan_time }}</strong>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <strong>Contents</strong>
    <a href="#summary">Executive Summary</a>
    <a href="#inventory">Endpoint Inventory</a>
    {% if result.access_matrix %}<a href="#matrix">Access Control Matrix</a>{% endif %}
    {% if result.chains %}<a href="#chains">Attack Chains</a>{% endif %}
    <a href="#findings">Findings ({{ active_findings|length }})</a>
     {% if ignored_findings %}<a href="#ignored">Ignored Findings ({{ ignored_findings|length }})</a>{% endif %}
    <a href="#owasp">OWASP Coverage</a>
    <a href="#appendix">Appendix: Formula &amp; Limitations</a>
  </div>

  <!-- 1. Executive Summary -->
  <h2 id="summary" class="section-anchor">Executive Summary</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="number" style="color:var(--color-critical)">{{ result.stats.get('critical', 0) }}</div>
      <div class="label">Critical</div>
    </div>
    <div class="stat-card">
      <div class="number" style="color:var(--color-high)">{{ result.stats.get('high', 0) }}</div>
      <div class="label">High</div>
    </div>
    <div class="stat-card">
      <div class="number" style="color:var(--color-medium)">{{ result.stats.get('medium', 0) }}</div>
      <div class="label">Medium</div>
    </div>
     <div class="stat-card">
       <div class="number" style="color:var(--color-low)">{{ result.stats.get('low', 0) }}</div>
       <div class="label">Low</div>
     </div>
     <div class="stat-card">
       <div class="number" style="color:var(--color-info)">{{ result.stats.get('info', 0) }}</div>
       <div class="label">Info</div>
     </div>
    <div class="stat-card">
      <div class="number">{{ active_findings|length }}</div>
      <div class="label">Total Active</div>
    </div>
    <div class="stat-card">
      <div class="number">{{ result.chains|length }}</div>
      <div class="label">Attack Chains</div>
    </div>
  </div>
  {% if result.stats.get('critical', 0) > 0 or result.stats.get('high', 0) > 0 %}
  <p style="color:var(--color-critical); font-weight:600; margin-bottom:1rem;">
    ⚠ Exit code 1: Critical or High findings detected. Remediation required before production deployment.
  </p>
  {% endif %}

  <!-- 2. Endpoint Inventory -->
  <h2 id="inventory" class="section-anchor">Endpoint Inventory</h2>
  {% if result.endpoints %}
  <table>
    <tr>
       <th>Method</th><th>Path</th><th>Handler</th><th>Auth Decorators</th>
       <th>Path Params</th><th>Request Inputs</th><th>Protected</th><th>Location</th>
    </tr>
    {% for ep in result.endpoints %}
    <tr class="{{ 'open-route' if not ep.is_protected else '' }}">
      <td><code>{{ ep.method|join(', ') }}</code></td>
      <td><code>{{ ep.path }}</code></td>
      <td><code>{{ ep.handler }}</code></td>
       <td>
         {% if ep.auth_decorators %}{{ ep.auth_decorators|join(', ') }}
         {% else %}<span style="color:#dc2626">none</span>{% endif %}
       </td>
       <td><code>{{ ep.path_params|join(', ') or '—' }}</code></td>
       <td><code>{{ ep.request_inputs|join(', ') or '—' }}</code></td>
      <td>{{ '✅' if ep.is_protected else '❌ OPEN' }}</td>
      <td style="font-size:0.8rem;color:#64748b">{{ ep.location }}</td>
    </tr>
    {% endfor %}
  </table>
  {% else %}
  <p>No endpoints found.</p>
  {% endif %}

  <!-- 3. Access Control Matrix -->
  {% if result.access_matrix %}
  <h2 id="matrix" class="section-anchor">Access Control Matrix</h2>
  <table>
    <tr>
      <th>Method</th><th>Path</th><th>Expected</th><th>Actual</th><th>Auth</th><th>Status</th>
    </tr>
    {% for row in result.access_matrix %}
    {% set row_class = {'VIOLATION':'violation-row','WEAKER':'weaker-row','UNCOVERED':'uncovered-row'}.get(row.status,'') %}
    <tr class="{{ row_class }}">
      <td><code>{{ row.method }}</code></td>
      <td><code>{{ row.path }}</code></td>
      <td>{{ row.expected }}</td>
      <td>{{ row.actual }}</td>
      <td>{{ row.auth_decorators|join(', ') or 'none' }}</td>
      <td>
        {% if row.status == 'VIOLATION' %}<span style="color:var(--color-critical);font-weight:700">❌ VIOLATION</span>
        {% elif row.status == 'WEAKER' %}<span style="color:var(--color-medium);font-weight:700">⚠️ WEAKER</span>
        {% elif row.status == 'UNCOVERED' %}<span style="color:#6b7280;font-weight:700">？ UNCOVERED</span>
        {% else %}<span style="color:var(--color-low);font-weight:700">✅ OK</span>{% endif %}
      </td>
    </tr>
    {% endfor %}
  </table>
  {% endif %}

  <!-- 4. Attack Chains -->
  {% if result.chains %}
  <h2 id="chains" class="section-anchor">Attack Chains</h2>
  <p style="margin-bottom:1rem;color:#64748b">
    These chains combine multiple findings into higher-impact attack scenarios.
    Each chain's severity is elevated above its individual components.
  </p>
  {% for chain in result.chains %}
  <div class="chain-card">
    <h3>⛓ [{{ chain.id }}] {{ chain.name }}
      <span class="badge sev-{{ chain.severity }}" style="margin-left:0.5rem">{{ chain.severity }}</span>
    </h3>
    <p style="margin-top:0.5rem;color:#374151">{{ chain.description }}</p>
    <h3 style="margin-top:1rem;font-size:0.9rem">Attack narrative:</h3>
    <p style="color:#374151;margin-top:0.25rem">{{ chain.narrative }}</p>
    <p style="margin-top:0.75rem;font-size:0.85rem;color:#64748b">
      Component findings: {{ chain.finding_ids|join(', ') }}
    </p>
  </div>
  {% endfor %}
  {% endif %}

  <!-- 5. Findings -->
  <h2 id="findings" class="section-anchor">Findings ({{ active_findings|length }} active)</h2>

   {% set owasp_map = {
     'A01': 'Broken Access Control',
     'A02': 'Security Misconfiguration',
     'A03': 'Software Supply Chain Failures',
     'A04': 'Cryptographic Failures',
     'A05': 'Injection',
     'A06': 'Vulnerable Components',
     'A07': 'Auth & Identity Failures',
     'A08': 'Software & Data Integrity',
     'A09': 'Logging & Alerting Failures',
     'A10': 'Mishandling Exceptional Conditions'
   } %}
   {% for owasp, owasp_name in owasp_map.items() %}
     {% set cat_findings = active_findings|selectattr('owasp','equalto',owasp)|list %}
     {% if cat_findings %}
     <h3>{{ owasp }} — {{ owasp_name }}
      ({{ cat_findings|length }} finding{{ 's' if cat_findings|length != 1 else '' }})
    </h3>
    {% for f in cat_findings|sort(attribute='severity') %}
    <div class="finding-card">
      <div class="finding-header">
        <span class="badge sev-{{ f.severity }}">{{ f.severity }}</span>
        <strong>{{ f.title }}</strong>
        <span class="tag-owasp">{{ f.owasp }}</span>
        <span class="tag-cwe">{{ f.cwe }}</span>
        <span class="tag-conf {{ f.confidence }}">{{ f.confidence }}</span>
        <span style="font-size:0.8rem;color:#94a3b8;margin-left:auto">{{ f.id }}</span>
      </div>
      <div class="finding-body">
        <p><strong>Location:</strong> <code>{{ f.location }}</code></p>
        <p><strong>Evidence:</strong></p>
        <pre><code>{{ f.evidence }}</code></pre>
        <p style="margin-top:0.75rem"><strong>Impact:</strong> {{ f.impact }}</p>
        <p style="margin-top:0.5rem"><strong>Remediation:</strong> {{ f.remediation }}</p>
        {% if f.fixed_code %}
        <p style="margin-top:0.75rem"><strong>Code fix example:</strong></p>
        <pre><code>{{ f.fixed_code }}</code></pre>
        {% endif %}
      </div>
    </div>
    {% endfor %}
    {% endif %}
  {% endfor %}

  <!-- 6. Ignored Findings -->
   {% if ignored_findings %}
   <div class="ignored-section">
   <h2 id="ignored" class="section-anchor">Ignored Findings ({{ ignored_findings|length }})</h2>
  <p style="color:#64748b;margin-bottom:1rem">
    These findings were suppressed by .secauditignore or inline comment. Listed for transparency.
  </p>
  <table>
    <tr><th>ID</th><th>Rule</th><th>Title</th><th>Location</th><th>Reason</th></tr>
     {% for f in ignored_findings %}
    <tr>
      <td>{{ f.id }}</td>
      <td>{{ f.rule_id }}</td>
      <td>{{ f.title }}</td>
      <td><code>{{ f.location }}</code></td>
      <td>{{ f.ignore_reason }}</td>
    </tr>
    {% endfor %}
  </table>
  </div>
  {% endif %}

  <!-- 7. OWASP Coverage -->
  <h2 id="owasp" class="section-anchor">OWASP Top 10:2025 Coverage</h2>
  <div class="owasp-coverage">
    {% set owasp_map = {
      'A01': 'Broken Access Control',
      'A02': 'Security Misconfiguration',
      'A03': 'Software Supply Chain Failures',
      'A04': 'Cryptographic Failures',
      'A05': 'Injection',
      'A06': 'Vulnerable Components',
      'A07': 'Auth & Identity Failures',
      'A08': 'Software & Data Integrity',
      'A09': 'Logging & Alerting Failures',
      'A10': 'Mishandling Exceptional Conditions'
    } %}
    {% for cat_id, cat_name in owasp_map.items() %}
    {% set count = active_findings|selectattr('owasp','equalto',cat_id)|list|length %}
    <div class="owasp-item {{ 'has-findings' if count > 0 else '' }}">
      <div class="owasp-id">{{ cat_id }}</div>
      <div style="font-size:0.82rem;margin-top:2px">{{ cat_name }}</div>
      <div class="count">{{ count }} finding{{ 's' if count != 1 else '' }}{% if count == 0 %} (not checked){% endif %}</div>
    </div>
    {% endfor %}
  </div>

  <!-- 8. Appendix -->
  <h2 id="appendix" class="section-anchor">Appendix</h2>

  <h3>Severity Scoring Formula</h3>
  <div class="formula-box">
    <p><strong>adjusted_score = impact_score × exploitability_score × confidence_multiplier</strong></p>
    <br>
    <p>impact_score: critical=4, high=3, medium=2, low=1</p>
    <p>exploitability_score: trivial=1.0, easy=0.75, moderate=0.5, hard=0.25</p>
    <p>confidence_multiplier: confirmed=1.0, likely=0.85, possible=0.65</p>
    <br>
    <p>adjusted_score ≥ 3.5 → critical | ≥ 2.5 → high | ≥ 1.5 → medium | else → low</p>
    <br>
    <p><em>Example: A05-SQL-001 (critical base, easy exploit, likely confidence) = 4 × 0.75 × 0.85 = 2.55 → high</em></p>
  </div>

  <h3 style="margin-top:1rem">Limitations</h3>
  <div class="limitations">
    <ul>
      <li><strong>Flask/FastAPI focus:</strong> Route inventory works best with Flask and FastAPI. Django, Express, and other frameworks are partially supported via regex only.</li>
      <li><strong>Regex false positives:</strong> Pattern-based rules may flag test files, comments, or documentation that contain vulnerable-looking strings.</li>
      <li><strong>No runtime taint analysis:</strong> SecAudit cannot trace data flow through variables. A SQL injection hidden behind two function calls may not be detected.</li>
      <li><strong>Static IDOR detection is limited:</strong> Ownership checks implemented via custom logic rather than recognised decorator names will be missed.</li>
      <li><strong>Live probes require a running app:</strong> HTTP-type rules only apply when the target app is running and --url is provided.</li>
      <li><strong>No authentication testing:</strong> SecAudit sends only unauthenticated requests. Auth logic bugs behind login are not checked.</li>
    </ul>
  </div>

  <footer>
    Generated by <strong>SecAudit</strong> — authorized, non-destructive static + live security analysis for AI-generated web apps.
  </footer>

</div>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Render function
# ---------------------------------------------------------------------------

def _field(value: Any, name: str, default: Any = None) -> Any:
    """Read a model attribute or a JSON report mapping uniformly."""
    if isinstance(value, Mapping):
        return value.get(name, default)
    return getattr(value, name, default)


def _finding_identity(finding: Any) -> tuple[str, Any]:
    """Return a stable identity for de-duplicating ignored findings."""
    finding_id = _field(finding, "id")
    if finding_id not in (None, ""):
        return ("id", str(finding_id))
    return ("object", id(finding))


def _report_findings(result: Any) -> tuple[Any, list[Any], list[Any]]:
    """Prepare active and ignored findings without changing caller-owned data.

    Older callers put ignored findings only in ``findings`` while the CLI puts
    them in the dedicated ``ignored`` collection.  Reports should render both
    shapes consistently, and should not duplicate an ignored item when a
    result contains it in both collections.
    """
    report_mapping: dict[str, Any] | None = None
    if isinstance(result, Mapping):
        # Make a shallow copy so defaults and normalized collections do not
        # mutate a dictionary loaded from an existing JSON report.
        report_mapping = dict(result)
        result = report_mapping
        raw_findings = list(report_mapping.get("findings") or [])
        explicit_ignored = list(report_mapping.get("ignored") or [])
    else:
        raw_findings = list(_field(result, "findings", []) or [])
        explicit_ignored = list(_field(result, "ignored", []) or [])

    active = [f for f in raw_findings if not _field(f, "ignored", False)]
    ignored: list[Any] = []
    ignored_ids: set[tuple[str, Any]] = set()
    for finding in [*raw_findings, *explicit_ignored]:
        is_explicit = finding in explicit_ignored
        if not is_explicit and not _field(finding, "ignored", False):
            continue
        identity = _finding_identity(finding)
        if identity not in ignored_ids:
            ignored_ids.add(identity)
            ignored.append(finding)

    if report_mapping is not None:
        report_mapping["ignored"] = ignored
        report_mapping.setdefault("endpoints", [])
        report_mapping.setdefault("access_matrix", [])
        report_mapping.setdefault("chains", [])
        report_mapping.setdefault("stats", {})

    return result, active, ignored


def render_html_report(result: ScanResult, output_path: str) -> None:
    """
    Render the HTML report to a file.

    Parameters
    ----------
    result      : Completed ScanResult with findings, endpoints, etc.
    output_path : Path where the HTML file should be written.
    """
    if hasattr(result, "compute_stats"):
        result.compute_stats()

    result, active, ignored = _report_findings(result)

    # Keep the renderer useful for callers that pass an already-serialized
    # report mapping.  ScanResult remains the canonical API, but JSON reports
    # are a natural input for offline report regeneration.
    if isinstance(result, dict):
        raw_stats = result.get("stats") or {}
        if result.get("findings") is not None:
            stats = {}
            for finding in active:
                severity = str(_field(finding, "severity", ""))
                if severity:
                    stats[severity] = stats.get(severity, 0) + 1
            result["stats"] = {
                **{severity: stats.get(severity, 0) for severity in SEVERITY_COLORS},
                **{
                    key: value
                    for key, value in raw_stats.items()
                    if key not in SEVERITY_COLORS
                },
            }

    # ``BaseLoader`` has no filename from which Jinja can infer an autoescape
    # policy.  Reports contain source paths, evidence, and rule text supplied
    # by the scanned project, so explicitly enable HTML escaping for every
    # value rendered into this template.
    env = Environment(loader=BaseLoader(), autoescape=True)
    template = env.from_string(REPORT_TEMPLATE)

    html = template.render(
        result=result,
        active_findings=active,
        ignored_findings=ignored,
        severity_colors=SEVERITY_COLORS,
        status_colors=STATUS_COLORS,
    )

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")
