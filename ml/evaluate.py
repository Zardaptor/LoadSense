"""
evaluate.py - Machine Learning Rigor and Evaluation

Evaluates the trained Bi-LSTM model on the dataset, generating
a detailed Confusion Matrix and F1-Scores to prove model quality.
"""

import os
import sys
import torch
import joblib
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report

from model import EnergyFingerprintNet
from utils import load_and_preprocess

# -------- CONFIG --------
DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "labeled_readings.csv"
)
MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models"
)
WINDOW_SIZE = 10

def main():
    if not os.path.exists(os.path.join(MODELS_DIR, "energy_model.pt")):
        print("[!] Model not found. Run train.py first.")
        sys.exit(1)

    print(f"\n{'='*50}")
    print("  Evaluating Bi-LSTM Model")
    print(f"{'='*50}\n")

    # Load data and artifacts
    X, y, classes = load_and_preprocess(DATA_PATH, MODELS_DIR)
    
    label_encoder = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
    
    model = EnergyFingerprintNet(input_size=4, num_classes=len(classes))
    model.load_state_dict(torch.load(os.path.join(MODELS_DIR, "energy_model.pt"), map_location="cpu"))
    model.eval()

    # Create windows for evaluation
    X_windows = []
    y_true = []
    for i in range(len(X) - WINDOW_SIZE):
        X_windows.append(X[i : i + WINDOW_SIZE])
        y_true.append(y[i + WINDOW_SIZE - 1])

    X_tensor = torch.tensor(np.array(X_windows), dtype=torch.float32)
    
    # Run Inference
    with torch.no_grad():
        logits = model(X_tensor)
        _, y_pred = torch.max(logits, 1)
        
    y_true = np.array(y_true)
    y_pred = y_pred.numpy()
    
    # Generate Classification Report (Precision, Recall, F1)
    report = classification_report(y_true, y_pred, target_names=label_encoder.classes_)
    print("Classification Report:")
    print(report)
    
    with open(os.path.join(MODELS_DIR, "classification_report.txt"), "w") as f:
        f.write(report)

    # Generate Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    
    plt.style.use('dark_background')
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=label_encoder.classes_, 
                yticklabels=label_encoder.classes_)
    
    plt.title("Bi-LSTM Confusion Matrix")
    plt.xlabel("Predicted Appliance")
    plt.ylabel("Actual Appliance")
    plt.tight_layout()
    
    cm_path = os.path.join(MODELS_DIR, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=150)
    plt.close()
    
    print(f"[+] Confusion Matrix saved to: {cm_path}")

if __name__ == "__main__":
    main()
