export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'confirmed' | 'likely' | 'possible';

export interface Finding {
  id: string;
  rule_id: string;
  title: string;
  owasp: string;
  cwe: string;
  severity: Severity;
  confidence: Confidence;
  location: string;
  evidence: string;
  impact: string;
  remediation: string;
  fixed_code?: string;
  ignored?: boolean;
}

export interface Endpoint {
  method: string[];
  path: string;
  handler: string;
  location: string;
  path_params: string[];
  request_inputs: string[];
  auth_decorators: string[];
  is_protected: boolean;
}

export interface AccessMatrixRow {
  method: string;
  path: string;
  expected: string;
  actual: string;
  auth_decorators: string[];
  status: 'OK' | 'VIOLATION' | 'WEAKER' | 'UNCOVERED';
}

export interface AttackChain {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  finding_ids: string[];
  narrative: string;
}

export interface ScanResult {
  target: string;
  scan_time: string;
  stats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  score: number;
  status: 'clean' | 'compromised' | 'warning';
  findings: Finding[];
  endpoints: Endpoint[];
  access_matrix: AccessMatrixRow[];
  chains: AttackChain[];
}
