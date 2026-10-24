import { ScanResult } from '../types/security';

export const MOCK_VULNERABLE_SCAN: ScanResult = {
  target: 'https://github.com/demo/ai-web-vulnerable',
  scan_time: '2026-10-24T12:00:00Z',
  score: 32,
  status: 'compromised',
  stats: {
    critical: 5,
    high: 5,
    medium: 4,
    low: 6,
    total: 20
  },
  chains: [
    {
      id: 'CHAIN-001',
      name: 'Full Database Takeover',
      description: 'An unauthenticated sensitive route combined with SQL injection enables full database dump without credentials.',
      severity: 'critical',
      finding_ids: ['A01-NOAUTH-001-1', 'A05-SQL-001-1'],
      narrative: 'Step 1: The /admin route is open without authentication. Step 2: An f-string SQL query on /search allows arbitrary queries. Combined: Any unauthenticated user can dump customer credentials and database tables.'
    },
    {
      id: 'CHAIN-002',
      name: 'Remote Code Execution via Open Admin',
      description: 'Unauthenticated admin endpoint plus eval() on user input yields server shell access.',
      severity: 'critical',
      finding_ids: ['A01-NOAUTH-001-1', 'A05-EXEC-001-1'],
      narrative: 'Step 1: Admin route requires no authentication. Step 2: Calculator endpoint passes unsanitized input to eval(). Together: Full arbitrary command execution.'
    },
    {
      id: 'CHAIN-003',
      name: 'Authentication Bypass via JWT Forgery',
      description: 'JWT configured with algorithm="none" allows forging arbitrary role claims.',
      severity: 'critical',
      finding_ids: ['A04-JWT-001-1', 'A01-NOAUTH-001-1'],
      narrative: 'Signature verification is bypassed; attackers can craft an admin JWT and impersonate any user.'
    }
  ],
  access_matrix: [
    { method: 'GET', path: '/admin', expected: 'admin', actual: 'none', auth_decorators: [], status: 'VIOLATION' },
    { method: 'GET', path: '/user/<int:user_id>', expected: 'owner', actual: 'none', auth_decorators: [], status: 'VIOLATION' },
    { method: 'GET', path: '/search', expected: 'authenticated', actual: 'none', auth_decorators: [], status: 'VIOLATION' },
    { method: 'POST', path: '/login', expected: 'public', actual: 'none', auth_decorators: [], status: 'OK' },
    { method: 'GET', path: '/calculate', expected: 'authenticated', actual: 'none', auth_decorators: [], status: 'VIOLATION' },
    { method: 'GET', path: '/crash', expected: 'authenticated', actual: 'none', auth_decorators: [], status: 'VIOLATION' },
    { method: 'GET', path: '/token', expected: 'public', actual: 'none', auth_decorators: [], status: 'OK' },
    { method: 'GET', path: '/protected', expected: 'authenticated', actual: 'none', auth_decorators: [], status: 'VIOLATION' }
  ],
  endpoints: [
    { method: ['GET'], path: '/admin', handler: 'admin_panel', location: 'app.py:52', path_params: [], request_inputs: [], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/user/<int:user_id>', handler: 'get_user', location: 'app.py:59', path_params: ['user_id'], request_inputs: [], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/search', handler: 'search', location: 'app.py:69', path_params: [], request_inputs: ['name'], auth_decorators: [], is_protected: false },
    { method: ['POST'], path: '/login', handler: 'login', location: 'app.py:90', path_params: [], request_inputs: ['username', 'password'], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/calculate', handler: 'calculate', location: 'app.py:116', path_params: [], request_inputs: ['expr'], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/crash', handler: 'crash', location: 'app.py:105', path_params: [], request_inputs: [], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/token', handler: 'make_token', location: 'app.py:128', path_params: [], request_inputs: [], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/protected', handler: 'protected', location: 'app.py:136', path_params: [], request_inputs: [], auth_decorators: [], is_protected: false }
  ],
  findings: [
    {
      id: 'A01-NOAUTH-001-1',
      rule_id: 'A01-NOAUTH-001',
      title: 'Route with No Authentication',
      owasp: 'A01',
      cwe: 'CWE-306',
      severity: 'critical',
      confidence: 'confirmed',
      location: 'app.py:52',
      evidence: 'GET /admin — handler: admin_panel — auth decorators: none',
      impact: 'Any unauthenticated user can access this sensitive admin endpoint.',
      remediation: 'Add @login_required and @admin_required decorators before the handler.',
      fixed_code: '@app.route("/admin")\n@login_required\n@admin_required\ndef admin_panel():\n    return jsonify(admin_data)'
    },
    {
      id: 'A05-SQL-001-1',
      rule_id: 'A05-SQL-001',
      title: 'SQL Injection via String Formatting',
      owasp: 'A05',
      cwe: 'CWE-89',
      severity: 'critical',
      confidence: 'likely',
      location: 'app.py:76',
      evidence: 'query = f"SELECT * FROM users WHERE name = \'{name}\'"',
      impact: 'Arbitrary database read/write/drop via unparameterized SQL query interpolation.',
      remediation: 'Use parameterized queries with placeholder bindings (?, %s, :param).',
      fixed_code: 'cur.execute("SELECT * FROM users WHERE name = ?", (name,))'
    },
    {
      id: 'A05-EXEC-001-1',
      rule_id: 'A05-EXEC-001',
      title: 'Dangerous Code Execution (eval/exec)',
      owasp: 'A05',
      cwe: 'CWE-78',
      severity: 'critical',
      confidence: 'likely',
      location: 'app.py:120',
      evidence: 'result = eval(expr)  # user input directly parsed as python code',
      impact: 'Remote code execution under the permissions of the host process.',
      remediation: 'Replace eval() with ast.literal_eval() or a sandboxed math expression parser.',
      fixed_code: 'import ast\nresult = ast.literal_eval(expr)'
    },
    {
      id: 'A04-JWT-001-1',
      rule_id: 'A04-JWT-001',
      title: 'JWT with "none" Algorithm Permitted',
      owasp: 'A04',
      cwe: 'CWE-347',
      severity: 'critical',
      confidence: 'confirmed',
      location: 'app.py:131',
      evidence: 'token = jwt.encode(payload, "", algorithm="none")',
      impact: 'Signature verification is bypassed; attackers can forge tokens with arbitrary roles.',
      remediation: 'Specify secure symmetric (HS256) or asymmetric (RS256) algorithms and require signature.',
      fixed_code: 'token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")\njwt.decode(token, SECRET_KEY, algorithms=["HS256"])'
    },
    {
      id: 'A01-IDOR-001-1',
      rule_id: 'A01-IDOR-001',
      title: 'Insecure Direct Object Reference (IDOR)',
      owasp: 'A01',
      cwe: 'CWE-639',
      severity: 'high',
      confidence: 'likely',
      location: 'app.py:59',
      evidence: 'GET /user/<int:user_id> — no ownership validation against session caller',
      impact: 'Any caller can enumerate and extract personal records belonging to any other user.',
      remediation: 'Verify session ownership or admin privilege before returning the requested record.',
      fixed_code: 'if session.get("user_id") != user_id and session.get("role") != "admin":\n    abort(403)'
    },
    {
      id: 'A04-SECRET-001-1',
      rule_id: 'A04-SECRET-001',
      title: 'Hardcoded Secret Key',
      owasp: 'A04',
      cwe: 'CWE-798',
      severity: 'high',
      confidence: 'likely',
      location: 'app.py:29',
      evidence: 'SECRET_KEY = "ha****************34"',
      impact: 'Session signing key is committed to source control, enabling session forgery.',
      remediation: 'Load secrets from environment variables or a secrets manager.',
      fixed_code: 'SECRET_KEY = os.environ["SECRET_KEY"]'
    },
    {
      id: 'A01-CORS-001-1',
      rule_id: 'A01-CORS-001',
      title: 'CORS Wildcard with Credentials',
      owasp: 'A01',
      cwe: 'CWE-942',
      severity: 'high',
      confidence: 'likely',
      location: 'app.py:38',
      evidence: 'Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true',
      impact: 'Any malicious website can read credentialed responses on behalf of a logged-in user.',
      remediation: 'Restrict origins to an explicit allowlist when credentials are supported.',
      fixed_code: 'if origin in ALLOWED_ORIGINS:\n    response.headers["Access-Control-Allow-Origin"] = origin'
    },
    {
      id: 'A02-DEBUG-001-1',
      rule_id: 'A02-DEBUG-001',
      title: 'Debug Mode Enabled in App Server',
      owasp: 'A02',
      cwe: 'CWE-94',
      severity: 'high',
      confidence: 'confirmed',
      location: 'app.py:149',
      evidence: 'app.run(debug=True, host="0.0.0.0", port=5000)',
      impact: 'Exposes interactive Werkzeug web console on unhandled exceptions, enabling server RCE.',
      remediation: 'Set debug=False in production configurations.',
      fixed_code: 'debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"\napp.run(debug=debug)'
    },
    {
      id: 'A04-WEAKHASH-001-1',
      rule_id: 'A04-WEAKHASH-001',
      title: 'MD5 Used for Password Hashing',
      owasp: 'A04',
      cwe: 'CWE-916',
      severity: 'high',
      confidence: 'likely',
      location: 'app.py:85',
      evidence: 'hashlib.md5(password.encode()).hexdigest()',
      impact: 'MD5 is cryptographically broken and vulnerable to fast GPU rainbow-table collisions.',
      remediation: 'Use PBKDF2-HMAC, bcrypt, or Argon2 with high iteration count.',
      fixed_code: 'hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000)'
    },
    {
      id: 'A10-STACKTRACE-001-1',
      rule_id: 'A10-STACKTRACE-001',
      title: 'Unhandled Stack Trace Returned to Client',
      owasp: 'A10',
      cwe: 'CWE-209',
      severity: 'medium',
      confidence: 'likely',
      location: 'app.py:111',
      evidence: 'return jsonify({"error": str(e), "traceback": traceback.format_exc()})',
      impact: 'Traceback leaks internal source file paths, variable states, and library versions.',
      remediation: 'Log exceptions server-side and return sanitized generic error messages.',
      fixed_code: 'logger.exception("Internal crash")\nreturn jsonify({"error": "An internal error occurred"}), 500'
    },
    {
      id: 'A09-NOLOG-001-1',
      rule_id: 'A09-NOLOG-001',
      title: 'No Logging on Failed Authentication',
      owasp: 'A09',
      cwe: 'CWE-778',
      severity: 'medium',
      confidence: 'possible',
      location: 'app.py:90',
      evidence: 'POST /login — silent rejection on failed credentials without audit log',
      impact: 'Brute-force credential stuffing attacks occur silently without alerts.',
      remediation: 'Log every failed authentication event with timestamp, username, and IP.',
      fixed_code: 'logger.warning("Failed login for %s from %s", username, request.remote_addr)'
    }
  ]
};

