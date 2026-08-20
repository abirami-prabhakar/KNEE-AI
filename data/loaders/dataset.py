"""
KNEE-AI Phase 2 Dataset & DataLoader Module
Tier: Tier 1 (Data Processing & Pipeline)

Enforces strict study-level train/validation splitting with assertion checking.
"""

import os
import glob
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import List, Tuple, Dict
from data.preprocessing.preprocess import load_dicom_slice, build_2d5_stack

TARGET_LABELS = [
    "ACL injury", "MCL injury", "Medial meniscus tear", "Lateral meniscus tear",
    "Medial OA", "Lateral OA", "Patellofemoral OA", "Effusion", "Synovitis",
    "Baker's cyst", "Bone contusion", "Fracture"
]

def study_level_split(df: pd.DataFrame, val_fraction: float = 0.2, seed: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Splits dataset strictly at the StudyInstanceUID level to prevent slice/patient leakage.
    Raises ValueError if any StudyInstanceUID overlaps between train and val splits.
    """
    if "StudyInstanceUID" not in df.columns:
        raise ValueError("DataFrame must contain 'StudyInstanceUID' column for study-level splitting.")
        
    unique_studies = df["StudyInstanceUID"].unique()
    np.random.seed(seed)
    np.random.shuffle(unique_studies)
    
    n_val = int(len(unique_studies) * val_fraction)
    val_studies = set(unique_studies[:n_val])
    train_studies = set(unique_studies[n_val:])
    
    # Non-negotiable leakage check assertion
    overlap = train_studies.intersection(val_studies)
    if len(overlap) > 0:
        raise ValueError(f"CRITICAL ERROR: Data leakage detected! Overlapping StudyInstanceUIDs found: {overlap}")
        
    train_df = df[df["StudyInstanceUID"].isin(train_studies)].reset_index(drop=True)
    val_df = df[df["StudyInstanceUID"].isin(val_studies)].reset_index(drop=True)
    
    # Re-verify assertion on generated dataframes
    assert set(train_df["StudyInstanceUID"]).isdisjoint(set(val_df["StudyInstanceUID"])), \
        "Assertion Failure: StudyInstanceUID overlap detected between train and val DataFrames!"
        
    return train_df, val_df

class KneeMRIDataset(Dataset):
    """
    PyTorch Dataset for Knee MRI Abnormality Detection.
    Loads DICOM slice files from study directory and returns 2.5D tensors [3, H, W] and label vector [12].
    """
    def __init__(self, df: pd.DataFrame, target_size: Tuple[int, int] = (224, 224)):
        self.df = df
        self.target_size = target_size
        self.samples = []
        self._prepare_samples()

    def _prepare_samples(self):
        for idx, row in self.df.iterrows():
            study_folder = row.get("StudyFolder", None)
            if not study_folder or not os.path.exists(study_folder):
                continue
                
            dcm_files = sorted(glob.glob(os.path.join(study_folder, "*.dcm")))
            if not dcm_files:
                continue
                
            # Extract 12 label binary values
            label_vec = [float(row.get(lbl, 0.0)) for lbl in TARGET_LABELS]
            
            # Add center slice sample per study
            mid_idx = len(dcm_files) // 2
            self.samples.append({
                "study_uid": row["StudyInstanceUID"],
                "dcm_files": dcm_files,
                "slice_idx": mid_idx,
                "label": np.array(label_vec, dtype=np.float32)
            })

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]
        dcm_files = sample["dcm_files"]
        slice_idx = sample["slice_idx"]
        
        slices = [load_dicom_slice(f) for f in dcm_files]
        stack_2d5 = build_2d5_stack(slices, slice_idx, target_size=self.target_size)
        
        tensor_img = torch.from_numpy(stack_2d5).float() # [3, H, W]
        tensor_label = torch.from_numpy(sample["label"]).float() # [12]
        
        return tensor_img, tensor_label
