"""
simulate_fault.py - Electrical Fault Simulator

Mathematically simulates physical electrical faults (Arc Faults & Stalls)
and passes them through the trained Autoencoder to calculate real-time
anomaly scores. Proves the Predictive Maintenance capabilities.
"""

import os
import sys
import torch
import numpy as np
import matplotlib.pyplot as plt
from train_autoencoder import GridAutoencoder, SAMPLES_PER_CYCLE

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

def generate_arc_fault(num_cycles=10):
    """Simulates a loose wire causing high-frequency series arc faults."""
    t = np.linspace(0, 1, SAMPLES_PER_CYCLE, endpoint=False)
    data = []
    
    for _ in range(num_cycles):
        wave = np.sin(2 * np.pi * t)
        
        # Arc faults often happen near the zero-crossing or peaks, injecting chaotic high-frequency noise
        arc_noise = np.random.normal(0, 0.4, SAMPLES_PER_CYCLE)
        
        # Apply noise primarily where voltage is high enough to sustain the arc
        active_arc = np.abs(wave) > 0.3
        wave += arc_noise * active_arc
        
        data.append(wave)
    return np.array(data, dtype=np.float32)

def generate_healthy(num_cycles=10):
    t = np.linspace(0, 1, SAMPLES_PER_CYCLE, endpoint=False)
    data = []
    for _ in range(num_cycles):
        wave = np.sin(2 * np.pi * t)
        wave += np.random.normal(0, 0.01, SAMPLES_PER_CYCLE) # Just ADC noise
        data.append(wave)
    return np.array(data, dtype=np.float32)

def main():
    model_path = os.path.join(MODELS_DIR, "autoencoder.pt")
    threshold_path = os.path.join(MODELS_DIR, "ae_threshold.txt")
    
    if not os.path.exists(model_path):
        print("[!] Autoencoder not trained yet. Run train_autoencoder.py first.")
        sys.exit(1)
        
    model = GridAutoencoder()
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    
    with open(threshold_path, "r") as f:
        threshold = float(f.read())
        
    print(f"[*] Baseline Anomaly Threshold: {threshold:.6f}")
    
    # Generate Test Data (50 cycles healthy, then 50 cycles Arc Fault)
    healthy_data = generate_healthy(50)
    faulty_data = generate_arc_fault(50)
    
    test_data = np.concatenate([healthy_data, faulty_data])
    test_tensor = torch.tensor(test_data)
    
    # Run Inference
    with torch.no_grad():
        reconstructed = model(test_tensor)
        mse = torch.mean((reconstructed - test_tensor)**2, dim=1).numpy()
        
    print("\n--- RESULTS ---")
    print(f"Max MSE (Healthy): {np.max(mse[:50]):.6f}")
    print(f"Max MSE (Fault):   {np.max(mse[50:]):.6f}")
    
    # Plot the detection
    plt.style.use('dark_background')
    plt.figure(figsize=(10, 5))
    
    plt.plot(mse, color='#ff3366', label='Reconstruction Error (MSE)')
    plt.axhline(y=threshold, color='#00ffcc', linestyle='--', label='Fault Threshold')
    plt.axvspan(50, 100, color='red', alpha=0.2, label='Arc Fault Occurs')
    
    plt.title("Autoencoder Anomaly Detection: Series Arc Fault")
    plt.xlabel("AC Cycle (Time)")
    plt.ylabel("MSE (Anomaly Score)")
    plt.legend()
    plt.tight_layout()
    
    plot_path = os.path.join(MODELS_DIR, "fault_detection.png")
    plt.savefig(plot_path)
    print(f"[+] Detection graph saved to {plot_path}")

if __name__ == "__main__":
    main()
