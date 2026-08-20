"""
KNEE-AI Phase 5 Inference Engine
Tier: Tier 1 (Inference Engine)

Chains the end-to-end processing pipeline:
DICOM folder -> Preprocessing -> Model Predictions -> Grad-CAM Evidence -> Grounded LLM Summary
Does NOT depend on radiology report text.
"""

import os
import glob
import numpy as np
import torch
import pydicom
from typing import Dict, Any
from data.preprocessing.preprocess import load_dicom_slice, build_2d5_stack, normalize_intensity, resize_slice
from models.cnn import KneeAbnormalityCNN
from explainability.gradcam import generate_gradcam_heatmap
from nlp.llm import build_findings_json, generate_summary

TARGET_LABELS = [
    "ACL injury", "MCL injury", "Medial meniscus tear", "Lateral meniscus tear",
    "Medial OA", "Lateral OA", "Patellofemoral OA", "Effusion", "Synovitis",
    "Baker's cyst", "Bone contusion", "Fracture"
]

def run_inference(
    dicom_folder_path: str,
    checkpoint_path: str = "models/checkpoints/best_model.pt",
    gradcam_output_dir: str = "app/static/gradcam_output",
    confidence_threshold: float = 0.5
) -> Dict[str, Any]:
    if not os.path.exists(dicom_folder_path):
        raise FileNotFoundError(f"DICOM study folder does not exist: {dicom_folder_path}")
        
    dcm_files = sorted(glob.glob(os.path.join(dicom_folder_path, "*.dcm")))
    if not dcm_files:
        raise ValueError(f"No DICOM (.dcm) files found in {dicom_folder_path}")
        
    slices = [load_dicom_slice(f) for f in dcm_files]
    num_slices = len(slices)
    mid_idx = num_slices // 2
    
    # Process center 2.5D stack for primary study-level classification
    stack_2d5 = build_2d5_stack(slices, mid_idx, target_size=(224, 224))
    input_tensor = torch.from_numpy(stack_2d5).unsqueeze(0).float()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if os.path.exists(checkpoint_path):
        ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
        model = KneeAbnormalityCNN(backbone_name=ckpt["config"]["model"]["backbone"], num_classes=12, pretrained=False)
        model.load_state_dict(ckpt["model_state_dict"])
    else:
        model = KneeAbnormalityCNN(backbone_name="efficientnet_b0", num_classes=12, pretrained=True)
        
    model.to(device)
    model.eval()
    
    input_tensor = input_tensor.to(device)
    with torch.no_grad():
        logits = model(input_tensor)
        probs = torch.sigmoid(logits).cpu().numpy()[0]
        
    predictions = {lbl: float(probs[i]) for i, lbl in enumerate(TARGET_LABELS)}
    
    # Prepare all slices normalized for 3D Volume Viewer
    processed_volume_slices = [resize_slice(normalize_intensity(s), (224, 224)) for s in slices]
    
    os.makedirs(gradcam_output_dir, exist_ok=True)
    evidence_paths = {}
    volume_gradcam_paths = {} # label -> list of paths per slice
    
    for i, (lbl, prob) in enumerate(predictions.items()):
        if prob >= confidence_threshold:
            clean_lbl = lbl.replace(" ", "_").replace("'", "").lower()
            evidence_paths[lbl] = os.path.join(gradcam_output_dir, f"{clean_lbl}_gradcam.png")
            
            # Generate slice-level heatmaps across the volume
            slice_heatmap_paths = []
            for slice_idx in range(num_slices):
                slice_stack = build_2d5_stack(slices, slice_idx, target_size=(224, 224))
                slice_tensor = torch.from_numpy(slice_stack).unsqueeze(0).float().to(device)
                out_path = os.path.join(gradcam_output_dir, f"{clean_lbl}_slice_{slice_idx}.png")
                try:
                    generate_gradcam_heatmap(model, slice_tensor, target_label_idx=i, output_path=out_path)
                    slice_heatmap_paths.append(out_path)
                except Exception as e:
                    print(f"[!] Grad-CAM skipped for slice {slice_idx}: {e}")
                    slice_heatmap_paths.append(None)
                    
            volume_gradcam_paths[lbl] = slice_heatmap_paths
            if slice_heatmap_paths[mid_idx]:
                evidence_paths[lbl] = slice_heatmap_paths[mid_idx]
                
    findings_json = build_findings_json(predictions, evidence_paths)
    summary_text = generate_summary(findings_json, high_thresh=confidence_threshold)
    center_img = processed_volume_slices[mid_idx]
    
    return {
        "predictions": predictions,
        "evidence_paths": evidence_paths,
        "summary": summary_text,
        "findings_json": findings_json,
        "center_slice": center_img,
        "volume_slices": processed_volume_slices,
        "volume_gradcams": volume_gradcam_paths,
        "num_slices": num_slices
    }
