"""
tests/test_policy.py — Tests for the access-control policy engine.

Verifies that policy.yml rules are correctly loaded, that access matrix
rows are computed accurately, and that violations are correctly identified.
"""

import textwrap
from pathlib import Path

import pytest

from secaudit.models import Endpoint
from secaudit.policy import (
    _auth_strength,
    _actual_level,
    _compute_status,
    _match_policy,
    build_access_matrix,
    load_policy,
    PolicyRule,
)


# ---------------------------------------------------------------------------
# Policy loading
# ---------------------------------------------------------------------------

def test_load_policy(tmp_path):
    """Policy YAML loads correctly into PolicyRule objects."""
    policy_file = tmp_path / "policy.yml"
    policy_file.write_text(textwrap.dedent("""
        routes:
          - path: "/admin"
            requires: admin
          - path: "/login"
            requires: public
    """))
    rules = load_policy(str(policy_file))
    assert len(rules) == 2
    assert rules[0].path == "/admin"
    assert rules[0].requires == "admin"
    assert rules[1].requires == "public"


def test_load_policy_empty(tmp_path):
    """Empty routes section returns empty list."""
    policy_file = tmp_path / "policy.yml"
    policy_file.write_text("routes: []\n")
    rules = load_policy(str(policy_file))
    assert rules == []


# ---------------------------------------------------------------------------
# Auth strength
# ---------------------------------------------------------------------------

def test_auth_strength_ordering():
    assert _auth_strength("public") < _auth_strength("authenticated")
    assert _auth_strength("authenticated") < _auth_strength("owner")
    assert _auth_strength("owner") < _auth_strength("admin")


# ---------------------------------------------------------------------------
# Actual level detection
# ---------------------------------------------------------------------------

def make_endpoint(is_protected, decorators=None):
    return Endpoint(
        method=["GET"],
        path="/test",
        handler="test",
        location="app.py:1",
        auth_decorators=decorators or [],
        is_protected=is_protected,
    )


def test_actual_level_none():
    ep = make_endpoint(False)
    assert _actual_level(ep) == "none"


def test_actual_level_admin():
    ep = make_endpoint(True, ["admin_required"])
    assert _actual_level(ep) == "admin"


def test_actual_level_authenticated():
    ep = make_endpoint(True, ["login_required"])
    assert _actual_level(ep) == "authenticated"


# ---------------------------------------------------------------------------
# Status computation
# ---------------------------------------------------------------------------

def test_status_ok_public():
    assert _compute_status("public", "none") == "OK"


def test_status_violation():
    assert _compute_status("admin", "none") == "VIOLATION"


def test_status_weaker():
    assert _compute_status("admin", "authenticated") == "WEAKER"


def test_status_uncovered():
    assert _compute_status("uncovered", "none") == "UNCOVERED"


def test_status_ok_admin():
    assert _compute_status("admin", "admin") == "OK"


# ---------------------------------------------------------------------------
# Access matrix building
# ---------------------------------------------------------------------------

def test_build_access_matrix_violation():
    endpoints = [
        Endpoint(
            method=["GET"],
            path="/admin",
            handler="admin",
            location="app.py:1",
            auth_decorators=[],
            is_protected=False,
        )
    ]
    policy_rules = [PolicyRule(path="/admin", requires="admin")]
    matrix = build_access_matrix(endpoints, policy_rules)
    assert len(matrix) == 1
    assert matrix[0].status == "VIOLATION"
    assert matrix[0].expected == "admin"
    assert matrix[0].actual == "none"


def test_build_access_matrix_ok():
    endpoints = [
        Endpoint(
            method=["POST"],
            path="/login",
            handler="login",
            location="app.py:1",
            auth_decorators=[],
            is_protected=False,
        )
    ]
    policy_rules = [PolicyRule(path="/login", requires="public")]
    matrix = build_access_matrix(endpoints, policy_rules)
    assert matrix[0].status == "OK"


def test_build_access_matrix_uncovered():
    endpoints = [
        Endpoint(
            method=["GET"],
            path="/secret",
            handler="secret",
            location="app.py:1",
            auth_decorators=[],
            is_protected=False,
        )
    ]
    policy_rules = []  # No policy rules
    matrix = build_access_matrix(endpoints, policy_rules)
    assert matrix[0].status == "UNCOVERED"


def test_glob_pattern_match():
    """Policy paths with wildcards should match sub-paths."""
    policy_rules = [PolicyRule(path="/admin/*", requires="admin")]
    endpoints = [
        Endpoint(
            method=["GET"],
            path="/admin/users",
            handler="admin_users",
            location="app.py:1",
            auth_decorators=[],
            is_protected=False,
        )
    ]
    matrix = build_access_matrix(endpoints, policy_rules)
    assert matrix[0].status == "VIOLATION"
    assert matrix[0].expected == "admin"
