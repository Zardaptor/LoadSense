"""
utils.py - Data preprocessing utilities for LoadSense ML pipeline

Handles:
- Loading labeled CSV data
- Feature extraction and weighting
- Label encoding (device names -> integers)
- Feature scaling (StandardScaler)
- Saving/loading preprocessing artifacts (scaler, encoder, weights)
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os


def load_and_preprocess(csv_path, models_dir="models"):
    """
    Load labeled CSV, encode labels, scale features, and save artifacts.

    The CSV MUST have these columns:
        vrms, irms, power, wh, device_id

    If your CSV uses 'apparent_power' instead of 'power', it will be auto-renamed.

    Args:
        csv_path: path to labeled_readings.csv
        models_dir: directory to save scaler, encoder, etc.

    Returns:
        X: scaled feature array, shape (N, 4)
        y: integer label array, shape (N,)
        classes: list of device names (e.g., ['Bulb-60W', 'Charger', 'Iron'])
    """
    os.makedirs(models_dir, exist_ok=True)
    df = pd.read_csv(csv_path)

    # Handle alternative column names
    if "apparent_power" in df.columns and "power" not in df.columns:
        df["power"] = df["apparent_power"]

    # The 4 features used by the model
    feature_cols = ["vrms", "irms", "power", "wh"]

    # Validate columns exist
    missing = [c for c in feature_cols + ["device_id"] if c not in df.columns]
    if missing:
        raise ValueError(
            f"Missing columns in CSV: {missing}\n"
            f"Available columns: {list(df.columns)}\n"
            f"Required: {feature_cols + ['device_id']}"
        )

    X = df[feature_cols].values

    # -------- FEATURE WEIGHTING --------
    # Amplify irms (column index 1) because it's the most distinctive
    # feature per appliance. A 60W bulb draws ~0.26A, a charger ~0.18A,
    # a soldering iron ~1.5A. Multiplying by 3 separates them better.
    irms_weight = 3.0
    X[:, 1] = X[:, 1] * irms_weight
    joblib.dump(irms_weight, os.path.join(models_dir, "irms_weight.pkl"))

    # -------- LABEL ENCODING --------
    # Convert device names to integers: "Bulb-60W" -> 0, "Charger" -> 1, etc.
    le = LabelEncoder()
    y = le.fit_transform(df["device_id"].values)
    joblib.dump(le, os.path.join(models_dir, "label_encoder.pkl"))

    # -------- FEATURE SCALING --------
    # StandardScaler: zero mean, unit variance. Critical for LSTM convergence.
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    joblib.dump(scaler, os.path.join(models_dir, "scaler.pkl"))

    print(f"[*] Classes: {list(le.classes_)}")
    print(f"[*] Samples per class: {dict(zip(le.classes_, np.bincount(y)))}")
    print(f"[*] Total samples: {len(X)}")
    print(f"[*] Features shape: {X.shape}")

    return X, y, le.classes_
