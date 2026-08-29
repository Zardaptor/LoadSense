"""
run_pipeline.py - Run the complete NILM event detection + clustering pipeline

Usage:
    cd ml
    python run_pipeline.py
"""

import pandas as pd
import json
import os
import sys

from event_detector import compute_delta_power, detect_events
from clustering import cluster_events


def main():
    # -------- CONFIG --------
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    input_file = os.path.join(data_dir, "readings.csv")
    output_file = os.path.join(data_dir, "clustered_events.json")

    # Event detection threshold (watts) - tune based on your smallest appliance
    EVENT_THRESHOLD = 8.0

    # DBSCAN parameters
    DBSCAN_EPS = 15.0        # Max distance between delta_P values in same cluster
    DBSCAN_MIN_SAMPLES = 2   # Min events to form a cluster

    # -------- LOAD DATA --------
    if not os.path.exists(input_file):
        print(f"[!] Data file not found: {input_file}")
        print("[!] Run collect_data.py first to collect sensor data.")
        sys.exit(1)

    df = pd.read_csv(input_file)
    print(f"[*] Loaded {len(df)} readings from {input_file}")

    # -------- COMPUTE DELTA POWER --------
    if "delta_p" not in df.columns:
        df["delta_p"] = compute_delta_power(df["power"].tolist())
        print(f"[*] Computed delta_P for {len(df)} readings")

    # -------- DETECT EVENTS --------
    events = detect_events(
        timestamps=df["timestamp"].tolist(),
        delta_p=df["delta_p"].tolist(),
        threshold=EVENT_THRESHOLD
    )
    print(f"[*] Detected {len(events)} significant power events (threshold={EVENT_THRESHOLD}W)")

    if len(events) == 0:
        print("[!] No events detected. Try lowering the threshold or collecting more data.")
        print("[!] Make sure you are turning appliances ON and OFF during collection.")
        sys.exit(1)

    # -------- CLUSTER EVENTS --------
    events = cluster_events(events, eps=DBSCAN_EPS, min_samples=DBSCAN_MIN_SAMPLES)

    # -------- SAVE RESULTS --------
    with open(output_file, "w") as f:
        json.dump(events, f, indent=2, default=str)

    print(f"\n[+] Results saved to {output_file}")
    print(f"[+] Pipeline complete!")


if __name__ == "__main__":
    main()
