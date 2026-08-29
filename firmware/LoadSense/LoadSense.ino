#define CURRENT_PIN A0

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 0-4095
}

void loop() {
  Serial.println(analogRead(CURRENT_PIN));
  delay(2);
}