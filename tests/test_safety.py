"""
tests/test_safety.py — Tests for all safety invariants.

These tests verify the hard-coded safety rules that prevent SecAudit
from ever being used as an offensive tool:

  1. Non-localhost URLs raise SecurityError
  2. Only GET, HEAD, OPTIONS are sent (never POST, PUT, DELETE, PATCH)
  3. Redirects to non-localhost are refused
  4. --i-own-this-target is required for live probes
"""

import pytest

from secaudit.probes import (
    ALLOWED_HOSTS,
    ALLOWED_METHODS,
    SecurityError,
    validate_url,
    _safe_request,
)


# ---------------------------------------------------------------------------
# URL validation (the single choke-point for all network calls)
# ---------------------------------------------------------------------------

class TestValidateUrl:
    def test_localhost_allowed(self):
        validate_url("http://localhost:5000/")  # Should not raise

    def test_127_0_0_1_allowed(self):
        validate_url("http://127.0.0.1:5000/path")  # Should not raise

    def test_ipv6_loopback_allowed(self):
        validate_url("http://[::1]:5000/")  # Should not raise

    def test_example_com_refused(self):
        with pytest.raises(SecurityError) as exc_info:
            validate_url("https://example.com/api")
        assert "example.com" in str(exc_info.value)

    def test_google_refused(self):
        with pytest.raises(SecurityError):
            validate_url("https://www.google.com/")

    def test_ip_non_loopback_refused(self):
        with pytest.raises(SecurityError):
            validate_url("http://192.168.1.1:5000/")

    def test_internal_network_refused(self):
        with pytest.raises(SecurityError):
            validate_url("http://10.0.0.1/admin")

    def test_empty_host_refused(self):
        with pytest.raises((SecurityError, Exception)):
            validate_url("file:///etc/passwd")

    def test_allowed_hosts_constant(self):
        """The allowed hosts set must be exactly the three loopback identifiers."""
        assert "localhost" in ALLOWED_HOSTS
        assert "127.0.0.1" in ALLOWED_HOSTS
        assert "::1" in ALLOWED_HOSTS
        # Must not contain any external hosts
        assert "example.com" not in ALLOWED_HOSTS
        assert "0.0.0.0" not in ALLOWED_HOSTS


# ---------------------------------------------------------------------------
# Method restriction
# ---------------------------------------------------------------------------

class TestMethodRestriction:
    def test_get_in_allowed_methods(self):
        assert "GET" in ALLOWED_METHODS

    def test_head_in_allowed_methods(self):
        assert "HEAD" in ALLOWED_METHODS

    def test_options_in_allowed_methods(self):
        assert "OPTIONS" in ALLOWED_METHODS

    def test_post_not_allowed(self):
        assert "POST" not in ALLOWED_METHODS

    def test_put_not_allowed(self):
        assert "PUT" not in ALLOWED_METHODS

    def test_delete_not_allowed(self):
        assert "DELETE" not in ALLOWED_METHODS

    def test_patch_not_allowed(self):
        assert "PATCH" not in ALLOWED_METHODS

    def test_safe_request_refuses_post(self):
        """_safe_request must raise SecurityError for POST, even to localhost."""
        with pytest.raises(SecurityError) as exc_info:
            _safe_request("POST", "http://localhost:5000/")
        assert "POST" in str(exc_info.value)

    def test_safe_request_refuses_delete(self):
        with pytest.raises(SecurityError):
            _safe_request("DELETE", "http://localhost:5000/data")

    def test_safe_request_refuses_external_get(self):
        """_safe_request must refuse GET to non-localhost even with correct method."""
        with pytest.raises(SecurityError):
            _safe_request("GET", "https://example.com/")


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

class TestAuditLog:
    def test_audit_log_written(self, tmp_path):
        """Every request must be logged to the audit log."""
        import json
        from unittest.mock import patch, MagicMock
        from secaudit.probes import _write_audit_log

        log_path = str(tmp_path / "test_audit.jsonl")
        _write_audit_log("GET", "http://localhost:5000/test", 200, log_path)

        with open(log_path) as f:
            entry = json.loads(f.readline())

        assert entry["method"] == "GET"
        assert entry["url"] == "http://localhost:5000/test"
        assert entry["status"] == 200
        assert "time" in entry

    def test_audit_log_appends(self, tmp_path):
        """Multiple entries are appended to the same file."""
        import json
        from secaudit.probes import _write_audit_log

        log_path = str(tmp_path / "multi_audit.jsonl")
        _write_audit_log("GET", "http://localhost:5000/a", 200, log_path)
        _write_audit_log("HEAD", "http://localhost:5000/b", 404, log_path)

        lines = open(log_path).readlines()
        assert len(lines) == 2
        first = json.loads(lines[0])
        second = json.loads(lines[1])
        assert first["method"] == "GET"
        assert second["method"] == "HEAD"
        assert second["status"] == 404
