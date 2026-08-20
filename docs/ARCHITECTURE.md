# KNEE-AI Architecture Specification

## 1. System Pipeline Overview
```mermaid
graph TD
    A[DICOM Knee MRI Study] --> B[pydicom Reader & Metadata Extractor]
    B --> C[Percentile Intensity Normalizer 1st-99th]
    C --> D[2.5D Channel Stacking i-1, i, i+1]
    D --> E[Pretrained EfficientNet-B0 Backbone]
    E --> F[Multi-Label Sigmoid Classifier 12 Target Outputs]
    F --> G{Probability >= Threshold?}
    G -- Yes --> H[Grad-CAM Visual Heatmap Layer]
    G -- No --> I[Structured Findings JSON]
    H --> I
    I --> J[Grounded LLM Summary Engine]
    J --> K[Mandatory Disclaimer Validator]
    K --> L[Streamlit Interactive Clinical Dashboard]
```

## 2. Hard Architectural Rules Enforced
1. **Multi-Label Independence**: 12 independent sigmoid outputs trained with `BCEWithLogitsLoss`. Studies can exhibit multiple co-occurring abnormalities.
2. **Strict Study-Level Validation**: Zero slice or patient identity leakage. Enforced via hard code assertion in `data/loaders/dataset.py`.
3. **2.5D Feature Input**: Stacks consecutive slices $[i-1, i, i+1]$ as a 3-channel input tensor $[3, 224, 224]$, capturing volumetric spatial context with 2D backbone speed.
4. **LLM Data Boundary**: The LLM layer receives ONLY structured JSON (`{finding: probability, evidence: path}`). Raw DICOM pixel arrays are NEVER passed to the LLM.
5. **Mandatory Disclaimer**: Every screen and LLM report renders the exact warning:  
   *"AI-assisted output for research/prototype purposes. Not a medical diagnosis."*
