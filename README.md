# 🦴 KNEE-AI — AI-Assisted Knee MRI Abnormality Detection

**KNEE-AI** is an end-to-end AI system designed for knee MRI abnormality detection and clinical decision support. It ingests multi-slice DICOM knee MRI studies, predicts the multi-label probability of 12 distinct structural abnormalities, generates Grad-CAM visual attention heatmaps, and produces grounded clinical summaries.

---

##  Target Abnormality Labels (12 Target Outputs)
1. ACL injury
2. MCL injury
3. Medial meniscus tear
4. Lateral meniscus tear
5. Medial Osteoarthritis (OA)
6. Lateral Osteoarthritis (OA)
7. Patellofemoral Osteoarthritis (OA)
8. Joint Effusion
9. Synovitis
10. Baker's cyst
11. Bone contusion
12. Fracture

---

## Architecture & Core Rules
- **Multi-Label Sigmoid Outputs**: 12 independent binary classifications using `BCEWithLogitsLoss`.
- **Strict Study-Level Validation Split**: Enforces patient identity isolation via code assertions in `data/loaders/dataset.py`.
- **2.5D Volumetric Input**: Stacks 3 consecutive slices $[i-1, i, i+1]$ into `[3, 224, 224]` input tensors.
- **Strict LLM Boundary**: Grounded summary engine receives ONLY structured JSON (`{finding: probability}`). Raw DICOM pixel arrays are NEVER sent to the LLM.
- **Mandatory Disclaimer**: Every screen and report renders:
  > *"AI-assisted output for research/prototype purposes. Not a medical diagnosis."*

---

##  Repository Structure
```
KNEE-AI/
├── app/
│   ├── app.py                 # Streamlit Dashboard UI
│   └── static/                # Grad-CAM rendered artifacts
├── data/
│   ├── preprocessing/         # Intensity norm & 2.5D slice stacking
│   └── loaders/               # DICOM loader, study-level split, datasets
├── models/
│   ├── cnn.py                 # EfficientNet 2.5D Backbone
│   ├── train.py               # BCEWithLogitsLoss training loop
│   ├── inference.py           # End-to-end inference engine
│   └── checkpoints/           # Model weights
├── explainability/
│   └── gradcam.py             # Grad-CAM heatmap overlay generator
├── nlp/
│   ├── report_parser.py       # Weak-label parser (dev-only)
│   └── llm.py                 # Grounded LLM summary generator
├── evaluation/
│   ├── metrics.py             # AUROC, AUPRC, F1 metric computations
│   └── evaluate.py            # Checkpoint evaluation script
├── configs/
│   └── config.yaml            # Master hyperparameter settings
├── docs/                      # Dataset notes, architecture & speaker notes
├── requirements.txt           # Project dependencies
├── README.md
└── LICENSE
```

---

##  Quickstart Guide

### 1. Setup & Installation
```bash
git clone https://github.com/your-username/KNEE-AI.git
cd KNEE-AI
pip install -r requirements.txt
```

### 2. Generate Synthetic Demo Data & Explore Dataset
```bash
python data/loaders/generate_sample_data.py
python data/loaders/explore_dataset.py --csv_path data/sample_dataset/train_labels.csv --dicom_path data/sample_dataset/study_1/slice_1.dcm
```

### 3. Verify Data Pipeline & Leakage Assertion
```bash
python -m data.loaders.test_pipeline
```

### 4. Train Model & Run Evaluation
```bash
python -m models.train
python -m evaluation.evaluate
```

### 5. Launch Streamlit Clinical Dashboard
```bash
streamlit run app/app.py
```

---

##  License
MIT License. See `LICENSE` for details.

*Disclaimer: AI-assisted output for research/prototype purposes. Not a medical diagnosis.*
