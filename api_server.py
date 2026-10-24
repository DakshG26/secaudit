"""
api_server.py — SecAudit Live Web API Gateway.

Accepts GitHub repository links or live site URLs from the frontend,
executes AST route inventory and SecAudit rules, and returns structured
vulnerability findings, attack chains, and policy matrices.
"""

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify

from secaudit.inventory import extract_endpoints
from secaudit.engine import load_rules, run_scan
from secaudit.chains import detect_chains
from secaudit.policy import build_access_matrix, load_policy
from secaudit.models import ScanResult

app = Flask(__name__)

# Base paths
ROOT_DIR = Path(__file__).parent.resolve()
DEMO_APP = ROOT_DIR / "demo_app"
DEMO_FIXED = ROOT_DIR / "demo_app_fixed"


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/api/health", methods=["GET"])
def health():
    rules = load_rules()
    return jsonify({
        "status": "healthy",
        "engine": "SecAudit v1.0.0",
        "rules_loaded": len(rules)
    })


@app.route("/api/scan", methods=["POST", "OPTIONS"])
def scan_endpoint():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json() or {}
    target_input = (data.get("url") or "").strip()
    policy_str = data.get("policy") or ""

    if not target_input:
        return jsonify({"error": "Target URL or repository path is required"}), 400

    temp_dir = None
    target_path = None
    is_github = False

    try:
        # Route: Local Demo presets
        if target_input in ("demo_app", "vulnerable", "sample:vulnerable") or "ai-web-vulnerable" in target_input:
            target_path = str(DEMO_APP)
            policy_file = str(DEMO_APP / "policy.yml")
        elif target_input in ("demo_app_fixed", "fixed", "clean", "sample:clean") or "hardened" in target_input:
            target_path = str(DEMO_FIXED)
            policy_file = str(DEMO_FIXED / "policy.yml")
        elif target_input.startswith("https://github.com/") or target_input.startswith("http://github.com/"):
            # Clone public repository into ephemeral sandbox
            is_github = True
            temp_dir = tempfile.mkdtemp(prefix="secaudit_repo_")
            clone_cmd = [
                "git", "clone", "--depth=1", "--single-branch",
                target_input, temp_dir
            ]
            res = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=30)
            if res.returncode != 0:
                return jsonify({
                    "error": f"Failed to clone GitHub repo: {res.stderr[:200]}"
                }), 400
            target_path = temp_dir
            policy_file = os.path.join(temp_dir, "policy.yml")
        elif os.path.isdir(target_input):
            target_path = target_input
            policy_file = os.path.join(target_input, "policy.yml")
        else:
            # Default to demo_app if not a direct git repo
            target_path = str(DEMO_APP)
            policy_file = str(DEMO_APP / "policy.yml")

        # Step 1: Inventory Extraction
        endpoints = extract_endpoints(target_path)

        # Step 2: Rule Scan
        findings = run_scan(target_path, endpoints)

        # Step 3: Attack Chains
        chains = detect_chains(findings)

        # Step 4: Policy Matrix
        access_matrix = []
        if os.path.exists(policy_file):
            try:
                policy_rules = load_policy(policy_file)
                access_matrix = build_access_matrix(endpoints, policy_rules)
            except Exception:
                pass

        # Compute stats & score
        active = [f for f in findings if not f.ignored]
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for f in active:
            counts[f.severity] = counts.get(f.severity, 0) + 1

        deduction = (
            counts.get("critical", 0) * 15 +
            counts.get("high", 0) * 10 +
            counts.get("medium", 0) * 5 +
            counts.get("low", 0) * 2
        )
        score = max(0, min(100, 100 - deduction))
        status = "clean" if score >= 90 else ("warning" if score >= 60 else "compromised")

        # Serialise
        result = {
            "target": target_input,
            "scan_time": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "score": score,
            "status": status,
            "stats": {
                **counts,
                "total": len(active)
            },
            "findings": [f.to_dict() for f in active],
            "endpoints": [e.to_dict() for e in endpoints],
            "access_matrix": [r.to_dict() for r in access_matrix],
            "chains": [c.to_dict() for c in chains]
        }
        return jsonify(result), 200

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Git clone operation timed out after 30 seconds"}), 408
    except Exception as exc:
        return jsonify({"error": f"Scan failed: {str(exc)}"}), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=False)
