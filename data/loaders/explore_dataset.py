"""
KNEE-AI Phase 1: Dataset Exploration Script
Tier: Tier 1 (Data Processing & Pipeline)

This script:
1. Loads training CSV metadata into Pandas.
2. Reports study counts, series distributions, label prevalence for all 12 target abnormalities.
3. Reads DICOM metadata via pydicom (SeriesInstanceUID, Anatomical_Plane, Fluid_Sensitive, Fat_Suppression).
4. Renders sample slice visuals to notebooks/sample_slices/.
"""

import os
import argparse
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import pydicom
from typing import Dict, List, Any

TARGET_LABELS = [
    "ACL injury", "MCL injury", "Medial meniscus tear", "Lateral meniscus tear",
    "Medial OA", "Lateral OA", "Patellofemoral OA", "Effusion", "Synovitis",
    "Baker's cyst", "Bone contusion", "Fracture"
]

def explore_csv_metadata(csv_path: str) -> pd.DataFrame:
    """Load and analyze label distributions from CSV."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found at: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print("=" * 60)
    print(f"DATASET METADATA SUMMARY: {csv_path}")
    print("=" * 60)
    print(f"Total Rows/Series: {len(df)}")
    
    if "StudyInstanceUID" in df.columns:
        num_studies = df["StudyInstanceUID"].nunique()
        print(f"Unique Studies: {num_studies}")
        series_per_study = len(df) / num_studies if num_studies > 0 else 0
        print(f"Average Series per Study: {series_per_study:.2f}")
    
    print("\n--- Label Distribution (12 Target Abnormalities) ---")
    present_labels = [label for label in TARGET_LABELS if label in df.columns]
    
    for label in present_labels:
        pos_count = (df[label] == 1).sum()
        total_valid = df[label].dropna().count()
        pos_rate = (pos_count / total_valid * 100) if total_valid > 0 else 0.0
        print(f"{label:<25}: {pos_count:>5} positive ({pos_rate:>5.2f}%) | Missing: {df[label].isna().sum()}")
    
    return df

def extract_dicom_metadata(dicom_path: str) -> Dict[str, Any]:
    """Extract key DICOM metadata tags relevant to knee MRI interpretation."""
    dcm = pydicom.dcmread(dicom_path, stop_before_pixels=True)
    
    def get_tag(tag_name, default="Unknown"):
        return str(getattr(dcm, tag_name, default))
    
    metadata = {
        "SeriesInstanceUID": get_tag("SeriesInstanceUID"),
        "StudyInstanceUID": get_tag("StudyInstanceUID"),
        "SeriesDescription": get_tag("SeriesDescription"),
        "Modality": get_tag("Modality"),
        "PatientID": get_tag("PatientID"),
        "Anatomical_Plane": get_tag("ImageOrientationPatient", "Unknown"),
        "EchoTime": get_tag("EchoTime"),
        "RepetitionTime": get_tag("RepetitionTime"),
        "FlipAngle": get_tag("FlipAngle"),
        "Fluid_Sensitive": "Yes" if float(getattr(dcm, "EchoTime", 0) or 0) > 40 else "No/Unspecified",
        "Fat_Suppression": "Yes" if "fat" in get_tag("SeriesDescription").lower() or "sat" in get_tag("SeriesDescription").lower() else "Unknown"
    }
    return metadata

def save_sample_slice(dicom_path: str, output_path: str):
    """Load DICOM pixel array, normalize intensity, and save to PNG for visual inspection."""
    dcm = pydicom.dcmread(dicom_path)
    pixel_array = dcm.pixel_array.astype(np.float32)
    
    # 1st to 99th percentile intensity normalization
    p1, p99 = np.percentile(pixel_array, (1, 99))
    if p99 > p1:
        norm_array = np.clip((pixel_array - p1) / (p99 - p1), 0.0, 1.0)
    else:
        norm_array = pixel_array
    
    plt.figure(figsize=(6, 6))
    plt.imshow(norm_array, cmap="gray")
    plt.title(f"DICOM Slice: {os.path.basename(dicom_path)}\nShape: {pixel_array.shape}")
    plt.axis("off")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, bbox_inches="tight", dpi=150)
    plt.close()
    print(f"[+] Saved sample slice plot to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KNEE-AI Dataset Exploration Tool")
    parser.add_argument("--csv_path", type=str, help="Path to training CSV file", default=None)
    parser.add_argument("--dicom_path", type=str, help="Path to sample DICOM file", default=None)
    parser.add_argument("--output_dir", type=str, help="Output directory for sample slice images", default="notebooks/sample_slices")
    
    args = parser.parse_args()
    
    if args.csv_path and os.path.exists(args.csv_path):
        explore_csv_metadata(args.csv_path)
        
    if args.dicom_path and os.path.exists(args.dicom_path):
        meta = extract_dicom_metadata(args.dicom_path)
        print("\n--- Sample DICOM Metadata ---")
        for k, v in meta.items():
            print(f"{k:<20}: {v}")
        
        sample_out = os.path.join(args.output_dir, "sample_dicom_slice.png")
        save_sample_slice(args.dicom_path, sample_out)
