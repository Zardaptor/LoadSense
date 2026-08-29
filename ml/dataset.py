"""
dataset.py - PyTorch Dataset for sliding window energy data

Creates overlapping windows of sensor readings for the LSTM.
Each window is a sequence of `window_size` consecutive readings.
The label is the device active at the END of the window.
"""

import torch
from torch.utils.data import Dataset
import numpy as np


class EnergyDataset(Dataset):
    def __init__(self, X, y, window_size=10):
        """
        Args:
            X: numpy array of shape (N, 4) -> N readings, 4 features each
               Features: [vrms, irms, power, wh]
            y: numpy array of shape (N,) -> integer device label per reading
            window_size: number of consecutive readings in each sample
                         10 = looks at ~5 seconds of data (at 2 readings/sec)
        """
        self.X = X
        self.y = y
        self.window_size = window_size

    def __len__(self):
        return len(self.X) - self.window_size

    def __getitem__(self, idx):
        # Get a window of readings: shape (window_size, 4)
        window = self.X[idx: idx + self.window_size]
        # Label = device active at the END of the window
        label = self.y[idx + self.window_size - 1]
        return (
            torch.tensor(window, dtype=torch.float32),
            torch.tensor(label, dtype=torch.long)
        )
