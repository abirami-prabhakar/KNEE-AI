"""
Synthetic DICOM and Dataset Generator for KNEE-AI local testing.
Generates compliant DICOM headers and mock knee MRI image arrays.
"""

import os
import pydicom
from pydicom.dataset import Dataset, FileDataset
from pydicom.uid import ExplicitVRLittleEndian, generate_uid
import numpy as np
import pandas as pd

TARGET_LABELS = [
    "ACL injury", "MCL injury", "Medial meniscus tear", "Lateral meniscus tear",
    "Medial OA", "Lateral OA", "Patellofemoral OA", "Effusion", "Synovitis",
    "Baker's cyst", "Bone contusion", "Fracture"
]

def create_synthetic_dicom(filename: str, study_uid: str, series_uid: str, instance_num: int):
    file_meta = Dataset()
    file_meta.MediaStorageSOPClassUID = "1.2.840.10008.5.1.4.1.1.4" # MR Image Storage
    file_meta.MediaStorageSOPInstanceUID = generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    
    ds = FileDataset(filename, {}, file_meta=file_meta, preamble=b"\0" * 128)
    ds.PatientName = "Synthetic^Patient"
    ds.PatientID = f"PAT_{study_uid[:8]}"
    ds.StudyInstanceUID = study_uid
    ds.SeriesInstanceUID = series_uid
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.SOPClassUID = file_meta.MediaStorageSOPClassUID
    ds.Modality = "MR"
    ds.SeriesDescription = "Sagittal T2 Fat-Sat"
    ds.EchoTime = 60.0
    ds.RepetitionTime = 2500.0
    ds.InstanceNumber = instance_num
    
    ds.Rows = 224
    ds.Columns = 224
    ds.BitsAllocated = 16
    ds.BitsStored = 12
    ds.HighBit = 11
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    
    # Synthetic gradient image resembling knee MRI slice
    arr = np.zeros((224, 224), dtype=np.uint16)
    cv_x, cv_y = 112, 112
    y, x = np.ogrid[:224, :224]
    dist_from_center = np.sqrt((x - cv_x)**2 + (y - cv_y)**2)
    arr = np.clip(2000 - dist_from_center * 15 + np.random.normal(0, 50, (224, 224)), 0, 4095).astype(np.uint16)
    
    ds.PixelData = arr.tobytes()
    ds.save_as(filename, write_like_original=False)

def generate_sample_dataset(data_dir: str = "data/sample_dataset", num_studies: int = 5):
    os.makedirs(data_dir, exist_ok=True)
    rows = []
    
    for s_idx in range(num_studies):
        study_uid = f"1.2.840.12345.study.{s_idx+1}"
        series_uid = f"1.2.840.12345.series.{s_idx+1}.1"
        study_folder = os.path.join(data_dir, f"study_{s_idx+1}")
        os.makedirs(study_folder, exist_ok=True)
        
        # Generate 5 slices per study
        slice_paths = []
        for i in range(1, 6):
            dcm_path = os.path.join(study_folder, f"slice_{i}.dcm")
            create_synthetic_dicom(dcm_path, study_uid, series_uid, i)
            slice_paths.append(dcm_path)
            
        label_vals = np.random.choice([0, 1], size=len(TARGET_LABELS), p=[0.75, 0.25])
        row = {
            "StudyInstanceUID": study_uid,
            "SeriesInstanceUID": series_uid,
            "StudyFolder": study_folder
        }
        for lbl, val in zip(TARGET_LABELS, label_vals):
            row[lbl] = val
        rows.append(row)
        
    df = pd.DataFrame(rows)
    csv_path = os.path.join(data_dir, "train_labels.csv")
    df.to_csv(csv_path, index=False)
    print(f"[+] Successfully generated synthetic dataset in {data_dir} with CSV: {csv_path}")
    return csv_path, data_dir

if __name__ == "__main__":
    generate_sample_dataset()
