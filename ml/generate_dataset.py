import os
import pandas as pd
import numpy as np
import datetime

# --- CONFIGURATION ---
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)
FILE_PATH = os.path.join(DATA_DIR, "comprehensive_dataset.csv")

# Baseline configurations for Indian Appliances
APPLIANCES = {
    "Ceiling Fan": {"base_power": 75, "pf": 0.95, "noise": 2},
    "LED TV": {"base_power": 100, "pf": 0.98, "noise": 1},
    "Refrigerator": {"base_power": 250, "pf": 0.85, "noise": 15},
    "Gaming PC": {"base_power": 450, "pf": 0.99, "noise": 30},
    "Washing Machine": {"base_power": 500, "pf": 0.80, "noise": 50},
    "Mixer Grinder": {"base_power": 750, "pf": 0.75, "noise": 80},
    "Water Pump": {"base_power": 750, "pf": 0.70, "noise": 100},
    "Iron Box": {"base_power": 1000, "pf": 1.0, "noise": 5},
    "Microwave Oven": {"base_power": 1200, "pf": 0.95, "noise": 20},
    "1.5 Ton AC": {"base_power": 1500, "pf": 0.85, "noise": 100},
    "Hair Dryer": {"base_power": 1800, "pf": 1.0, "noise": 10},
    "Water Heater": {"base_power": 2000, "pf": 1.0, "noise": 5},
    "EV Charger": {"base_power": 3300, "pf": 0.99, "noise": 5}
}

def generate_synthetic_usage():
    """Generates 24 hours of minute-by-minute synthetic data for a household."""
    print(f"[*] Generating comprehensive synthetic dataset for {len(APPLIANCES)} appliances...")
    
    start_time = datetime.datetime.now() - datetime.timedelta(days=40)
    timestamps = [start_time + datetime.timedelta(minutes=i) for i in range(1440 * 40)] # 40 days
    
    
    data_rows = []
    
    for t in timestamps:
        hour = t.hour
        
        # Pick 1 to 4 random appliances running at this minute based on time of day probabilities
        num_active = np.random.randint(1, 4)
        active_appliances = np.random.choice(list(APPLIANCES.keys()), size=num_active, replace=False)
        
        for app in active_appliances:
            conf = APPLIANCES[app]
            
            # Simulate real-world power fluctuation
            fluctuation = np.random.normal(0, conf["noise"])
            actual_power = max(0, conf["base_power"] + fluctuation)
            
            # Simulate Grid Voltage (Indian Standard 230V +- 5%)
            vrms = np.random.normal(230, 2)
            
            # P = VI * PF => I = P / (V * PF)
            irms = actual_power / (vrms * conf["pf"])
            
            # Introduce a rare anomaly (1% chance of an Arc Fault / Stall)
            fault_status = "Healthy"
            if np.random.random() < 0.01:
                fault_status = np.random.choice(["Arc Fault", "Compressor Stall", "Overvoltage Sag"])
                
                # If stalled motor, spike current
                if fault_status == "Compressor Stall" and conf["pf"] < 0.9:
                    irms *= 4
                    actual_power *= 4
            
            data_rows.append({
                "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                "appliance": app,
                "vrms": round(vrms, 2),
                "irms": round(irms, 3),
                "power_watts": round(actual_power, 2),
                "power_factor": conf["pf"],
                "fault_status": fault_status
            })
            
    df = pd.DataFrame(data_rows)
    df.to_csv(FILE_PATH, index=False)
    print(f"[+] Successfully generated {len(df)} rows of data.")
    print(f"[+] Saved to: {FILE_PATH}")

if __name__ == "__main__":
    generate_synthetic_usage()
