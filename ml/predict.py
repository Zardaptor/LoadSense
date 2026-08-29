"""
predict.py - Run inference with the trained Bi-LSTM model

Loads saved model artifacts and provides a predict_device() function
that takes a window of sensor readings and returns the predicted appliance.

Usage:
    from predict import predict_device
    device_name, confidence = predict_device(window)
"""

import torch
import joblib
import numpy as np
import os
from model import EnergyFingerprintNet

# -------- LOAD ARTIFACTS --------
MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models"
)


def _load_model():
    """Load all saved model artifacts. Called once on import."""
    scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
    label_encoder = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
    irms_weight = joblib.load(os.path.join(MODELS_DIR, "irms_weight.pkl"))

    model = EnergyFingerprintNet(num_classes=len(label_encoder.classes_))
    model.load_state_dict(torch.load(
        os.path.join(MODELS_DIR, "energy_model.pt"),
        map_location=torch.device("cpu")
    ))
    model.eval()

    return model, scaler, label_encoder, irms_weight


# Load on import
try:
    _model, _scaler, _label_encoder, _irms_weight = _load_model()
    MODEL_LOADED = True
except Exception as e:
    MODEL_LOADED = False
    print(f"[!] Could not load model: {e}")
    print("[!] Run train.py first to train the model.")


def predict_device(window):
    """
    Predict which device is active given a window of readings.

    Args:
        window: numpy array of shape (window_size, 4)
                columns: [vrms, irms, power, wh]

    Returns:
        tuple: (device_name: str, confidence: float)
               e.g., ("Bulb-60W", 0.94)
    """
    if not MODEL_LOADED:
        return "Unknown", 0.0

    window = window.copy()
    window[:, 1] = window[:, 1] * _irms_weight  # Apply same weight as training
    window = _scaler.transform(window)
    window = torch.tensor(window, dtype=torch.float32).unsqueeze(0)  # Add batch dim

    with torch.no_grad():
        logits = _model(window)
        probs = torch.softmax(logits, dim=1)
        confidence, pred = torch.max(probs, dim=1)

    device_name = _label_encoder.inverse_transform([pred.item()])[0]
    return device_name, confidence.item()


# -------- CLI TEST --------
if __name__ == "__main__":
    print("Testing prediction with random data...")
    fake_window = np.random.rand(10, 4) * [230, 1, 100, 0.1]
    name, conf = predict_device(fake_window)
    print(f"Predicted: {name} (confidence: {conf:.1%})")
