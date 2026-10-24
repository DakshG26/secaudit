"""
inventory.py — AST-based endpoint inventory extractor.

Parses Python source files (Flask and FastAPI) using the `ast` module
to extract every HTTP endpoint with its method, path, handler function,
file:line reference, path parameters, request inputs, and auth decorators.

Does NOT execute any code — all analysis is read-only static parsing.
"""

from __future__ import annotations

import ast
import os
import re
from pathlib import Path
from typing import List, Optional

from secaudit.models import Endpoint

# ---------------------------------------------------------------------------
# Known auth-related decorator names (case-insensitive prefix matching)
# ---------------------------------------------------------------------------
AUTH_DECORATOR_NAMES = {
    "login_required",
    "jwt_required",
    "auth_required",
    "verify_token",
    "authenticate",
    "authorization",
    "requireauth",
    "withauth",
    "authmiddleware",
    "auth_middleware",
    "isauthenticated",
    "checkauth",
    "token_required",
    "admin_required",
    "permission_required",
    "fresh_login_required",
    "roles_required",
    "requires_auth",
}

# Default HTTP methods when not specified in the route decorator
_DEFAULT_METHODS = ["GET"]


def _decorator_name(decorator: ast.expr) -> str:
    """
    Extract the string name of a decorator expression.

    Handles plain names (@login_required), attribute access (@auth.required),
    and calls (@app.route('/path')).
    """
    if isinstance(decorator, ast.Call):
        return _decorator_name(decorator.func)
    if isinstance(decorator, ast.Name):
        return decorator.id
    if isinstance(decorator, ast.Attribute):
        return decorator.attr
    return ""


def _is_auth_decorator(name: str) -> bool:
    """Return True if the decorator name is a known auth guard."""
    return name.lower() in AUTH_DECORATOR_NAMES


def _extract_flask_route(decorator: ast.Call) -> Optional[tuple[str, List[str]]]:
    """
    Parse a Flask @app.route(...) or @blueprint.route(...) decorator.

    Returns (path, methods) or None if not a route decorator.
    """
    func_name = _decorator_name(decorator.func)
    if func_name != "route":
        return None

    path = ""
    methods = _DEFAULT_METHODS[:]

    # Positional arg: @app.route("/path")
    if decorator.args:
        arg = decorator.args[0]
        if isinstance(arg, ast.Constant):
            path = str(arg.value)

    # Keyword args: methods=["GET", "POST"]
    for kw in decorator.keywords:
        if kw.arg == "methods" and isinstance(kw.value, ast.List):
            methods = [
                elt.value.upper()
                for elt in kw.value.elts
                if isinstance(elt, ast.Constant)
            ]

    return path, methods


def _extract_fastapi_route(decorator: ast.Call) -> Optional[tuple[str, List[str]]]:
    """
    Parse a FastAPI @router.get/post/put/delete/patch decorator.

    Returns (path, methods) or None if not a route decorator.
    """
    http_methods = {"get", "post", "put", "delete", "patch", "head", "options"}
    func_name = _decorator_name(decorator.func)
    if func_name.lower() not in http_methods:
        return None

    path = ""
    if decorator.args:
        arg = decorator.args[0]
        if isinstance(arg, ast.Constant):
            path = str(arg.value)

    return path, [func_name.upper()]


def _extract_path_params(path: str) -> List[str]:
    """
    Extract path parameter names from a URL pattern.

    Handles Flask <param> and <type:param>, and FastAPI {param} styles.
    """
    flask_params = re.findall(r"<(?:\w+:)?(\w+)>", path)
    fastapi_params = re.findall(r"\{(\w+)\}", path)
    return flask_params + fastapi_params


def _extract_request_inputs(func_node: ast.FunctionDef) -> List[str]:
    """
    Walk the function body looking for request.form.get(), request.args.get(),
    request.json.get(), and similar input accessors on the Flask request object.
    Returns a list of identified input field names.
    """
    inputs = []
    # Identify variables assigned from request.get_json() or request.json
    json_vars = set()
    for node in ast.walk(func_node):
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
            # var = request.get_json()
            call_val = node.value.func
            if (
                isinstance(call_val, ast.Attribute)
                and call_val.attr == "get_json"
                and isinstance(call_val.value, ast.Name)
                and call_val.value.id == "request"
            ):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        json_vars.add(target.id)

    for node in ast.walk(func_node):
        if not isinstance(node, ast.Call):
            continue
        # Pattern: request.args.get("field") / request.form.get("field") / data.get("field")
        if isinstance(node.func, ast.Attribute) and node.func.attr == "get":
            caller = node.func.value
            is_req = False
            if (
                isinstance(caller, ast.Attribute)
                and caller.attr in {"args", "form", "values", "json"}
                and isinstance(caller.value, ast.Name)
                and caller.value.id == "request"
            ):
                is_req = True
            elif isinstance(caller, ast.Name) and caller.id in json_vars:
                is_req = True

            if is_req and node.args and isinstance(node.args[0], ast.Constant):
                inputs.append(str(node.args[0].value))

    return list(dict.fromkeys(inputs))  # deduplicate, preserve order


