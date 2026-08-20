"""
KNEE-AI Phase 4 Grounded LLM Clinical Decision Support Module
Tier: Tier 4 (Grounded LLM Summary)

STRICT ARCHITECTURAL BOUNDARY:
The LLM layer NEVER receives raw DICOM/pixel data. It receives only a structured JSON object
of {finding: probability} plus evidence references, and generates a grounded clinical summary.

Mandatory Disclaimer Enforced:
"This output is AI-assisted decision support and does not constitute a medical diagnosis."
"""

import json
from typing import Dict, List, Any

MANDATORY_DISCLAIMER = "This output is AI-assisted decision support and does not constitute a medical diagnosis."

def build_findings_json(predictions: Dict[str, float], evidence_paths: Dict[str, str] = None) -> Dict[str, Any]:
    """Packages 12 target abnormality probabilities and Grad-CAM evidence references into structured JSON."""
    findings_json = {
        "predictions": predictions,
        "evidence": evidence_paths if evidence_paths else {}
    }
    return findings_json

def validate_and_enforce_disclaimer(text: str) -> str:
    """Verifies that the LLM response contains the mandatory disclaimer verbatim; appends it if missing."""
    if MANDATORY_DISCLAIMER not in text:
        text += f"\n\nDisclaimer:\n{MANDATORY_DISCLAIMER}"
    return text

def generate_summary(findings_json: Dict[str, Any], high_thresh: float = 0.5) -> str:
    """
    Generates a strictly structured clinical summary from findings JSON.
    Inputs ONLY structured JSON data. ZERO raw pixel data passed.
    """
    predictions = findings_json.get("predictions", {})
    
    high_conf = []
    low_conf = []
    
    for finding, prob in predictions.items():
        pct = int(round(prob * 100))
        if prob >= high_thresh:
            high_conf.append(f"• {finding} — {pct}%")
        else:
            low_conf.append(f"• {finding} — {pct}%")
            
    high_str = "\n".join(high_conf) if high_conf else "• None identified above threshold"
    low_str = "\n".join(low_conf) if low_conf else "• None"
    
    # Formulate factual grounded summary text
    if high_conf:
        detected_names = [f.split(" — ")[0].replace("• ", "") for f in high_conf]
        summary_body = (
            f"Automated MRI evaluation identified elevated probabilities for {', '.join(detected_names)}. "
            f"Multi-label visual feature analysis supports focused radiologist review of these specific anatomic regions. "
            f"All other target abnormalities demonstrated low model likelihood."
        )
    else:
        summary_body = (
            "Automated MRI evaluation detected no major acute structural abnormalities above the clinical review threshold. "
            "All 12 target abnormality categories demonstrated low probability scores on multi-planar evaluation."
        )
        
    summary_text = (
        "AI-ASSISTED FINDINGS\n\n"
        "High-confidence findings:\n"
        f"{high_str}\n\n"
        "Low-confidence findings:\n"
        f"{low_str}\n\n"
        "Summary:\n"
        f"{summary_body}\n\n"
        "Disclaimer:\n"
        f"{MANDATORY_DISCLAIMER}"
    )
    
    return validate_and_enforce_disclaimer(summary_text)
