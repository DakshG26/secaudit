"""
tests/test_inventory.py — Tests for the AST-based endpoint inventory extractor.

Verifies that Flask routes are correctly extracted with their methods,
paths, auth decorators, and protection status.
"""

import textwrap
from pathlib import Path

import pytest

from secaudit.inventory import extract_endpoints_from_file, _extract_path_params


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def write_temp_py(tmp_path, code: str) -> str:
    """Write Python code to a temp file and return its path."""
    f = tmp_path / "app.py"
    f.write_text(textwrap.dedent(code))
    return str(f)


# ---------------------------------------------------------------------------
# Basic route extraction
# ---------------------------------------------------------------------------

def test_extracts_simple_get_route(tmp_path):
    code = """
    from flask import Flask
    app = Flask(__name__)

    @app.route('/hello')
    def hello():
        return 'hi'
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert len(endpoints) == 1
    ep = endpoints[0]
    assert ep.path == '/hello'
    assert ep.handler == 'hello'
    assert 'GET' in ep.method
    assert ep.is_protected is False


def test_extracts_post_route(tmp_path):
    code = """
    from flask import Flask
    app = Flask(__name__)

    @app.route('/submit', methods=['POST'])
    def submit():
        pass
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert len(endpoints) == 1
    assert endpoints[0].method == ['POST']
    assert endpoints[0].path == '/submit'


def test_extracts_multiple_methods(tmp_path):
    code = """
    @app.route('/data', methods=['GET', 'POST'])
    def data():
        pass
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert 'GET' in endpoints[0].method
    assert 'POST' in endpoints[0].method


def test_extracts_auth_decorator(tmp_path):
    code = """
    @app.route('/admin')
    @login_required
    def admin():
        pass
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert len(endpoints) == 1
    assert endpoints[0].is_protected is True
    assert 'login_required' in endpoints[0].auth_decorators


def test_unprotected_admin_route(tmp_path):
    code = """
    @app.route('/admin')
    def admin():
        pass
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert endpoints[0].is_protected is False


def test_extracts_path_params(tmp_path):
    code = """
    @app.route('/user/<int:user_id>')
    def get_user(user_id):
        pass
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert 'user_id' in endpoints[0].path_params


def test_extracts_multiple_routes(tmp_path):
    code = """
    @app.route('/a')
    def a(): pass

    @app.route('/b')
    def b(): pass

    @app.route('/c')
    @login_required
    def c(): pass
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert len(endpoints) == 3
    protected = [e for e in endpoints if e.is_protected]
    assert len(protected) == 1
    assert protected[0].path == '/c'


def test_extracts_request_inputs(tmp_path):
    code = """
    from flask import request
    @app.route('/search')
    def search():
        name = request.args.get('name')
        page = request.args.get('page')
        return name
    """
    endpoints = extract_endpoints_from_file(write_temp_py(tmp_path, code))
    assert 'name' in endpoints[0].request_inputs
    assert 'page' in endpoints[0].request_inputs


def test_extract_path_params_flask_style():
    params = _extract_path_params('/user/<int:user_id>/post/<post_id>')
    assert 'user_id' in params
    assert 'post_id' in params


def test_syntax_error_returns_empty(tmp_path):
    f = tmp_path / "bad.py"
    f.write_text("def broken(: pass")
    endpoints = extract_endpoints_from_file(str(f))
    assert endpoints == []
