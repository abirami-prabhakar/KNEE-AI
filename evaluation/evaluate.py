"""
KNEE-AI Phase 3 Evaluation Script
Tier: Tier 2 (Evaluation Metrics)

Loads model checkpoint, runs evaluation on held-out validation split,
and exports presentation-ready per-label evaluation table.
"""

import os
import yaml
import torch
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader
from data.loaders.dataset import study_level_split, KneeMRIDataset
from models.cnn import KneeAbnormalityCNN
from evaluation.metrics import compute_multilabel_metrics

def evaluate_checkpoint(
    checkpoint_path: str = "models/checkpoints/best_model.pt",
    csv_path: str = "data/sample_dataset/train_labels.csv",
    output_csv: str = "evaluation/metrics_report.csv"
):
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint file not found: {checkpoint_path}. Train the model first.")
        
    ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    cfg = ckpt["config"]
    labels = cfg["labels"]
    
    df = pd.read_csv(csv_path)
    _, val_df = study_level_split(df, val_fraction=cfg["data"]["val_fraction"], seed=cfg["data"]["seed"])
    
    val_dataset = KneeMRIDataset(val_df, target_size=tuple(cfg["data"]["target_size"]))
    val_loader = DataLoader(val_dataset, batch_size=cfg["training"]["batch_size"], shuffle=False)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = KneeAbnormalityCNN(
        backbone_name=cfg["model"]["backbone"],
        num_classes=cfg["model"]["num_classes"],
        pretrained=False
    )
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(device)
    model.eval()
    
    all_probs = []
    all_targets = []
    
    with torch.no_grad():
        for images, targets in val_loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.append(probs)
            all_targets.append(targets.numpy())
            
    y_probs = np.concatenate(all_probs, axis=0)
    y_true = np.concatenate(all_targets, axis=0)
    
    metrics_df = compute_multilabel_metrics(y_true, y_probs, labels)
    
    print("\n" + "="*80)
    print(f"KNEE-AI MODEL EVALUATION REPORT (Checkpoint Epoch {ckpt['epoch']})")
    print("="*80)
    print(metrics_df.to_string(index=False))
    print("="*80)
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    metrics_df.to_csv(output_csv, index=False)
    print(f"[+] Saved evaluation report CSV to: {output_csv}")
    return metrics_df

if __name__ == "__main__":
    evaluate_checkpoint()
