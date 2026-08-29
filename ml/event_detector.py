"""
event_detector.py - Delta power computation and event detection

Detects significant power change events (appliance ON/OFF) by analyzing
changes in power consumption between consecutive readings.
"""

import pandas as pd
import numpy as np


def compute_delta_power(power_series):
    """
    Compute delta_P between consecutive readings.

    Args:
        power_series: list of power values in watts

    Returns:
        list of delta_P values (same length, first element is 0.0)
    """
    delta = [0.0]
    for i in range(1, len(power_series)):
        delta.append(power_series[i] - power_series[i - 1])
    return delta


def detect_events(timestamps, delta_p, threshold=10.0):
    """
    Detect ON/OFF events where |delta_P| exceeds threshold.

    How it works:
    - When a 60W bulb turns ON:  power jumps 0 -> 60W,  delta_P = +60W  -> ON event
    - When a 60W bulb turns OFF: power drops 60 -> 0W,  delta_P = -60W  -> OFF event
    - Small fluctuations (noise) are filtered out by the threshold

    Args:
        timestamps: list of timestamp values
        delta_p: list of power differences
        threshold: minimum |delta_P| in watts to count as an event
                   Set slightly below your smallest appliance's wattage.
                   E.g., if smallest load is ~10W, use threshold=8.0

    Returns:
        List of event dicts with keys: index, timestamp, delta_p, abs_delta_p, event_type
    """
    events = []
    for i, dp in enumerate(delta_p):
        if abs(dp) >= threshold:
            events.append({
                "index": i,
                "timestamp": timestamps[i],
                "delta_p": round(dp, 2),
                "abs_delta_p": round(abs(dp), 2),
                "event_type": "ON" if dp > 0 else "OFF"
            })
    return events
