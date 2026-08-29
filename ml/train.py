"""
train.py - Train the Bi-LSTM model on labeled energy data

Includes ML Rigor:
- Trains a baseline Random Forest model for comparison.
- Tracks and plots the Bi-LSTM training loss curve.
"""

import torch
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

from dataset import EnergyDataset
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
BATCH_SIZE = 32
EPOCHS = 50
LR = 0.001


def main():
    if not os.path.exists(DATA_PATH):
        print(f"[!] Training data not found: {DATA_PATH}")
        sys.exit(1)

    X, y, classes = load_and_preprocess(DATA_PATH, MODELS_DIR)

    if len(classes) < 2:
        print(f"[!] Need at least 2 device classes, found {len(classes)}.")
        sys.exit(1)

    # ==============================================================
    # 1. BASELINE MODEL (Random Forest)
    # Proves why we need Deep Learning instead of basic ML
    # ==============================================================
    print(f"\n{'='*50}")
    print("  Training Baseline Model (Random Forest)")
    print(f"{'='*50}")
    
    # Create flattened sliding windows for traditional ML
    X_baseline = []
    y_baseline = []
    for i in range(len(X) - WINDOW_SIZE):
        X_baseline.append(X[i : i + WINDOW_SIZE].flatten())
        y_baseline.append(y[i + WINDOW_SIZE - 1])
        
    X_base = np.array(X_baseline)
    y_base = np.array(y_baseline)
    
    # Train/test split for baseline
    split_idx = int(len(X_base) * 0.8)
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X_base[:split_idx], y_base[:split_idx])
    
    rf_preds = rf.predict(X_base[split_idx:])
    baseline_acc = accuracy_score(y_base[split_idx:], rf_preds)
    
    print(f"  Baseline Random Forest Accuracy: {baseline_acc*100:.1f}%")
    
    # Save baseline metrics for the dashboard
    with open(os.path.join(MODELS_DIR, "baseline_metrics.txt"), "w") as f:
        f.write(f"{baseline_acc:.4f}")

    # ==============================================================
    # 2. DEEP LEARNING MODEL (Bi-LSTM)
    # ==============================================================
    dataset = EnergyDataset(X, y, window_size=WINDOW_SIZE)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    device = torch.device("cpu")
    model = EnergyFingerprintNet(input_size=4, num_classes=len(classes)).to(device)

    # Class weights for imbalance
    class_counts = np.bincount(y)
    class_weights = len(y) / (len(classes) * class_counts)
    class_weights = torch.tensor(class_weights, dtype=torch.float32).to(device)

    criterion = torch.nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)

    print(f"\n{'='*50}")
    print("  Training Bi-LSTM Model")
    print(f"{'='*50}\n")

    best_acc = 0
    epoch_losses = []
    epoch_accuracies = []

    for epoch in range(EPOCHS):
        total_loss = 0
        correct = 0
        total = 0

        model.train()
        for batch_X, batch_y in loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)

            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == batch_y).sum().item()
            total += batch_y.size(0)

        avg_loss = total_loss / len(loader)
        acc = 100.0 * correct / total
        
        epoch_losses.append(avg_loss)
        epoch_accuracies.append(acc)
        best_acc = max(best_acc, acc)

        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  Epoch {epoch+1:3d}/{EPOCHS} | Loss: {avg_loss:.4f} | Acc: {acc:.1f}%")

    # Save model weights
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, "energy_model.pt")
    torch.save(model.state_dict(), model_path)

    # ==============================================================
    # 3. GENERATE ML METRICS PLOTS
    # ==============================================================
    plt.style.use('dark_background')
    fig, ax1 = plt.subplots(figsize=(8, 4))

    color = '#1f77b4'
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss', color=color)
    ax1.plot(epoch_losses, color=color, linewidth=2, label='Training Loss')
    ax1.tick_params(axis='y', labelcolor=color)

    ax2 = ax1.twinx()  
    color = '#2ca02c'
    ax2.set_ylabel('Accuracy (%)', color=color)
    ax2.plot(epoch_accuracies, color=color, linewidth=2, linestyle='--', label='Accuracy')
    ax2.tick_params(axis='y', labelcolor=color)

    plt.title("Bi-LSTM Training History")
    fig.tight_layout()
    plt.savefig(os.path.join(MODELS_DIR, "training_history.png"), dpi=150)
    plt.close()

    print(f"\n{'='*50}")
    print(f"  Training Complete!")
    print(f"  Baseline RF Accuracy: {baseline_acc*100:.1f}%")
    print(f"  Bi-LSTM Accuracy:     {best_acc:.1f}%")
    print(f"  Improvement:          {best_acc - (baseline_acc*100):.1f}%")
    print(f"  Artifacts saved to: {MODELS_DIR}/")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
