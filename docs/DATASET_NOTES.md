# KNEE-AI Dataset Findings & Notes
**Phase**: Phase 1 — Dataset Exploration  
**Tier**: Tier 1 (Data Processing & Pipeline)

## 1. Abnormality Label Distribution (12 Target Findings)
Analysis of knee MRI studies shows substantial class imbalance across target abnormalities:
- **High Prevalence Findings**: Joint Effusion, Medial Meniscus Tear, Osteoarthritis (Medial/Lateral).
- **Low Prevalence / Rare Findings**: Patellofemoral OA, Bone Contusion, Fracture, Synovitis.
- **Handling Imbalance**: We recommend per-class positive weighting (`pos_weight`) in PyTorch `BCEWithLogitsLoss` during model training to avoid severe gradient bias towards negative slices.

## 2. DICOM Series Metadata Analysis
- **Average Series per Study**: ~3 to 5 sequence types per knee study (Sagittal T2 Fat-Sat, Sagittal T1, Coronal PD/T2, Axial T2).
- **Clinically Useful Sequence Combination**:
  - **Sagittal + Fluid-Sensitive (TE > 40ms) + Fat-Suppressed**: Most sensitive sequence for cruciate ligaments (ACL/MCL), meniscus tears, and bone marrow edema/contusions.
  - **Coronal Sequences**: Essential for collateral ligament integrity (MCL/LCL) and meniscus body assessment.
  - **Axial Sequences**: Best suited for patellofemoral joint osteoarthritis and joint effusions.

## 3. Data Quality & Preprocessing Decisions
- **Slice Resolution**: DICOM raw pixel arrays range from 256x256 to 512x512 with 12-bit to 16-bit intensity depth.
- **Intensity Normalization**: Raw HU/MR values vary significantly across scanners. 1st–99th percentile clipping followed by min-max scaling to `[0, 1]` effectively standardizes signal intensity.
- **Input Strategy**: A 2.5D channel stacking approach ($i-1, i, i+1$) preserves inter-slice spatial continuity while leveraging 2D pretrained backbones (EfficientNet-B0/ResNet-18) without 3D memory penalties.
