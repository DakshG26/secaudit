"""
Regression tests for the live website scanner.

The scanner must derive a useful endpoint graph from rendered HTML and must
evaluate response security controls from the actual host and cookie
attributes, rather than from substring or hostname-suffix coincidences.
"""

from types import SimpleNamespace

from secaudit import web_scanner


class _RawHeaders:
    """Small stand-in for urllib3's case-insensitive raw header mapping."""

    def __init__(self, cookies=()):
        self._cookies = list(cookies)

    def getlist(self, name):
        if name.lower() == "set-cookie":
            return list(self._cookies)
        return []


class _Response:
    def __init__(self, url, *, headers=None, html="", cookies=(), status_code=200):
        self.url = url
        self.headers = headers or {}
        self.text = html
        self.raw = SimpleNamespace(headers=_RawHeaders(cookies))
        self.status_code = status_code


def _patch_http(monkeypatch, response, *, robots_status=404, robots_body=""):
    """Patch both HTTP call sites used by ``scan_live_website``."""

    class _Session:
        def __init__(self):
            self.headers = {}

        def get(self, url, **kwargs):
            return response

    monkeypatch.setattr(web_scanner.requests, "Session", _Session)
    monkeypatch.setattr(
        web_scanner.requests,
        "get",
        lambda url, **kwargs: _Response(
            url,
            status_code=robots_status,
            html=robots_body,
        ),
    )


_COMPLETE_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'self'",
    "Strict-Transport-Security": "max-age=31536000",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


def test_live_scan_includes_form_actions_in_endpoint_graph(monkeypatch):
    """HTML form submissions are endpoints and must not disappear from the graph."""
    response = _Response(
        "https://example.test/",
        headers=_COMPLETE_HEADERS,
        html='''
            <html>
              <a href="/login">Login</a>
              <form method="post" action="/account/update">
                <input name="display_name">
              </form>
            </html>
        ''',
    )
    _patch_http(monkeypatch, response)

    result = web_scanner.scan_live_website("https://example.test")

    paths = {endpoint["path"] for endpoint in result["endpoints"]}
    assert {"/", "/login", "/account/update"} <= paths


def test_live_scan_does_not_skip_headers_for_lookalike_preloaded_domain(monkeypatch):
    """Only the actual preloaded host should receive the preload exception."""
    response = _Response("https://notgoogle.com/", headers={})
    _patch_http(monkeypatch, response)

    result = web_scanner.scan_live_website("https://notgoogle.com")
    finding_ids = {finding["id"] for finding in result["findings"]}

    assert "A02-HSTS-MISSING" in finding_ids
    assert "A02-NOSNIFF-MISSING" in finding_ids
    assert "A02-REFERRER-MISSING" in finding_ids


def test_live_scan_requires_cookie_secure_attribute(monkeypatch):
    """A cookie value containing the word 'secure' is not the Secure flag."""
    response = _Response(
        "https://example.test/",
        headers=_COMPLETE_HEADERS,
        cookies=("session=securely-generated-token; HttpOnly; SameSite=Lax",),
    )
    _patch_http(monkeypatch, response)

    result = web_scanner.scan_live_website("https://example.test")
    secure_findings = [
        finding
        for finding in result["findings"]
        if finding["rule_id"] == "A04-COOKIE-SECURE"
    ]

    assert len(secure_findings) == 1
    assert secure_findings[0]["id"] == "A04-COOKIE-SECURE-session"
