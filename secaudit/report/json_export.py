"""
report/json_export.py — JSON serialiser for scan results.

Writes the full ScanResult to a JSON file that can be used by:
  - secaudit compare before.json after.json
  - CI pipelines for policy-as-code
  - External tools
"""

from __future__ import annotations

import json
from pathlib import Path

from secaudit.models import ScanResult


def write_json_report(result: ScanResult, output_path: str) -> None:
    """
    Serialise the ScanResult to a pretty-printed JSON file.

    Parameters
    ----------
    result      : The completed scan result.
    output_path : Where to write the JSON file.
    """
    result.compute_stats()
    data = result.to_dict()
    Path(output_path).write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
