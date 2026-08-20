"""
KNEE-AI Evaluation Metrics
Tier: Tier 2 (Evaluation Metrics)

Computes per-label AUROC, AUPRC, Precision, Recall, and F1 score using scikit-learn.
Outputs clean formatted evaluation tables.
"""

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc, precision_score, recall_score, f1_score
from typing import Dict, List, Any

def compute_multilabel_metrics(y_true: np.ndarray, y_probs: np.ndarray, label_names: List[str], threshold: float = 0.5) -> pd.DataFrame:
    """
    Computes per-label performance metrics.
    y_true: binary targets [N, 12]
    y_probs: predicted probabilities [N, 12]
    """
    results = []
    
    for i, label in enumerate(label_names):
        yt = y_true[:, i]
        yp = y_probs[:, i]
        y_pred = (yp >= threshold).astype(int)
        
        # AUROC
        try:
            auroc = roc_auc_score(yt, yp) if len(np.unique(yt)) > 1 else 0.5
        except Exception:
            auroc = 0.5
            
        # AUPRC
        try:
            prec_arr, rec_arr, _ = precision_recall_curve(yt, yp)
            auprc = auc(rec_arr, prec_arr) if len(np.unique(yt)) > 1 else 0.0
        except Exception:
            auprc = 0.0
            
        prec = precision_score(yt, y_pred, zero_division=0)
        rec = recall_score(yt, y_pred, zero_division=0)
        f1 = f1_score(yt, y_pred, zero_division=0)
        pos_count = int(np.sum(yt))
        
        results.append({
            "Abnormality Label": label,
            "Positive Count": pos_count,
            "AUROC": round(float(auroc), 4),
            "AUPRC": round(float(auprc), 4),
            "Precision": round(float(prec), 4),
            "Recall": round(float(rec), 4),
            "F1 Score": round(float(f1), 4)
        })
        
    df_results = pd.DataFrame(results)
    
    # Compute Macro Average
    macro_row = {
        "Abnormality Label": "MACRO AVERAGE",
        "Positive Count": int(np.sum(y_true)),
        "AUROC": round(float(df_results["AUROC"].mean()), 4),
        "AUPRC": round(float(df_results["AUPRC"].mean()), 4),
        "Precision": round(float(df_results["Precision"].mean()), 4),
        "Recall": round(float(df_results["Recall"].mean()), 4),
        "F1 Score": round(float(df_results["F1 Score"].mean()), 4)
    }
    
    df_results = pd.concat([df_results, pd.DataFrame([macro_row])], ignore_index=True)
    return df_results
