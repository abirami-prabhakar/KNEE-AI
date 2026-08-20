"""
KNEE-AI Standard Library REST Server & Static Frontend Host
Exposes run_inference() via JSON REST endpoint without external framework dependencies (FastAPI/Uvicorn).
"""

import os
import sys
import glob
import json
import zipfile
import tempfile
import base64
from email.parser import BytesParser
from email.policy import default
from io import BytesIO
from urllib.parse import parse_qs, urlparse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image
import numpy as np

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from models.inference import run_inference

def image_to_base64(img_input) -> str:
    """Converts a file path or PIL/NumPy image to base64 string."""
    if isinstance(img_input, str):
        if not os.path.exists(img_input):
            return ""
        with open(img_input, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"
    elif isinstance(img_input, np.ndarray):
        img = Image.fromarray(img_input.astype('uint8'))
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
    return ""

class KneeAIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        static_dir = os.path.join(os.path.dirname(__file__), "static")
        super().__init__(*args, directory=static_dir, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/samples":
            sample_dir = os.path.join(ROOT_DIR, "data", "sample_dataset")
            studies = sorted(glob.glob(os.path.join(sample_dir, "study_*")))
            if not studies:
                from data.loaders.generate_sample_data import generate_sample_dataset
                generate_sample_dataset(sample_dir, num_studies=3)
                studies = sorted(glob.glob(os.path.join(sample_dir, "study_*")))
            
            payload = [{"id": os.path.basename(s), "path": s} for s in studies]
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return
            
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/predict":
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            
            # Simple multipart/form-data & urlencoded parser
            sample_id = None
            confidence_threshold = 0.5
            uploaded_bytes = None
            
            content_type = self.headers.get('Content-Type', '')
            if 'multipart/form-data' in content_type:
                msg_bytes = f"Content-Type: {content_type}\r\n\r\n".encode('utf-8') + body_bytes
                msg = BytesParser(policy=default).parsebytes(msg_bytes)
                for part in msg.iter_parts():
                    cd = part.get("Content-Disposition", "")
                    if 'name="sample_id"' in cd:
                        sample_id = part.get_content().strip()
                    elif 'name="confidence_threshold"' in cd:
                        try:
                            confidence_threshold = float(part.get_content().strip())
                        except:
                            pass
                    elif 'name="file"' in cd:
                        uploaded_bytes = part.get_payload(decode=True)
            else:
                params = parse_qs(body_bytes.decode('utf-8'))
                sample_id = params.get('sample_id', [None])[0]
                if 'confidence_threshold' in params:
                    confidence_threshold = float(params['confidence_threshold'][0])

            target_dir = None
            if uploaded_bytes:
                temp_dir = tempfile.mkdtemp()
                zip_path = os.path.join(temp_dir, "uploaded.zip")
                with open(zip_path, "wb") as f:
                    f.write(uploaded_bytes)
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Check if DICOMs are extracted at top level or nested inside a subfolder
                dcm_files = glob.glob(os.path.join(temp_dir, "*.dcm"))
                if not dcm_files:
                    sub_dcms = glob.glob(os.path.join(temp_dir, "**", "*.dcm"), recursive=True)
                    if sub_dcms:
                        target_dir = os.path.dirname(sub_dcms[0])
                    else:
                        target_dir = temp_dir
                else:
                    target_dir = temp_dir
            elif sample_id:
                target_dir = os.path.join(ROOT_DIR, "data", "sample_dataset", sample_id)
                
            if not target_dir or not os.path.exists(target_dir):
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid study target directory"}).encode('utf-8'))
                return

            ckpt_path = os.path.join(ROOT_DIR, "models", "checkpoints", "best_model.pt")
            raw_res = run_inference(
                dicom_folder_path=target_dir,
                checkpoint_path=ckpt_path,
                confidence_threshold=confidence_threshold
            )

            num_slices = raw_res.get("num_slices", 0)
            volume_slices = raw_res.get("volume_slices", [])
            volume_gradcams = raw_res.get("volume_gradcams", {})
            predictions = raw_res.get("predictions", {})

            encoded_slices = [image_to_base64(s) for s in volume_slices]
            encoded_heatmaps = {}
            evidence_ranges = {}

            for lbl, heat_paths in volume_gradcams.items():
                encoded_heatmaps[lbl] = [image_to_base64(p) if p else "" for p in heat_paths]
                valid_indices = [idx for idx, p in enumerate(heat_paths) if p and os.path.exists(p)]
                if valid_indices:
                    evidence_ranges[lbl] = [min(valid_indices), max(valid_indices)]

            high_conf = [f"{lbl} ({prob*100:.1f}%)" for lbl, prob in predictions.items() if prob >= confidence_threshold]
            low_conf = [f"{lbl} ({prob*100:.1f}%)" for lbl, prob in predictions.items() if 0.2 <= prob < confidence_threshold]

            payload = {
                "num_slices": num_slices,
                "slices": encoded_slices,
                "heatmaps": encoded_heatmaps,
                "findings": predictions,
                "evidence_ranges": evidence_ranges,
                "summary": {
                    "high_confidence": high_conf,
                    "low_confidence": low_conf,
                    "text": raw_res.get("summary", ""),
                    "disclaimer": "⚠️ AI-assisted output for research/prototype purposes. Not a medical diagnosis."
                }
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, KneeAIHandler)
    print(f"[+] KNEE-AI Clinical Server running on http://localhost:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()

