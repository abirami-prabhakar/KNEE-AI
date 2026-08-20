"""
KNEE-AI Phase 2 Preprocessing Module
Tier: Tier 1 (Data Processing & Pipeline)

Provides slice intensity normalization, resizing, and 2.5D multi-slice context construction.
"""

import os
import glob
import numpy as np
import cv2
import pydicom
from typing import List, Tuple, Union

def load_dicom_slice(file_path: str) -> np.ndarray:
    """Load single DICOM file as float32 numpy array."""
    dcm = pydicom.dcmread(file_path)
    return dcm.pixel_array.astype(np.float32)

def normalize_intensity(img: np.ndarray, low_pct: float = 1.0, high_pct: float = 99.0) -> np.ndarray:
    """Percentile-based intensity normalization to [0, 1]."""
    p_low, p_high = np.percentile(img, (low_pct, high_pct))
    if p_high > p_low:
        norm = np.clip((img - p_low) / (p_high - p_low), 0.0, 1.0)
    else:
        norm = np.zeros_like(img, dtype=np.float32)
    return norm.astype(np.float32)

def resize_slice(img: np.ndarray, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """Resize slice image to target dimensions."""
    return cv2.resize(img, target_size, interpolation=cv2.INTER_LINEAR)

def build_2d5_stack(slices: List[np.ndarray], index: int, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Build a 3-channel 2.5D input tensor from slice (index-1, index, index+1).
    Boundary slices are padded by repeating edge slices.
    Returns array of shape [3, height, width].
    """
    n_slices = len(slices)
    idx_prev = max(0, index - 1)
    idx_curr = index
    idx_next = min(n_slices - 1, index + 1)
    
    img_prev = resize_slice(normalize_intensity(slices[idx_prev]), target_size)
    img_curr = resize_slice(normalize_intensity(slices[idx_curr]), target_size)
    img_next = resize_slice(normalize_intensity(slices[idx_next]), target_size)
    
    # Stack along channels: shape [3, H, W]
    stack_2d5 = np.stack([img_prev, img_curr, img_next], axis=0)
    return stack_2d5
