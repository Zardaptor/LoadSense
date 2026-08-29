# ⚡ LoadSense — AI-Based Non-Intrusive Load Monitoring

**Team:** Suraj Kalyanaraman (24BEI0004) | Nandish S (24BEI0027) | Roshan Aaqil Parvez (24BEE0220) | Arun S.M (24BEE0242)

An intelligent IoT energy monitoring system that identifies individual appliance consumption from a single sensing point using AI/ML (DBSCAN clustering + Bidirectional LSTM classification).

## System Architecture

```
Sensors (SCT-013 + ZMPT101B)
    │
    ▼
ESP32 (EmonLib → RMS calculations)
    │ Serial/USB
    ▼
Python ML Pipeline
    ├── Event Detection (ΔP threshold)
    ├── DBSCAN Clustering (unsupervised appliance grouping)
    └── Bi-LSTM Classification (supervised device identification)
    │
    ▼
Streamlit Dashboard (real-time visualization)
```

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Flash ESP32 Firmware
Open `firmware/LoadSense.ino` in Arduino IDE and upload to your ESP32.

### 3. Collect Data
```bash
python collect_data.py COM3
```

### 4. Run NILM Pipeline
```bash
cd ml
python run_pipeline.py
```

### 5. Train Model
```bash
cd ml
python train.py
```

### 6. Launch Dashboard
```bash
streamlit run dashboard.py
```

## Hardware Components

| Component | Purpose |
|-----------|---------|
| ESP32 DevKit | Main microcontroller |
| SCT-013-000 | Non-invasive AC current sensor |
| ZMPT101B | Isolated AC voltage sensor |
| Burden Resistor (33Ω) | Current-to-voltage conversion |
| 2x 10kΩ Resistors | Voltage divider bias circuit |
| 10µF Capacitor | Bias voltage filtering |

## Technology Stack

- **Hardware:** ESP32 + EmonLib
- **Backend/ML:** Python, PyTorch, Scikit-learn
- **Algorithms:** DBSCAN (unsupervised), Bi-LSTM (supervised)
- **Dashboard:** Streamlit
- **Data:** pandas, numpy

## License
MIT
