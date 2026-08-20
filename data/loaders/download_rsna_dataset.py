"""
KNEE-AI Automated RSNA Kaggle Dataset Downloader
Tier: Tier 1 (Data Pipeline)

Automates downloading and extracting the RSNA Knee Abnormality Detection competition dataset.
Competition: rsna-knee-abnormality-detection
"""

import os
import sys
import zipfile
import subprocess

COMPETITION_NAME = "rsna-knee-abnormality-detection"
DATA_DIR = "data/raw"

def check_kaggle_installed():
    """Verify kaggle library is installed."""
    try:
        import kaggle
        return True
    except ImportError:
        print("[!] Kaggle package not installed. Installing kaggle via pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "kaggle"])
        return True

def verify_kaggle_credentials():
    """Check if kaggle.json token exists in default user directory."""
    home = os.path.expanduser("~")
    kaggle_dir = os.path.join(home, ".kaggle")
    kaggle_json = os.path.join(kaggle_dir, "kaggle.json")
    
    if not os.path.exists(kaggle_json):
        print("\n" + "="*70)
        print("[!] KAGGLE API TOKEN NOT FOUND!")
        print("="*70)
        print(f"Expected path: {kaggle_json}")
        print("\nFollow these 3 simple steps to download automatically:")
        print("1. Log in to Kaggle: https://www.kaggle.com")
        print("2. Go to Account Settings -> API -> Click 'Create New API Token'")
        print(f"3. Place the downloaded 'kaggle.json' file into: {kaggle_dir}")
        print("="*70 + "\n")
        return False
    return True

def download_and_extract_competition_dataset(target_dir: str = DATA_DIR):
    """Download competition files via Kaggle CLI and unzip them."""
    if not check_kaggle_installed():
        return
        
    if not verify_kaggle_credentials():
        sys.exit(1)
        
    os.makedirs(target_dir, exist_ok=True)
    print(f"[+] Downloading '{COMPETITION_NAME}' dataset into '{target_dir}'...")
    
    try:
        # Download competition dataset using kaggle CLI
        cmd = f"kaggle competitions download -c {COMPETITION_NAME} -p {target_dir}"
        print(f"[+] Executing: {cmd}")
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        print("[+] Download complete!")
        
        # Extract any zip files downloaded
        for file in os.listdir(target_dir):
            if file.endswith(".zip"):
                zip_path = os.path.join(target_dir, file)
                print(f"[+] Extracting {file}...")
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(target_dir)
                print(f"[+] Extracted: {file}")
                
        print(f"\n[✓] RSNA Dataset successfully downloaded and ready at: {os.path.abspath(target_dir)}")
        
    except subprocess.CalledProcessError as e:
        print(f"[!] Error downloading dataset: {e.stderr}")
        print("[!] Note: Make sure you have accepted the competition rules on Kaggle:")
        print(f"    https://www.kaggle.com/competitions/{COMPETITION_NAME}/rules")

if __name__ == "__main__":
    download_and_extract_competition_dataset()
