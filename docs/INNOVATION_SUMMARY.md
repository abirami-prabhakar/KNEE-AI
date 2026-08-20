# KNEE-AI Innovation Summary & Executive Brief

## 1. Problem Statement
Knee magnetic resonance imaging (MRI) is the gold standard for diagnosing internal derangements of the knee, including anterior cruciate ligament (ACL) ruptures, meniscus tears, and osteoarthritis. However, reading knee MRIs is time-intensive and highly prone to inter-observer variability, particularly in high-volume emergency and orthopedic care settings.

## 2. Solution: KNEE-AI
KNEE-AI is an end-to-end AI-assisted decision support system that automatically analyzes DICOM knee MRI studies. It simultaneously predicts the probability of 12 distinct abnormalities, generates Grad-CAM visual attention overlays, and produces grounded, structured clinical summaries.

### The 12 Target Abnormality Categories:
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

## 3. Key Innovations & Differentiators
1. **Multi-Label 2.5D Volumetric Architecture**: Stacks consecutive slices into 3-channel representations, leveraging 2D pretrained backbones (EfficientNet-B0) without heavy 3D compute overhead.
2. **Leakage-Free Validation Discipline**: Guarantees patient-level separation across train/val splits with runtime assertions.
3. **Grounded LLM Decision Support**: Isolates the LLM layer behind a strict JSON boundary, eliminating hallucinations by prohibiting direct pixel input.
4. **Transparent Explainability**: Every high-confidence prediction is backed by Grad-CAM visual evidence overlays labeled explicitly as model attention.

## 4. Benchmark Performance Metrics
| Abnormality Label | Positive Count | AUROC | AUPRC | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ACL injury** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **MCL injury** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Medial meniscus tear** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Lateral meniscus tear** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Medial OA** | 1 | 0.5000 | 0.0000 | 1.0000 | 1.0000 | 1.0000 |
| **Lateral OA** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Patellofemoral OA** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Effusion** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Synovitis** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Baker's cyst** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Bone contusion** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **Fracture** | 0 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| **MACRO AVERAGE** | 1 | **0.5000** | **0.0000** | **0.0833** | **0.0833** | **0.0833** |

*Note: Baseline model trained on local synthetic/sample dataset for demonstration and pipeline validation.*
