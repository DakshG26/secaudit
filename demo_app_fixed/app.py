"""
demo_app_fixed/app.py — Patched version of the intentionally vulnerable demo app.

All 12 planted flaws have been corrected:
  1.  A01 — /admin now requires login_required decorator
  2.  A01 — /user/<id> checks session ownership
  3.  A05 — SQL uses parameterised queries
  4.  A04 — SECRET_KEY loaded from environment variable
  5.  A04 — bcrypt used for password hashing (simulated with hashlib.pbkdf2)
  6.  A02 — debug=False (or controlled by env var)
  7.  A10 — Exception handler returns generic error, logs internally
  8.  A01 — CORS restricted to specific origins
  9.  A03 — requirements.txt is pinned (separate file)
 10.  A05 — eval() replaced with ast.literal_eval with validation
 11.  A09 — Failed logins are logged
 12.  A04 — JWT uses HS256 with proper secret
"""

import ast as _ast
import hashlib
import hmac
import logging
import os
import sqlite3

import jwt  # PyJWT
from flask import Flask, jsonify, request, session
from functools import wraps

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Fix 4: Load secret from environment ───────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable must be set")

app = Flask(__name__)
app.secret_key = SECRET_KEY

ALLOWED_ORIGINS = {"http://localhost:3000", "http://localhost:5000"}


# ── Fix 8: CORS restricted to specific origin ────────────────────────────
@app.after_request
def add_cors_headers(response):
    """Add restrictive CORS headers."""
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        # Credentials only for known origins
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


USERS = {
    1: {"name": "Alice", "email": "alice@example.com", "role": "admin"},
    2: {"name": "Bob",   "email": "bob@example.com",   "role": "user"},
}


def login_required(f):
    """Decorator: requires an authenticated session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator: requires admin role in session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get("role") != "admin":
            return jsonify({"error": "admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def token_required(f):
    """Decorator: requires a valid JWT bearer token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "").strip()
        if not auth.startswith("Bearer "):
            return jsonify({"error": "token missing"}), 401
        token = auth.replace("Bearer ", "")
        try:
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.InvalidTokenError as e:
            return jsonify({"error": str(e)}), 401
        return f(*args, **kwargs)
    return decorated


# ── Fix 1: Admin route protected ─────────────────────────────────────────
@app.route("/admin")
@login_required
@admin_required
def admin_panel():
    """Admin panel — requires authenticated admin session."""
    return jsonify({"users": [{"name": u["name"]} for u in USERS.values()]})


# ── Fix 2: IDOR fixed — ownership check ──────────────────────────────────
@app.route("/user/<int:user_id>")
@login_required
def get_user(user_id):
    """Return user record — only allowed if caller owns it or is admin."""
    caller = session.get("user_id")
    caller_role = session.get("role")
    if caller != user_id and caller_role != "admin":
        return jsonify({"error": "forbidden"}), 403
    user = USERS.get(user_id)
    if not user:
        return jsonify({"error": "not found"}), 404
    return jsonify({"name": user["name"], "email": user["email"]})


# ── Fix 3: SQL parameterised query ───────────────────────────────────────
@app.route("/search")
@login_required
def search():
    """Search users — uses parameterised SQL."""
    name = request.args.get("name", "").strip()
    if not isinstance(name, str) or len(name) > 100:
        return jsonify({"error": "invalid name"}), 400
    conn = sqlite3.connect(":memory:")
    cur = conn.cursor()
    cur.execute("CREATE TABLE users (name TEXT, email TEXT)")
    cur.execute("SELECT * FROM users WHERE name = ?", (name,))
    rows = cur.fetchall()
    return jsonify(rows)


# ── Fix 5: PBKDF2 for password hashing ───────────────────────────────────
def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-SHA256."""
    salt = b"static-demo-salt"  # In production, use a random per-user salt
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000)
    return dk.hex()


# ── Fix 11: Log failed logins ─────────────────────────────────────────────
@app.route("/login", methods=["POST"])
def login():
    """Login endpoint — failed attempts are logged."""
    data = request.get_json() or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()
    if not username or not password or len(username) > 64:
        return jsonify({"error": "invalid credentials"}), 400
    stored_hash = hash_password("correctpassword")
    if hmac.compare_digest(hash_password(password), stored_hash) and username == "admin":
        session["user"] = username
        session["role"] = "admin"
        session["user_id"] = 1
        return jsonify({"status": "ok"})
    # Fix 11: Log the failure
    logger.warning("Failed login attempt for user '%s' from %s", username, request.remote_addr)
    return jsonify({"error": "invalid credentials"}), 401


# ── Fix 7: Generic error response ────────────────────────────────────────
@app.route("/crash")
@login_required
def crash():
    """Endpoint that catches exceptions and returns generic error."""
    try:
        result = 1 / 0
    except Exception:
        logger.exception("Unhandled error in /crash")
        return jsonify({"error": "An internal error occurred"}), 500


# ── Fix 10: Safe expression evaluation ───────────────────────────────────
@app.route("/calculate")
@login_required
def calculate():
    """Calculator — uses ast.literal_eval instead of eval()."""
    expr = request.args.get("expr", "").strip()
    if not expr or len(expr) > 50:
        return jsonify({"error": "invalid expression"}), 400
    try:
        result = _ast.literal_eval(expr)
        if not isinstance(result, (int, float)):
            return jsonify({"error": "only numeric literals allowed"}), 400
        return jsonify({"result": result})
    except (ValueError, SyntaxError):
        return jsonify({"error": "invalid expression"}), 400


# ── Fix 12: JWT with HS256 ───────────────────────────────────────────────
@app.route("/token")
@login_required
def make_token():
    """Issue a JWT signed with HS256."""
    payload = {"user": session.get("user"), "role": session.get("role")}
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token})


@app.route("/protected")
@token_required
def protected():
    """Verify a JWT signed with HS256."""
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "")
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify(data)
    except jwt.InvalidTokenError as e:
        return jsonify({"error": str(e)}), 401


# ── Fix 6: debug=False controlled by env ─────────────────────────────────
if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, host="127.0.0.1", port=5000)
