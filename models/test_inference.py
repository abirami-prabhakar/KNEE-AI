"""
Test script for models/inference.py
"""

from models.inference import run_inference

if __name__ == "__main__":
    results = run_inference("data/sample_dataset/study_1")
    print("--> End-to-End Inference Verification:")
    print(f"Predictions Count: {len(results['predictions'])}")
    print(f"Sample Predictions: {list(results['predictions'].items())[:3]}")
    print("\nGenerated Grounded Summary:\n")
    print(results['summary'])
