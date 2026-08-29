// ============================================================
//  LoadSense — Simulated Sensor Mode for XIAO ESP32-S3
//  Generates realistic appliance signatures for demo
// ============================================================

#include <math.h>

// -------- APPLIANCE PROFILES (based on real-world measurements) --------
struct Appliance {
  const char* name;
  float powerWatts;    // Typical power draw
  float currentAmps;   // Typical current at 230V
  float noise;         // Random noise amplitude (watts)
};

const Appliance APPLIANCES[] = {
  {"Bulb-60W",        60.0,  0.261, 2.0},
  {"Phone-Charger",   15.0,  0.065, 1.5},
  {"Soldering-Iron", 150.0,  0.652, 3.0},
  {"LED-Lamp",        12.0,  0.052, 0.8},
};
const int NUM_APPLIANCES = 4;

// -------- SIMULATION STATE --------
bool applianceState[4] = {false, false, false, false};
float totalPower = 0.0;
float lastPower = 0.0;
float wattHours = 0.0;
unsigned long lastMillis = 0;

// -------- SCENARIO TIMING --------
// Automatically turn appliances on/off to create realistic data
struct ScenarioStep {
  unsigned long timeMs;   // When (ms from start)
  int applianceIdx;       // Which appliance (0-3)
  bool turnOn;            // true=ON, false=OFF
};

const ScenarioStep SCENARIO[] = {
  // Phase 1: Individual appliances
  {  5000, 0, true },    // 5s:  Bulb ON
  { 30000, 0, false},    // 30s: Bulb OFF
  { 35000, 1, true },    // 35s: Charger ON
  { 60000, 1, false},    // 60s: Charger OFF
  { 65000, 2, true },    // 65s: Iron ON
  { 90000, 2, false},    // 90s: Iron OFF
  { 95000, 3, true },    // 95s: LED ON
  {115000, 3, false},    // 115s: LED OFF

  // Phase 2: Combinations
  {120000, 0, true },    // 120s: Bulb ON
  {125000, 1, true },    // 125s: Bulb + Charger
  {145000, 2, true },    // 145s: Bulb + Charger + Iron
  {165000, 1, false},    // 165s: Remove Charger
  {175000, 0, false},    // 175s: Remove Bulb (only Iron)
  {190000, 2, false},    // 190s: All OFF

  // Phase 3: Repeat for more training data
  {195000, 0, true },    // Bulb ON again
  {215000, 0, false},
  {220000, 2, true },    // Iron ON again
  {240000, 2, false},
  {245000, 1, true },    // Charger ON again
  {265000, 1, false},
};
const int SCENARIO_STEPS = 20;
int currentStep = 0;
bool scenarioComplete = false;

// -------- EDGE AI CONFIG --------
#define DELTA_P_THRESHOLD 8.0
#define WINDOW_SIZE 5

float powerWindow[WINDOW_SIZE];
int windowIndex = 0;
bool windowFull = false;

// -------- EDGE AI: SIGNATURE MATCHING --------
struct ApplianceSignature {
  const char* name;
  float typicalPower;
  float tolerance;
};

const ApplianceSignature KNOWN_SIGNATURES[] = {
  {"Bulb-60W",        60.0,  15.0},
  {"Phone-Charger",   15.0,   8.0},
  {"Soldering-Iron", 150.0,  30.0},
  {"LED-Lamp",        12.0,   5.0},
};
const int NUM_SIGNATURES = 4;

// -------- FUNCTIONS --------

float getSmoothedPower() {
  float sum = 0;
  int count = windowFull ? WINDOW_SIZE : windowIndex;
  for (int i = 0; i < count; i++) sum += powerWindow[i];
  return (count > 0) ? sum / count : 0;
}

const char* classifyByDeltaP(float deltaP) {
  float absDelta = abs(deltaP);
  for (int i = 0; i < NUM_SIGNATURES; i++) {
    float lo = KNOWN_SIGNATURES[i].typicalPower - KNOWN_SIGNATURES[i].tolerance;
    float hi = KNOWN_SIGNATURES[i].typicalPower + KNOWN_SIGNATURES[i].tolerance;
    if (absDelta >= lo && absDelta <= hi) return KNOWN_SIGNATURES[i].name;
  }
  return "Unknown";
}

