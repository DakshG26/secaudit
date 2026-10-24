"""
demo_app/app.py — Intentionally Vulnerable Flask Application.

This app contains exactly 12 planted security flaws for SecAudit to find.
DO NOT deploy this app anywhere. It is for local testing only.

Planted flaws:
  1.  A01 — /admin route with no auth decorator
  2.  A01 — IDOR: /user/<id> returns any user without ownership check
  3.  A05 — SQL injection via f-string in /search
  4.  A04 — Hardcoded SECRET_KEY
  5.  A04 — MD5 used for password hashing
  6.  A02 — app.run(debug=True)
  7.  A10 — Full stack trace returned to client in /crash
  8.  A01 — CORS wildcard with credentials
  9.  A03 — Unpinned/hallucinated deps in requirements.txt (separate file)
 10.  A05 — eval() called on user input in /calculate
 11.  A09 — No logging on failed login in /login
 12.  A04 — JWT signed with algorithm="none"
"""

import hashlib
import sqlite3

import jwt  # PyJWT
from flask import Flask, jsonify, request, session

# ── Flaw 4: Hardcoded secret key ──────────────────────────────────────────
SECRET_KEY = "hardcoded-super-secret-1234"  # noqa: S105

app = Flask(__name__)
app.secret_key = SECRET_KEY

# ── Flaw 8: CORS wildcard with credentials ────────────────────────────────
@app.after_request
def add_cors_headers(response):
    """Add CORS headers — intentionally misconfigured."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


# In-memory fake DB
USERS = {
    1: {"name": "Alice", "email": "alice@example.com", "role": "admin"},
    2: {"name": "Bob",   "email": "bob@example.com",   "role": "user"},
}


# ── Flaw 1: Admin route with no auth ──────────────────────────────────────
@app.route("/admin")
def admin_panel():
    """Admin panel — no authentication required."""
    return jsonify({"users": list(USERS.values()), "secret": SECRET_KEY})


# ── Flaw 2: IDOR — /user/<id> without ownership check ───────────────────
@app.route("/user/<int:user_id>")
def get_user(user_id):
    """Return any user record without checking if caller owns it."""
    user = USERS.get(user_id)
    if not user:
        return jsonify({"error": "not found"}), 404
    return jsonify(user)


# ── Flaw 3: SQL injection via f-string ───────────────────────────────────
@app.route("/search")
def search():
    """Search users — SQL built with f-string interpolation."""
    name = request.args.get("name", "")
    conn = sqlite3.connect(":memory:")
    cur = conn.cursor()
    cur.execute("CREATE TABLE users (name TEXT, email TEXT)")
    # Vulnerable: user input injected directly
    query = f"SELECT * FROM users WHERE name = '{name}'"
    cur.execute(query)
    rows = cur.fetchall()
    return jsonify(rows)


# ── Flaw 5: MD5 for password hashing ─────────────────────────────────────
def hash_password(password: str) -> str:
    """Hash a password — intentionally using MD5."""
    return hashlib.md5(password.encode()).hexdigest()  # noqa: S324


# ── Flaw 11: No logging on failed login ──────────────────────────────────
@app.route("/login", methods=["POST"])
def login():
    """Login endpoint — failed attempts are silently dropped."""
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    stored_hash = hash_password("correctpassword")
    if hash_password(password) == stored_hash and username == "admin":
        session["user"] = username
        return jsonify({"status": "ok"})
    # Flaw 11: No log.warning / logging call here
    return jsonify({"error": "invalid credentials"}), 401


# ── Flaw 7: Stack trace returned to client ───────────────────────────────
@app.route("/crash")
def crash():
    """Endpoint that leaks a full exception traceback."""
    try:
        result = 1 / 0
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


# ── Flaw 10: eval() on user input ────────────────────────────────────────
@app.route("/calculate")
def calculate():
    """Calculator — calls eval() on the user-supplied expression."""
    expr = request.args.get("expr", "")
    try:
        result = eval(expr)  # noqa: S307
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ── Flaw 12: JWT with algorithm="none" ───────────────────────────────────
@app.route("/token")
def make_token():
    """Issue a JWT with algorithm=none — signature verification disabled."""
    payload = {"user": "admin", "role": "admin"}
    token = jwt.encode(payload, "", algorithm="none")
    return jsonify({"token": token})


@app.route("/protected")
def protected():
    """Verify a JWT — accepts algorithm=none tokens."""
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "")
    try:
        data = jwt.decode(token, options={"verify_signature": False})
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 401


# ── Flaw 6: debug=True ───────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
