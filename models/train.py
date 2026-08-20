"""
KNEE-AI Phase 3 Training Pipeline
Tier: Tier 1 (Core ML Model)
"""

import os
import yaml
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from data.loaders.dataset import study_level_split, KneeMRIDataset
from models.cnn import KneeAbnormalityCNN

def load_config(config_path: str = "configs/config.yaml") -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def calculate_pos_weights(df: pd.DataFrame, target_labels: list) -> torch.Tensor:
    pos_counts = []
    total_samples = len(df)
    for lbl in target_labels:
        pos = (df[lbl] == 1).sum()
        neg = total_samples - pos
        pos_weight = neg / max(1, pos)
        pos_counts.append(pos_weight)
    return torch.tensor(pos_counts, dtype=torch.float32)

def train_model(config_path: str = "configs/config.yaml", csv_path: str = "data/sample_dataset/train_labels.csv"):
    cfg = load_config(config_path)
    labels = cfg["labels"]
    
    df = pd.read_csv(csv_path)
    train_df, val_df = study_level_split(df, val_fraction=cfg["data"]["val_fraction"], seed=cfg["data"]["seed"])
    
    train_dataset = KneeMRIDataset(train_df, target_size=tuple(cfg["data"]["target_size"]))
    val_dataset = KneeMRIDataset(val_df, target_size=tuple(cfg["data"]["target_size"]))
    
    train_loader = DataLoader(train_dataset, batch_size=cfg["training"]["batch_size"], shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=cfg["training"]["batch_size"], shuffle=False)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = KneeAbnormalityCNN(
        backbone_name=cfg["model"]["backbone"],
        num_classes=cfg["model"]["num_classes"],
        pretrained=cfg["model"]["pretrained"]
    ).to(device)
    
    pos_weight = calculate_pos_weights(train_df, labels).to(device) if cfg["training"]["use_pos_weight"] else None
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["training"]["learning_rate"], weight_decay=cfg["training"]["weight_decay"])
    
    os.makedirs(cfg["model"]["checkpoint_dir"], exist_ok=True)
    best_val_loss = float("inf")
    
    for epoch in range(1, cfg["training"]["epochs"] + 1):
        model.train()
        train_loss = 0.0
        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(images)
            
        train_loss /= max(1, len(train_dataset))
        
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                logits = model(images)
                loss = criterion(logits, targets)
                val_loss += loss.item() * len(images)
                
        val_loss /= max(1, len(val_dataset))
        
        print(f"Epoch [{epoch:>2}/{cfg['training']['epochs']}] | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            ckpt_path = os.path.join(cfg["model"]["checkpoint_dir"], "best_model.pt")
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "config": cfg
            }, ckpt_path)

if __name__ == "__main__":
    train_model()
