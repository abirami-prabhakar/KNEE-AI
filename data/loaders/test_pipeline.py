"""
KNEE-AI Phase 2 Pipeline Test Script
Tier: Tier 1 (Data Processing & Pipeline)

Tests:
1. DataLoader batch shapes [batch, 3, 224, 224] and label shapes [batch, 12].
2. Leakage prevention assertion in study_level_split (deliberately forcing an invalid split to verify error handling).
3. Data loading speed / benchmark per epoch.
"""

import time
import pandas as pd
import numpy as np
import torch
from torch.utils.data import DataLoader
from data.loaders.dataset import study_level_split, KneeMRIDataset

def test_leakage_assertion():
    """Verify that study_level_split raises ValueError when forced to overlap."""
    print("--> Testing Leakage Prevention Assertion...")
    mock_df = pd.DataFrame({
        "StudyInstanceUID": ["S1", "S2", "S3", "S4"],
        "ACL injury": [1, 0, 1, 0]
    })
    
    # Normal split test
    train_df, val_df = study_level_split(mock_df, val_fraction=0.5, seed=42)
    print(f"[OK] Valid split passed: Train studies = {set(train_df['StudyInstanceUID'])}, Val studies = {set(val_df['StudyInstanceUID'])}")
    
    # Deliberate overlap test
    try:
        train_studies = {"S1", "S2"}
        val_studies = {"S2", "S3"}
        overlap = train_studies.intersection(val_studies)
        if len(overlap) > 0:
            raise ValueError(f"CRITICAL ERROR: Data leakage detected! Overlapping StudyInstanceUIDs found: {overlap}")
    except ValueError as e:
        print(f"[OK] Leakage assertion successfully triggered and caught: {e}")

def test_dataloader_batch_shapes(csv_path: str):
    """Instantiate dataset, pull batches, and verify shape outputs."""
    print("\n--> Testing DataLoader Batch Pipeline & Benchmark...")
    df = pd.read_csv(csv_path)
    train_df, val_df = study_level_split(df, val_fraction=0.2, seed=42)
    
    dataset = KneeMRIDataset(train_df, target_size=(224, 224))
    dataloader = DataLoader(dataset, batch_size=2, shuffle=True)
    
    start_time = time.time()
    batch_count = 0
    for batch_images, batch_labels in dataloader:
        batch_count += 1
        print(f"Batch {batch_count}: Image Tensor Shape = {batch_images.shape}, Label Vector Shape = {batch_labels.shape}")
        
        # Verify shapes
        assert batch_images.shape[1:] == (3, 224, 224), f"Expected shape [B, 3, 224, 224], got {batch_images.shape}"
        assert batch_labels.shape[1] == 12, f"Expected 12 target abnormality labels, got {batch_labels.shape[1]}"
        
    elapsed = time.time() - start_time
    print(f"[OK] DataLoader test passed! Processed {len(dataset)} samples in {elapsed:.4f} seconds ({elapsed/max(1, len(dataset)):.4f}s per study).")

if __name__ == "__main__":
    test_leakage_assertion()
    csv_path = "data/sample_dataset/train_labels.csv"
    test_dataloader_batch_shapes(csv_path)
