"""
collect_data.py - Serial data collector for LoadSense

Reads CSV-formatted sensor data from XIAO ESP32-S3 over serial.
Now handles the 8-column Edge AI format:
  timestamp, vrms, irms, power, delta_p, wh, event, device_edge

Usage:
    python collect_data.py           # Uses default COM3
    python collect_data.py COM5      # Specify port
Press Ctrl+C to stop collection.
"""

import serial
import csv
import time
import os
import sys

# -------- CONFIG --------
PORT = "COM3"  # Change to your XIAO's COM port (check Device Manager)
BAUD = 115200
OUTPUT_DIR = "data"
RAW_FILE = os.path.join(OUTPUT_DIR, "readings.csv")
EVENTS_LOG = os.path.join(OUTPUT_DIR, "edge_events.log")


def collect():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Allow port override from command line
    port = sys.argv[1] if len(sys.argv) > 1 else PORT

    ser = serial.Serial(port, BAUD, timeout=2)
    time.sleep(2)  # Wait for ESP32-S3 to reset

    print(f"[*] LoadSense Data Collector")
    print(f"[*] Port: {port} @ {BAUD} baud")
    print(f"[*] Saving readings to: {RAW_FILE}")
    print(f"[*] Saving edge events to: {EVENTS_LOG}")
    print(f"[*] Press Ctrl+C to stop\n")

    count = 0
    events = 0

    with open(RAW_FILE, "w", newline="") as f_csv, \
         open(EVENTS_LOG, "w") as f_events:

        writer = csv.writer(f_csv)
        writer.writerow(["timestamp", "vrms", "irms", "power", "delta_p", "wh", "event", "device_edge"])

        try:
            while True:
                line = ser.readline().decode("utf-8", errors="ignore").strip()

                if not line:
                    continue

                # Capture Edge AI alert lines
                if line.startswith("[EDGE-AI]"):
                    events += 1
                    print(f"  🔔 {line}")
                    f_events.write(f"{time.strftime('%H:%M:%S')} {line}\n")
                    f_events.flush()
                    continue

                # Skip the CSV header from ESP32
                if line.startswith("timestamp"):
                    continue

                # Parse 8-column CSV data
                parts = line.split(",")
                if len(parts) == 8:
                    writer.writerow(parts)
                    count += 1
                    power = parts[3]
                    delta = parts[4]
                    event = parts[6]
                    device = parts[7]
                    f_csv.flush()

                    # Color-coded output
                    if event == "ON":
                        print(f"  [{count:4d}] {power:>8s}W | dP={delta:>8s}W | 🟢 {event} → {device}")
                    elif event == "OFF":
                        print(f"  [{count:4d}] {power:>8s}W | dP={delta:>8s}W | 🔴 {event} → {device}")
                    else:
                        print(f"  [{count:4d}] {power:>8s}W | dP={delta:>8s}W")

                # Also handle old 6-column format for backward compatibility
                elif len(parts) == 6:
                    parts.extend(["none", "-"])
                    writer.writerow(parts)
                    count += 1
                    print(f"  [{count:4d}] {parts[3]:>8s}W | dP={parts[4]:>8s}W")
                    f_csv.flush()

        except KeyboardInterrupt:
            print(f"\n{'='*50}")
            print(f"  Collection stopped.")
            print(f"  Total readings: {count}")
            print(f"  Edge AI events: {events}")
            print(f"  Data saved to:  {RAW_FILE}")
            print(f"  Events log:     {EVENTS_LOG}")
            print(f"{'='*50}")

    ser.close()


if __name__ == "__main__":
    collect()
