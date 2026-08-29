"""
train_autoencoder.py - Unsupervised Anomaly Detection

Trains a PyTorch Autoencoder exclusively on HEALTHY electrical cycles.
The model learns to compress and reconstruct perfect 50Hz sine waves with 
normal appliance harmonic distortion.

When a fault occurs later, the model will fail to reconstruct it, 
causing a massive spike in MSE (Mean Squared Error).
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import matplotlib.pyplot as plt

# -------- CONFIG --------
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)
SAMPLES_PER_CYCLE = 50 # 1kHz sampling rate for a 50Hz AC signal (20ms)

class GridAutoencoder(nn.Module):
    def __init__(self, input_size=SAMPLES_PER_CYCLE):
        super(GridAutoencoder, self).__init__()
        # Compress the 50 points down to 8 (Bottleneck)
        self.encoder = nn.Sequential(
            nn.Linear(input_size, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 8)
        )
        # Reconstruct the 50 points
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, input_size)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

def generate_healthy_data(num_cycles=1000):
    """Generates synthetic 'healthy' appliance V-I trajectories."""
    t = np.linspace(0, 1, SAMPLES_PER_CYCLE, endpoint=False)
    data = []
    
    for _ in range(num_cycles):
        # Base 50Hz fundamental
        wave = np.sin(2 * np.pi * t)
        
        # Add slight natural harmonics (3rd and 5th) common in healthy appliances
        wave += 0.05 * np.sin(2 * np.pi * 3 * t + np.random.uniform(0, 2*np.pi))
        wave += 0.02 * np.sin(2 * np.pi * 5 * t + np.random.uniform(0, 2*np.pi))
        
        # Add tiny ADC noise
        wave += np.random.normal(0, 0.01, SAMPLES_PER_CYCLE)
        data.append(wave)
        
    return np.array(data, dtype=np.float32)

def main():
    print("[*] Generating 10,000 cycles of healthy baseline data...")
    X_train = torch.tensor(generate_healthy_data(10000))
    
    model = GridAutoencoder()
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 100
    batch_size = 64
    
    print("[*] Training Autoencoder on healthy data...")
    model.train()
    
    losses = []
    for epoch in range(epochs):
        epoch_loss = 0
        permutation = torch.randperm(X_train.size()[0])
        
        for i in range(0, X_train.size()[0], batch_size):
            indices = permutation[i:i+batch_size]
            batch_x = X_train[indices]
            
            optimizer.zero_grad()
            reconstructed = model(batch_x)
            loss = criterion(reconstructed, batch_x)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        losses.append(epoch_loss / len(X_train))
        if (epoch+1) % 20 == 0:
            print(f"  Epoch {epoch+1}/{epochs} | Reconstruction Loss: {losses[-1]:.6f}")

    # Save model
    model_path = os.path.join(MODELS_DIR, "autoencoder.pt")
    torch.save(model.state_dict(), model_path)
    print(f"[+] Model saved to {model_path}")
    
    # Calculate baseline threshold (max error on healthy data)
    model.eval()
    with torch.no_grad():
        reconstructed = model(X_train)
        errors = torch.mean((reconstructed - X_train)**2, dim=1).numpy()
        threshold = np.percentile(errors, 99.9) # 99.9th percentile
    
    print(f"[+] Healthy Baseline Threshold (MSE): {threshold:.6f}")
    
    with open(os.path.join(MODELS_DIR, "ae_threshold.txt"), "w") as f:
        f.write(str(threshold))

    # Plot training loss
    plt.style.use('dark_background')
    plt.figure(figsize=(8, 4))
    plt.plot(losses, color='#00ffcc')
    plt.title("Autoencoder Training Loss (Learning 'Healthy' Electricity)")
    plt.xlabel("Epoch")
    plt.ylabel("MSE Loss")
    plt.tight_layout()
    plt.savefig(os.path.join(MODELS_DIR, "ae_training_loss.png"))
    
if __name__ == "__main__":
    main()