export const MOCK_CLEAN_SCAN: ScanResult = {
  target: 'https://github.com/production/hardened-enterprise-service',
  scan_time: '2026-10-24T12:30:00Z',
  score: 100,
  status: 'clean',
  stats: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  },
  chains: [],
  access_matrix: [
    { method: 'GET', path: '/admin', expected: 'admin', actual: 'admin', auth_decorators: ['login_required', 'admin_required'], status: 'OK' },
    { method: 'GET', path: '/user/<int:user_id>', expected: 'owner', actual: 'owner', auth_decorators: ['login_required'], status: 'OK' },
    { method: 'GET', path: '/search', expected: 'authenticated', actual: 'authenticated', auth_decorators: ['login_required'], status: 'OK' },
    { method: 'POST', path: '/login', expected: 'public', actual: 'none', auth_decorators: [], status: 'OK' },
    { method: 'GET', path: '/crash', expected: 'authenticated', actual: 'authenticated', auth_decorators: ['login_required'], status: 'OK' },
    { method: 'GET', path: '/calculate', expected: 'authenticated', actual: 'authenticated', auth_decorators: ['login_required'], status: 'OK' },
    { method: 'GET', path: '/token', expected: 'authenticated', actual: 'authenticated', auth_decorators: ['login_required'], status: 'OK' },
    { method: 'GET', path: '/protected', expected: 'authenticated', actual: 'authenticated', auth_decorators: ['token_required'], status: 'OK' }
  ],
  endpoints: [
    { method: ['GET'], path: '/admin', handler: 'admin_panel', location: 'app.py:87', path_params: [], request_inputs: [], auth_decorators: ['login_required', 'admin_required'], is_protected: true },
    { method: ['GET'], path: '/user/<int:user_id>', handler: 'get_user', location: 'app.py:95', path_params: ['user_id'], request_inputs: [], auth_decorators: ['login_required'], is_protected: true },
    { method: ['GET'], path: '/search', handler: 'search', location: 'app.py:110', path_params: [], request_inputs: ['name'], auth_decorators: ['login_required'], is_protected: true },
    { method: ['POST'], path: '/login', handler: 'login', location: 'app.py:131', path_params: [], request_inputs: ['username', 'password'], auth_decorators: [], is_protected: false },
    { method: ['GET'], path: '/crash', handler: 'crash', location: 'app.py:150', path_params: [], request_inputs: [], auth_decorators: ['login_required'], is_protected: true },
    { method: ['GET'], path: '/calculate', handler: 'calculate', location: 'app.py:162', path_params: [], request_inputs: ['expr'], auth_decorators: ['login_required'], is_protected: true },
    { method: ['GET'], path: '/token', handler: 'make_token', location: 'app.py:177', path_params: [], request_inputs: [], auth_decorators: ['login_required'], is_protected: true },
    { method: ['GET'], path: '/protected', handler: 'protected', location: 'app.py:185', path_params: [], request_inputs: [], auth_decorators: ['token_required'], is_protected: true }
  ],
  findings: []
};
