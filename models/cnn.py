"""
KNEE-AI Phase 3 Model Architecture
Tier: Tier 1 (Core ML Model)

Pretrained 2.5D EfficientNet backbone with global pooling and 12 linear outputs.
Returns raw logits without final sigmoid activation for BCEWithLogitsLoss compatibility.
"""

import torch
import torch.nn as nn
import torchvision.models as models

class KneeAbnormalityCNN(nn.Module):
    def __init__(self, backbone_name: str = "efficientnet_b0", num_classes: int = 12, pretrained: bool = True):
        super(KneeAbnormalityCNN, self).__init__()
        self.backbone_name = backbone_name
        self.num_classes = num_classes
        
        if backbone_name == "efficientnet_b0":
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            base_model = models.efficientnet_b0(weights=weights)
            in_features = base_model.classifier[1].in_features
            base_model.classifier = nn.Identity()
            self.backbone = base_model
        elif backbone_name == "resnet18":
            weights = models.ResNet18_Weights.DEFAULT if pretrained else None
            base_model = models.resnet18(weights=weights)
            in_features = base_model.fc.in_features
            base_model.fc = nn.Identity()
            self.backbone = base_model
        else:
            raise ValueError(f"Unsupported backbone architecture: {backbone_name}")
            
        self.classifier = nn.Linear(in_features, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        logits = self.classifier(features)
        return logits