float simulateVoltage() {
  // Indian mains: ~230V with small fluctuations
  return 228.0 + random(-30, 30) / 10.0;
}

float simulatePower() {
  float power = 0;
  for (int i = 0; i < NUM_APPLIANCES; i++) {
    if (applianceState[i]) {
      // Add appliance power + realistic noise
      power += APPLIANCES[i].powerWatts + (random(-100, 100) / 100.0) * APPLIANCES[i].noise;
    }
  }
  // Add small baseline noise (standby power)
  power += random(0, 20) / 10.0;
  return max(power, 0.0f);
}

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));  // Seed RNG from floating pin
  lastMillis = millis();
  memset(powerWindow, 0, sizeof(powerWindow));

  Serial.println("timestamp,vrms,irms,power,delta_p,wh,event,device_edge");

  Serial.println("[SIM] LoadSense Simulator Started");
  Serial.println("[SIM] Scenario will run automatically for ~4.5 minutes");
  Serial.println("[SIM] Then loops with random events");
  delay(2000);
}

void loop() {
  unsigned long now = millis();

  // ---- Run scenario (auto ON/OFF events) ----
  if (!scenarioComplete && currentStep < SCENARIO_STEPS) {
    if (now >= SCENARIO[currentStep].timeMs) {
      int idx = SCENARIO[currentStep].applianceIdx;
      bool on = SCENARIO[currentStep].turnOn;
      applianceState[idx] = on;

      Serial.print("[SIM] ");
      Serial.print(on ? "ON " : "OFF");
      Serial.print(" -> ");
      Serial.println(APPLIANCES[idx].name);

      currentStep++;
      if (currentStep >= SCENARIO_STEPS) {
        scenarioComplete = true;
        Serial.println("[SIM] Scenario complete. Entering random mode...");
      }
    }
  }

  // ---- Random events after scenario completes ----
  if (scenarioComplete && random(0, 100) < 3) {  // ~3% chance per cycle
    int idx = random(0, NUM_APPLIANCES);
    applianceState[idx] = !applianceState[idx];
    Serial.print("[SIM] ");
    Serial.print(applianceState[idx] ? "ON " : "OFF");
    Serial.print(" -> ");
    Serial.println(APPLIANCES[idx].name);
  }

  // ---- Simulate sensor readings ----
  float vrms = simulateVoltage();
  float power = simulatePower();
  float irms = power / vrms;

  // Rolling window
  powerWindow[windowIndex] = power;
  windowIndex = (windowIndex + 1) % WINDOW_SIZE;
  if (windowIndex == 0) windowFull = true;

  float smoothed = getSmoothedPower();
  float deltaP = smoothed - lastPower;
  lastPower = smoothed;

  // Energy accumulation
  float elapsed_hours = (now - lastMillis) / 3600000.0;
  wattHours += power * elapsed_hours;
  lastMillis = now;

  // ---- Edge AI ----
  String eventType = "none";
  String edgeDevice = "-";

  if (abs(deltaP) >= DELTA_P_THRESHOLD) {
    eventType = (deltaP > 0) ? "ON" : "OFF";
    edgeDevice = classifyByDeltaP(deltaP);

    Serial.print("[EDGE-AI] ");
    Serial.print(eventType);
    Serial.print(" | ");
    Serial.print(edgeDevice);
    Serial.print(" | dP=");
    Serial.print(deltaP, 1);
    Serial.println("W");
  }

  // ---- Output CSV ----
  Serial.print(millis());       Serial.print(",");
  Serial.print(vrms, 2);       Serial.print(",");
  Serial.print(irms, 4);       Serial.print(",");
  Serial.print(power, 2);      Serial.print(",");
  Serial.print(deltaP, 2);     Serial.print(",");
  Serial.print(wattHours, 4);  Serial.print(",");
  Serial.print(eventType);     Serial.print(",");
  Serial.println(edgeDevice);

  delay(500);  // 2 readings/sec
}
