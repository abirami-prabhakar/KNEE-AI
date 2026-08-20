"""
KNEE-AI Radiology Report Parser (DEVELOPMENT & WEAK-LABELING ONLY)
Tier: Tier 4 (NLP & Report Utilities)

DEVELOPMENT-TIME ONLY DISCLAIMER:
This module is used ONLY during dataset prep/training experiments to extract weak labels
from unstructured radiology report text. It is NEVER called in the runtime inference
pipeline (models/inference.py) or Streamlit dashboard.
"""

import re
from typing import Dict

TARGET_LABELS = [
    "ACL injury", "MCL injury", "Medial meniscus tear", "Lateral meniscus tear",
    "Medial OA", "Lateral OA", "Patellofemoral OA", "Effusion", "Synovitis",
    "Baker's cyst", "Bone contusion", "Fracture"
]

def parse_radiology_report(report_text: str) -> Dict[str, str]:
    """
    Extracts weak label statuses (positive / negative / not_mentioned) for the 12 target findings.
    NOTE: NEVER CALLED DURING END-TO-END INFERENCE.
    """
    report_lower = report_text.lower()
    extracted_status = {}
    
    rules = {
        "ACL injury": [r"acl tear", r"anterior cruciate ligament injury", r"acl disruption"],
        "MCL injury": [r"mcl tear", r"medial collateral ligament injury", r"mcl sprain"],
        "Medial meniscus tear": [r"medial meniscus tear", r"tear of medial meniscus", r"complex medial meniscus"],
        "Lateral meniscus tear": [r"lateral meniscus tear", r"tear of lateral meniscus"],
        "Medial OA": [r"medial compartment osteoarthritis", r"medial joint space narrowing"],
        "Lateral OA": [r"lateral compartment osteoarthritis", r"lateral joint space narrowing"],
        "Patellofemoral OA": [r"patellofemoral osteoarthritis", r"patellar cartilage loss"],
        "Effusion": [r"joint effusion", r"knee effusion", r"fluid accumulation"],
        "Synovitis": [r"synovitis", r"synovial thickening"],
        "Baker's cyst": [r"baker's cyst", r"baker cyst", r"popliteal cyst"],
        "Bone contusion": [r"bone contusion", r"marrow edema", r"trabecular fracture"],
        "Fracture": [r"fracture", r"cortical disruption"]
    }
    
    negations = [r"no evidence of", r"without", r"intact", r"unremarkable", r"negative for"]
    
    for label in TARGET_LABELS:
        patterns = rules.get(label, [label.lower()])
        status = "not_mentioned"
        
        for pat in patterns:
            if re.search(pat, report_lower):
                # Check for negation preceding pattern
                is_negated = False
                for neg in negations:
                    neg_pat = rf"{neg}\s+[\w\s]{{0,30}}{pat}"
                    if re.search(neg_pat, report_lower):
                        is_negated = True
                        break
                status = "negative" if is_negated else "positive"
                break
                
        extracted_status[label] = status
        
    return extracted_status