def extract_endpoints_from_file(filepath: str) -> List[Endpoint]:
    """
    Parse one Python source file and return all HTTP endpoints found.

    Uses the ast module for safe static analysis — the file is read and
    parsed but never executed.

    Parameters
    ----------
    filepath : str
        Absolute or relative path to a .py file.

    Returns
    -------
    List[Endpoint]
        One Endpoint per route decorator found in the file.
    """
    try:
        source = Path(filepath).read_text(encoding="utf-8", errors="replace")
        tree = ast.parse(source, filename=filepath)
    except (SyntaxError, OSError):
        return []

    endpoints: List[Endpoint] = []
    source_lines = source.splitlines()

    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue

        route_path: Optional[str] = None
        route_methods: List[str] = []
        auth_decorators: List[str] = []

        for decorator in node.decorator_list:
            # Check auth decorators (plain names and calls)
            dec_name = _decorator_name(decorator)
            if _is_auth_decorator(dec_name):
                auth_decorators.append(dec_name)
                continue

            if not isinstance(decorator, ast.Call):
                continue

            # Try Flask route
            result = _extract_flask_route(decorator)
            if result:
                route_path, route_methods = result
                continue

            # Try FastAPI route
            result = _extract_fastapi_route(decorator)
            if result:
                route_path, route_methods = result
                continue

        if route_path is None:
            continue  # Not a route handler

        path_params = _extract_path_params(route_path)
        request_inputs = _extract_request_inputs(node)
        is_protected = len(auth_decorators) > 0

        endpoints.append(
            Endpoint(
                method=route_methods,
                path=route_path,
                handler=node.name,
                location=f"{filepath}:{node.lineno}",
                path_params=path_params,
                request_inputs=request_inputs,
                auth_decorators=auth_decorators,
                is_protected=is_protected,
            )
        )

    return endpoints


def extract_endpoints(target_path: str) -> List[Endpoint]:
    """
    Recursively scan a directory (or single file) and return all endpoints.

    Parameters
    ----------
    target_path : str
        Path to a Python file or a directory to scan recursively.

    Returns
    -------
    List[Endpoint]
        All endpoints found across all .py files in the target.
    """
    target = Path(target_path)
    all_endpoints: List[Endpoint] = []

    if target.is_file() and target.suffix == ".py":
        return extract_endpoints_from_file(str(target))

    for root, dirs, files in os.walk(target):
        # Skip hidden dirs and virtual environments
        dirs[:] = [
            d for d in dirs
            if not d.startswith(".") and d not in {"venv", "env", "__pycache__", "node_modules"}
        ]
        for filename in files:
            if filename.endswith(".py"):
                filepath = os.path.join(root, filename)
                all_endpoints.extend(extract_endpoints_from_file(filepath))

    return all_endpoints


def print_inventory_table(endpoints: List[Endpoint]) -> None:
    """
    Print a formatted endpoint inventory table to stdout.

    Protected routes are shown with ✓ and unprotected with ✗.
    """
    if not endpoints:
        print("No endpoints found.")
        return

    col_method = max(8, max(len(",".join(e.method)) for e in endpoints) + 2)
    col_path = max(6, max(len(e.path) for e in endpoints) + 2)
    col_handler = max(9, max(len(e.handler) for e in endpoints) + 2)
    col_auth = max(10, max(len(",".join(e.auth_decorators) or "none") for e in endpoints) + 2)

    header = (
        f"{'Method':<{col_method}} {'Path':<{col_path}} "
        f"{'Handler':<{col_handler}} {'Auth':<{col_auth}} {'Protected':<10} {'Location'}"
    )
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)

    for ep in endpoints:
        methods = ",".join(ep.method)
        auth = ",".join(ep.auth_decorators) or "none"
        protected = "✓" if ep.is_protected else "✗ OPEN"
        print(
            f"{methods:<{col_method}} {ep.path:<{col_path}} "
            f"{ep.handler:<{col_handler}} {auth:<{col_auth}} {protected:<10} {ep.location}"
        )

    print(separator)
    open_count = sum(1 for e in endpoints if not e.is_protected)
    print(f"Total: {len(endpoints)} endpoints | {open_count} unprotected")
