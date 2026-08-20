# KNEE-AI Demo Speaker Notes (2–3 Minute Presentation Script)

## [0:00 - 0:30] Introduction & Problem
"Good day judges. Today we are excited to present **KNEE-AI**, an end-to-end AI decision-support system designed to assist radiologists and clinicians in detecting 12 major knee MRI abnormalities. Reading knee MRIs requires evaluating multiple anatomical planes across high-volume slice series. KNEE-AI accelerates this workflow with instant multi-label abnormality screening and transparent visual evidence."

## [0:30 - 1:15] Live Demo: Upload & Probability List
*(Action: Open Streamlit App -> Select Sample Study / Upload DICOM -> Click 'Run Abnormality Inference')*

"Here on our clinical dashboard, we select a DICOM knee study and initiate inference. Behind the scenes, our 2.5D multi-channel EfficientNet backbone processes normalized slice sequences. In seconds, KNEE-AI outputs a color-coded probability distribution across all 12 target findings—including ACL injuries, meniscus tears, joint effusion, and osteoarthritis."

## [1:15 - 1:50] Visual Explainability (Grad-CAM)
*(Action: Select a high-confidence finding, e.g. Medial OA or MCL Injury -> Display Grad-CAM overlay)*

"Crucially, KNEE-AI is not a black box. When a finding exceeds our clinical threshold, the system automatically generates Grad-CAM heatmaps highlighting the exact region of model attention on the MRI slice. Radiologists can inspect these supporting overlays to verify structural abnormalities."

## [1:50 - 2:30] Grounded LLM Summary & Conclusion
*(Action: Highlight AI-Assisted Grounded Summary block & footer disclaimer)*

"Finally, our grounded LLM layer packages these probabilities into a structured clinical summary. Notice our strict architectural boundary: the LLM receives only structured JSON findings—never raw DICOM pixels—preventing medical hallucination. Furthermore, every output carries our persistent clinical disclaimer."

"To conclude: **KNEE-AI does not replace the radiologist. It provides automated study-level abnormality screening and interpretable AI-assisted findings for clinical review.** Thank you!"
