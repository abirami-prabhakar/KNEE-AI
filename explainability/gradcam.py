"""
KNEE-AI Phase 4 Grad-CAM Visual Explainability Module
Tier: Tier 3 (Explainability & Visual Evidence)

Generates Grad-CAM visual attention overlays for MRI slices targeting specified abnormality outputs.
Grad-CAM heatmaps are labeled explicitly as 'Model Attention / Supporting Evidence'.
"""

import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

def get_target_layer(model: nn.Module) -> nn.Module:
    """Find the final convolutional layer of the backbone for Grad-CAM."""
    if hasattr(model, "backbone"):
        if hasattr(model.backbone, "features"): # EfficientNet
            return model.backbone.features[-1]
        elif hasattr(model.backbone, "layer4"): # ResNet
            return model.backbone.layer4[-1]
    raise ValueError("Could not automatically locate final convolutional layer for Grad-CAM.")

def generate_gradcam_heatmap(
    model: nn.Module,
    input_tensor: torch.Tensor,
    target_label_idx: int,
    output_path: str = None
) -> np.ndarray:
    """
    Generates Grad-CAM visual evidence overlay image.
    input_tensor: shape [1, 3, H, W]
    Returns RGB uint8 image array of overlay.
    """
    model.eval()
    target_layer = get_target_layer(model)
    targets = [ClassifierOutputTarget(target_label_idx)]
    
    with GradCAM(model=model, target_layers=[target_layer]) as cam:
        grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0] # [H, W]
        
    # Convert input tensor center slice to RGB [0,1] image
    center_slice = input_tensor[0, 1].cpu().numpy() # [H, W]
    p_low, p_high = np.percentile(center_slice, (1, 99))
    if p_high > p_low:
        norm_slice = np.clip((center_slice - p_low) / (p_high - p_low), 0.0, 1.0)
    else:
        norm_slice = center_slice
        
    rgb_slice = np.stack([norm_slice]*3, axis=-1)
    
    visualization = show_cam_on_image(rgb_slice, grayscale_cam, use_rgb=True)
    
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.figure(figsize=(6, 6))
        plt.imshow(visualization)
        plt.title(f"Grad-CAM (Model Attention / Supporting Evidence)\nTarget Index: {target_label_idx}")
        plt.axis("off")
        plt.savefig(output_path, bbox_inches="tight", dpi=150)
        plt.close()
        
    return visualization
