"""
simulate_data.py - Generate realistic NILM training data WITHOUT any hardware

Use this if you don't have the ESP32 or sensors. It generates a CSV file
that looks exactly like real sensor data, complete with realistic:
- Voltage fluctuations (~228-232V Indian mains)
- Appliance-specific current draws
- Power transitions (ON/OFF events)
- Noise and baseline drift
- Automatic device_id labels (ready for training!)

Usage:
    python simulate_data.py                  # Generates data/readings.csv + data/labeled_readings.csv
    python simulate_data.py --duration 600   # 10 minutes of data
"""

import csv
import os
import random
import math
import argparse
import json

OUTPUT_DIR = "data"

# -------- APPLIANCE PROFILES --------
APPLIANCES = {
    "Bulb-60W":       {"power": 60.0,  "current": 0.261, "noise": 2.0},
    "Phone-Charger":  {"power": 15.0,  "current": 0.065, "noise": 1.5},
    "Soldering-Iron": {"power": 150.0, "current": 0.652, "noise": 3.0},
}

# -------- SCENARIO --------
# (time_seconds, appliance_name, turn_on)
SCENARIO = [
    # Phase 1: Individual appliances (clean signatures)
    (5,   "Bulb-60W",       True),
    (35,  "Bulb-60W",       False),
    (40,  "Phone-Charger",  True),
    (70,  "Phone-Charger",  False),
    (75,  "Soldering-Iron", True),
    (105, "Soldering-Iron", False),

    # Phase 2: More individual data
    (110, "Bulb-60W",       True),
    (140, "Bulb-60W",       False),
    (145, "Phone-Charger",  True),
    (175, "Phone-Charger",  False),
    (180, "Soldering-Iron", True),
    (210, "Soldering-Iron", False),

    # Phase 3: Combinations
    (215, "Bulb-60W",       True),
    (220, "Phone-Charger",  True),
    (250, "Soldering-Iron", True),
    (270, "Phone-Charger",  False),
    (280, "Bulb-60W",       False),
    (300, "Soldering-Iron", False),

    # Phase 4: More data
    (305, "Soldering-Iron", True),
    (310, "Bulb-60W",       True),
    (340, "Soldering-Iron", False),
    (345, "Phone-Charger",  True),
    (365, "Bulb-60W",       False),
    (375, "Phone-Charger",  False),

    # Phase 5: Rapid switching
    (380, "Bulb-60W",       True),
    (400, "Bulb-60W",       False),
    (405, "Bulb-60W",       True),
    (425, "Bulb-60W",       False),
    (430, "Phone-Charger",  True),
    (450, "Phone-Charger",  False),
]


def get_active_device(active_set):
    """Determine the 'primary' device label for the current moment."""
    if len(active_set) == 0:
        return "Idle"
    # Return the most recently activated device (for labeling simplicity)
    # In a real NILM system, multiple devices can be active simultaneously
    return list(active_set)[-1]


def simulate(duration_seconds=480, sample_rate_hz=2):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    raw_file = os.path.join(OUTPUT_DIR, "readings.csv")
    labeled_file = os.path.join(OUTPUT_DIR, "labeled_readings.csv")

    total_samples = duration_seconds * sample_rate_hz
    interval_ms = 1000 // sample_rate_hz

    active_appliances = set()
    watt_hours = 0.0
    last_power = 0.0
    scenario_idx = 0

    print(f"[*] Simulating {duration_seconds}s of data at {sample_rate_hz}Hz")
    print(f"[*] Total samples: {total_samples}")
    print(f"[*] Appliances: {list(APPLIANCES.keys())}\n")

    raw_rows = []
    labeled_rows = []
    events = []

    for sample in range(total_samples):
        time_s = sample / sample_rate_hz
        timestamp_ms = int(time_s * 1000)

        # Execute scenario steps
        while scenario_idx < len(SCENARIO) and time_s >= SCENARIO[scenario_idx][0]:
            _, appliance, turn_on = SCENARIO[scenario_idx]
            if turn_on:
                active_appliances.add(appliance)
                print(f"  [{time_s:6.1f}s] [ON]  -> {appliance}")
            else:
                active_appliances.discard(appliance)
                print(f"  [{time_s:6.1f}s] [OFF] -> {appliance}")
            scenario_idx += 1

        # Simulate voltage (Indian mains ~230V)
        vrms = 228.0 + random.uniform(-3.0, 3.0)

        # Simulate total power from active appliances
        power = random.uniform(0.0, 2.0)  # Baseline standby
        for app_name in active_appliances:
            profile = APPLIANCES[app_name]
            noise = random.uniform(-1, 1) * profile["noise"]
            power += profile["power"] + noise

        power = max(power, 0.0)

        # Derived values
        irms = power / vrms if vrms > 0 else 0
        delta_p = power - last_power
        last_power = power

        # Accumulate energy
        watt_hours += power * (1.0 / sample_rate_hz) / 3600.0

        # Event detection
        event = "none"
        device_edge = "-"
        if abs(delta_p) >= 8.0:
            event = "ON" if delta_p > 0 else "OFF"
            # Signature matching
            abs_dp = abs(delta_p)
            for name, profile in APPLIANCES.items():
                if abs(abs_dp - profile["power"]) < 15.0:
                    device_edge = name
                    break
            if device_edge == "-":
                device_edge = "Unknown"

            events.append({
                "index": sample,
                "timestamp": timestamp_ms,
                "delta_p": round(delta_p, 2),
                "abs_delta_p": round(abs_dp, 2),
                "event_type": event,
                "device_edge": device_edge
            })

        # Raw row (8 columns, matches ESP32 output format)
        raw_rows.append([
            timestamp_ms,
            round(vrms, 2),
            round(irms, 4),
            round(power, 2),
            round(delta_p, 2),
            round(watt_hours, 4),
            event,
            device_edge
        ])

        # Labeled row (for training — only when an appliance is active)
        device_id = get_active_device(active_appliances)
        if device_id != "Idle":
            labeled_rows.append([
                timestamp_ms,
                round(vrms, 2),
                round(irms, 4),
                round(power, 2),
                round(delta_p, 2),
                round(watt_hours, 4),
                device_id
            ])

    # ---- Write raw CSV ----
    with open(raw_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "vrms", "irms", "power", "delta_p", "wh", "event", "device_edge"])
        writer.writerows(raw_rows)

    # ---- Write labeled CSV (for training) ----
    with open(labeled_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "vrms", "irms", "power", "delta_p", "wh", "device_id"])
        writer.writerows(labeled_rows)

    # ---- Write events JSON (for DBSCAN verification) ----
    events_file = os.path.join(OUTPUT_DIR, "simulated_events.json")
    with open(events_file, "w") as f:
        json.dump(events, f, indent=2)

    print(f"\n{'='*50}")
    print(f"  Simulation Complete!")
    print(f"  Raw data:     {raw_file} ({len(raw_rows)} samples)")
    print(f"  Labeled data: {labeled_file} ({len(labeled_rows)} labeled samples)")
    print(f"  Events:       {events_file} ({len(events)} events)")
    print(f"{'='*50}")
    print(f"\nNext steps:")
    print(f"  1. cd ml && python run_pipeline.py    # Run DBSCAN")
    print(f"  2. cd ml && python train.py            # Train Bi-LSTM")
    print(f"  3. streamlit run dashboard.py          # Launch dashboard")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate NILM sensor data")
    parser.add_argument("--duration", type=int, default=480, help="Duration in seconds (default: 480)")
    parser.add_argument("--rate", type=int, default=2, help="Samples per second (default: 2)")
    args = parser.parse_args()
    simulate(args.duration, args.rate)
