"""
model.py - Bidirectional LSTM for appliance classification

Architecture:
    Input:  (batch, window_size, 4) -> 4 features: vrms, irms, power, wh
    LSTM:   Bidirectional, hidden_size=128, reads sequence forwards AND backwards
    Output: (batch, num_classes) -> probability per appliance class

Why Bidirectional?
    A regular LSTM only reads left-to-right. Bi-LSTM reads in BOTH directions,
    capturing context from before AND after an event. This is critical for NILM
    because the pattern "power was low BEFORE and high AFTER" (appliance turned on)
    is just as informative as "power was high BEFORE and low AFTER" (turned off).
"""

import torch
import torch.nn as nn


class EnergyFingerprintNet(nn.Module):
    def __init__(self, input_size=4, hidden_size=128, num_classes=3):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            batch_first=True,
            bidirectional=True  # Key: reads sequence in both directions
        )
        self.fc = nn.Linear(hidden_size * 2, num_classes)  # *2 because bidirectional
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        # x shape: (batch, window_size, 4)
        lstm_out, _ = self.lstm(x)
        # lstm_out shape: (batch, window_size, hidden_size * 2)

        # Take the output from the LAST time step
        last_hidden = lstm_out[:, -1, :]
        # last_hidden shape: (batch, hidden_size * 2)

        out = self.dropout(last_hidden)
        out = self.fc(out)
        # out shape: (batch, num_classes)
        return out
