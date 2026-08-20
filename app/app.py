"""
KNEE-AI Phase 5 Streamlit Application
Tier: Tier 5 (Polished Streamlit Dashboard UI)

Interactive Web Interface for Knee MRI Abnormality Screening & Explainable AI Reports.
"""

import os
import sys

# Critical fix for Streamlit Cloud deployment: add root directory to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import glob
import zipfile
import tempfile
import numpy as np
import matplotlib.pyplot as plt
import streamlit as st
from PIL import Image

from models.inference import run_inference

st.set_page_config(
    page_title="KNEE-AI | Knee MRI Screening",
    page_icon="🦴",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #E2E8F0;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.0rem;
        color: #94A3B8;
        margin-bottom: 1.5rem;
    }
    .disclaimer-footer {
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100%;
        background-color: #0F172A;
        color: #F87171;
        text-align: center;
        padding: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        border-top: 1px solid #334155;
        z-index: 9999;
    }
    .prob-card {
        padding: 10px 14px;
        border-radius: 8px;
        margin-bottom: 8px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
    }
    .prob-high { background-color: #7F1D1D; color: #FCA5A5; border-left: 5px solid #EF4444; }
    .prob-mod { background-color: #7C2D12; color: #FDBA74; border-left: 5px solid #F97316; }
    .prob-low { background-color: #713F12; color: #FDE047; border-left: 5px solid #EAB308; }
    .prob-neg { background-color: #14532D; color: #86EFAC; border-left: 5px solid #22C55E; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">🦴 KNEE-AI — MRI Abnormality Detection</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">AI-Assisted Knee MRI Screening & Interpretable Decision Support Pipeline</div>', unsafe_allow_html=True)

st.sidebar.header("📁 MRI Data Input")
input_option = st.sidebar.radio("Select Study Source:", ["Use Sample Study", "Upload DICOM Folder (ZIP)"])

dicom_target_dir = None

if input_option == "Use Sample Study":
    sample_studies = sorted(glob.glob(os.path.join(ROOT_DIR, "data", "sample_dataset", "study_*")))
    if sample_studies:
        selected_study = st.sidebar.selectbox("Select Sample Study:", sample_studies)
        dicom_target_dir = selected_study
    else:
        st.sidebar.warning("Generating sample study...")
        from data.loaders.generate_sample_data import generate_sample_dataset
        sample_dir = os.path.join(ROOT_DIR, "data", "sample_dataset")
        generate_sample_dataset(sample_dir, num_studies=3)
        sample_studies = sorted(glob.glob(os.path.join(sample_dir, "study_*")))
        dicom_target_dir = sample_studies[0] if sample_studies else None
else:
    uploaded_file = st.sidebar.file_uploader("Upload DICOM ZIP file:", type=["zip"])
    if uploaded_file is not None:
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, "uploaded.zip")
        with open(zip_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
            
        dicom_target_dir = temp_dir

conf_threshold = st.sidebar.slider("Confidence Threshold for Grad-CAM:", min_value=0.1, max_value=0.9, value=0.5, step=0.05)

if dicom_target_dir and st.sidebar.button("⚡ Run Abnormality Inference", type="primary"):
    with st.spinner("Analyzing MRI slices, running EfficientNet inference & generating Grad-CAM visual evidence..."):
        try:
            ckpt_path = os.path.join(ROOT_DIR, "models", "checkpoints", "best_model.pt")
            results = run_inference(
                dicom_folder_path=dicom_target_dir,
                checkpoint_path=ckpt_path,
                confidence_threshold=conf_threshold
            )
            st.session_state["results"] = results
            st.success("Inference complete!")
        except Exception as e:
            st.error(f"Inference Error: {str(e)}")

if "results" in st.session_state:
    res = st.session_state["results"]
    preds = res["predictions"]
    ev_paths = res["evidence_paths"]
    summary = res["summary"]
    center_img = res["center_slice"]
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("📊 Abnormality Probabilities (12 Target Labels)")
        for label, prob in preds.items():
            pct = prob * 100
            if pct >= 70:
                cls_name = "prob-high"
            elif pct >= 40:
                cls_name = "prob-mod"
            elif pct >= 20:
                cls_name = "prob-low"
            else:
                cls_name = "prob-neg"
                
            st.markdown(
                f'<div class="prob-card {cls_name}"><span>{label}</span><span>{pct:.1f}%</span></div>',
                unsafe_allow_html=True
            )
            
    with col2:
        st.subheader("🔍 3D MRI Volume & Model Attention Viewer")
        
        num_slices = res.get("num_slices", 1)
        volume_slices = res.get("volume_slices", [center_img])
        volume_gradcams = res.get("volume_gradcams", {})
        
        # Interactive Volume Slider
        selected_slice_idx = st.slider("Scrub MRI Slice Volume:", min_value=0, max_value=num_slices - 1, value=num_slices // 2, step=1)
        
        slice_col1, slice_col2 = st.columns(2)
        with slice_col1:
            st.image(volume_slices[selected_slice_idx], caption=f"MRI Slice {selected_slice_idx + 1} / {num_slices}", use_container_width=True)
            
        with slice_col2:
            if ev_paths and volume_gradcams:
                selected_finding = st.selectbox("Select Finding Heatmap:", list(volume_gradcams.keys()))
                slice_heatmaps = volume_gradcams.get(selected_finding, [])
                if selected_slice_idx < len(slice_heatmaps) and slice_heatmaps[selected_slice_idx] and os.path.exists(slice_heatmaps[selected_slice_idx]):
                    st.image(slice_heatmaps[selected_slice_idx], caption=f"Grad-CAM ({selected_finding}) - Slice {selected_slice_idx + 1}", use_container_width=True)
                else:
                    st.info("No heatmap available for this slice.")
            else:
                st.info("No findings exceeded the confidence threshold for Grad-CAM visualization.")
            
    st.markdown("---")
    st.subheader("📋 AI-Assisted Grounded Summary")
    st.code(summary, language="text")

st.markdown(
    '<div class="disclaimer-footer">⚠️ AI-assisted output for research/prototype purposes. Not a medical diagnosis.</div>',
    unsafe_allow_html=True
)
