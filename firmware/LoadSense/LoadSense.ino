#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =========================================================================
// DISPLAY HARDWARE CONFIGURATION
// =========================================================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1 
#define OLED_ADDRESS  0x3C

// Custom I2C Pins for XIAO ESP32-S3
#define I2C_SDA_PIN 5
#define I2C_SCL_PIN 6

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// =========================================================================
// ANIMATION & STATE ENGINE
// =========================================================================
enum AnimType {
  ANIM_TYPEWRITER,
  ANIM_SLIDE_MALE,
  ANIM_SLIDE_FEMALE,
  ANIM_MOON_STARS,
  ANIM_HEART_PULSE,
  ANIM_CLAPS,
  ANIM_POP_MALE,
  ANIM_POP_FEMALE,
  ANIM_FINAL_FADE
};

struct LyricEvent {
    unsigned long startTimeMs;
    unsigned long durationMs;
    const char* line1;
    const char* line2;
    AnimType animation;
};

// =========================================================================
// ⏱️ LYRIC TIMING & TIMELINE CONFIGURATION
// =========================================================================
// Adjust the startTimeMs for each line to synchronize with your audio track.
// All times are in milliseconds (e.g., 25000 = 25 seconds).
// I have provided placeholder timings spaced out logically. You will need 
// to fine-tune these by playing the song!
// =========================================================================
#define MS(s) (unsigned long)((s) * 1000)

const LyricEvent timeline[] = {
  // INTRO (Typewriter effect)
  { MS(0),   MS(3), "HI MALINI...", "I AM KRISHNAN", ANIM_TYPEWRITER },
  { MS(3.5), MS(2.5), "NAAN ITHA", "SOLLIYAE AAGANUM", ANIM_TYPEWRITER },
  { MS(6.5), MS(2.5), "NEE AVVALAVU", "AZHAGU", ANIM_TYPEWRITER },
  { MS(9.5), MS(3), "INGA YEVANUM IVVALO", "AZHAGAA ORU..", ANIM_TYPEWRITER },
  { MS(13),  MS(3), "IVALO AZHAGA", "PAARTHIRUKKA MATTANGA", ANIM_TYPEWRITER },
  { MS(16.5),MS(3.5), "AND I AM IN LOVE", "WITH YOU..", ANIM_TYPEWRITER },

  // MALE 1 
  { MS(21), MS(3), "MUNDHINAM", "PAARTHENAE", ANIM_SLIDE_MALE },
  { MS(24.5), MS(3), "PAARTHATHUM", "THOTRENAE", ANIM_SLIDE_MALE },
  { MS(28), MS(3), "SALLADAI", "KANNAAGA", ANIM_SLIDE_MALE },
  { MS(31.5), MS(3.5), "NENJAMUM", "PUNNAANATHAE", ANIM_SLIDE_MALE },

  // MALE 2
  { MS(36), MS(3), "ITHANAI", "NAALAAGA", ANIM_SLIDE_MALE },
  { MS(39.5), MS(3), "UNNAI NAAN", "PAARAAMAL", ANIM_SLIDE_MALE },
  { MS(43), MS(3), "ENGUTHAAN", "PONENO", ANIM_SLIDE_MALE },
  { MS(46.5), MS(3.5), "NAATKALUM", "VEENANATHAE", ANIM_SLIDE_MALE },

  // MALE 3 (Vaanathil)
  { MS(51), MS(3), "VAANATHIL", "NEE VENNILAA", ANIM_MOON_STARS },
  { MS(54.5), MS(3), "YEKKATHIL", "NAAN THEIVATHAA", ANIM_MOON_STARS },
  { MS(58), MS(3.5), "IPPOZHUTHAE ENNODU", "VANTHAAL ENNA", ANIM_SLIDE_MALE },
  { MS(62), MS(3.5), "OOR PAARKA ONDRAGA", "SENDRAAL ENNA", ANIM_SLIDE_MALE },

  // Repeat Mundhinam / Ithanai
  { MS(67), MS(3), "MUNDHINAM", "PAARTHENAE", ANIM_SLIDE_MALE },
  { MS(70.5), MS(3), "PAARTHATHUM", "THOTRENAE", ANIM_SLIDE_MALE },
  { MS(74), MS(3), "SALLADAI", "KANNAAGA", ANIM_SLIDE_MALE },
  { MS(77.5), MS(3.5), "NENJAMUM", "PUNNAANATHAE", ANIM_SLIDE_MALE },

  { MS(82), MS(3), "ITHANAI", "NAALAAGA", ANIM_SLIDE_MALE },
  { MS(85.5), MS(3), "UNNAI NAAN", "PAARAAMAL", ANIM_SLIDE_MALE },
  { MS(89), MS(3), "ENGUTHAAN", "PONENO", ANIM_SLIDE_MALE },
  { MS(92.5), MS(3.5), "NAATKALUM", "VEENANATHAE", ANIM_SLIDE_MALE },

  // CHORUS (Kaadhalae / Swasamae)
  { MS(97), MS(4), "KAADHALAE...", "", ANIM_HEART_PULSE },
  { MS(101.5), MS(4), "SWASAMAE.....", "", ANIM_HEART_PULSE },

  // MALE 4 (Thulaa)
  { MS(107), MS(3), "THULAA THOTTIL", "UNNAI VAITHU", ANIM_SLIDE_MALE },
  { MS(110.5), MS(3), "NIGAR SEIYA", "PONNAI VEITHAAL", ANIM_SLIDE_MALE },
  { MS(114), MS(3), "THULAABAARAM", "THORKAATHO", ANIM_SLIDE_MALE },
  { MS(117.5), MS(3), "PERAZHAGAE...", "", ANIM_SLIDE_MALE },

  // FEMALE 1 (Mugam)
  { MS(122), MS(3), "MUGAM PAARTHU", "PESUM UNNAI", ANIM_SLIDE_FEMALE },
  { MS(125.5), MS(3), "MUDHAL KAADHAL", "SINTHUM KANNAI", ANIM_SLIDE_FEMALE },
  { MS(129), MS(3), "ANNAIKKAAMAL", "POVENO", ANIM_SLIDE_FEMALE },
  { MS(132.5), MS(3), "AARUYIRAE....", "", ANIM_SLIDE_FEMALE },

  // MALE 5 (Oh nizhal)
  { MS(137), MS(3), "OH NIZHAL POLA", "VIDAAMAL", ANIM_SLIDE_MALE },
  { MS(140.5), MS(3), "UNNAI", "THODARVENADI", ANIM_SLIDE_MALE },
  { MS(144), MS(3), "PUGAI POLA", "PADAAMAL PATTU", ANIM_SLIDE_MALE },
  { MS(147.5), MS(3), "NAGARVENADI", "", ANIM_SLIDE_MALE },
  { MS(151), MS(3), "VINAA NOORU", "KANAAVUM NOORU", ANIM_SLIDE_MALE },
  { MS(154.5), MS(3), "VIDAI SOLLADI...", "", ANIM_SLIDE_MALE },

  // FEMALE Mundhinam
  { MS(159), MS(3), "MUNDHINAM", "PAARTHENAE", ANIM_SLIDE_FEMALE },
  { MS(162.5), MS(3), "PAARTHATHUM", "THOTRENAE", ANIM_SLIDE_FEMALE },
  { MS(166), MS(3), "SALLADAI", "KANNAAGA", ANIM_SLIDE_FEMALE },
  { MS(169.5), MS(3.5), "ULLAMUM", "PUNNAANATHAE", ANIM_SLIDE_FEMALE },

  // ALTERNATING
  { MS(174), MS(2), "ITHANAI NAALAAGA", "", ANIM_POP_FEMALE },
  { MS(176.5), MS(2), "OH MY LOVE..", "", ANIM_POP_MALE },
  { MS(179), MS(2), "UNNAI NAAN PAARAAMAL", "", ANIM_POP_FEMALE },
  { MS(181.5), MS(2), "YES MY LOVE..", "", ANIM_POP_MALE },
  { MS(184), MS(2), "ENGUTHAAN PONENO", "", ANIM_POP_FEMALE },
  { MS(186.5), MS(3), "NAATKALUM VEENANATHAE", "", ANIM_POP_FEMALE },

  // CLAPS section
  { MS(191), MS(1.5), "CLAP!", "", ANIM_CLAPS },
  { MS(192.5), MS(1.5), "CLAP!", "", ANIM_CLAPS },
  { MS(194), MS(1.5), "CLAP!", "", ANIM_CLAPS },
  { MS(195.5), MS(1.5), "CLAP!", "", ANIM_CLAPS },

  // FEMALE 2
  { MS(198), MS(3), "KADAL NEELAM", "MANGUM NERUM", ANIM_SLIDE_FEMALE },
  { MS(201.5), MS(3), "ALAI VANTHU", "THEENDUM THOORAM", ANIM_SLIDE_FEMALE },
  { MS(205), MS(3), "MANAM SENDRU", "MUZHGAATHO", ANIM_SLIDE_FEMALE },
  { MS(208.5), MS(3), "EERATHILAE...", "", ANIM_SLIDE_FEMALE },

  // MALE 6
  { MS(213), MS(3), "THALAI SAAIKA", "THOLUM THANTHAAI", ANIM_SLIDE_MALE },
  { MS(216.5), MS(3), "VIRAL KORTHU", "PAKKAM VANTHAAI", ANIM_SLIDE_MALE },
  { MS(220), MS(3), "IDHAZH MATTUM", "INNUM YEN", ANIM_SLIDE_MALE },
  { MS(223.5), MS(3), "DHOORATHILAE..", "", ANIM_SLIDE_MALE },

  // FEMALE 3
  { MS(228), MS(3), "PAGAL NERAM", "KANAAKAL KANDEN", ANIM_SLIDE_FEMALE },
  { MS(231.5), MS(3), "URANGAAMALAE", "", ANIM_SLIDE_FEMALE },
  { MS(235), MS(3), "UYIR RENDUM", "URAAYA KANDEN", ANIM_SLIDE_FEMALE },
  { MS(238.5), MS(3), "NERUNGAAMALAE", "", ANIM_SLIDE_FEMALE },
  { MS(242), MS(3), "UNAI INDRI", "ENAKKU ETHU", ANIM_SLIDE_FEMALE },
  { MS(245.5), MS(3), "EDHIRKAALAMAE", "", ANIM_SLIDE_FEMALE },

  // MALE Mundhinam repeat
  { MS(250), MS(3), "MUNDHINAM", "PAARTHENAE", ANIM_SLIDE_MALE },
  { MS(253.5), MS(3), "PAARTHATHUM", "THOTRENAE", ANIM_SLIDE_MALE },
  { MS(257), MS(3), "SALLADAI", "KANNAAGA", ANIM_SLIDE_MALE },
  { MS(260.5), MS(3.5), "NENJAMUM", "PONNAANATHAE", ANIM_SLIDE_MALE },

  { MS(265), MS(3), "ITHANAI", "NAALAAGA", ANIM_SLIDE_MALE },
  { MS(268.5), MS(3), "UNNAI NAAN", "PAARAAMAL", ANIM_SLIDE_MALE },
  { MS(272), MS(3), "ENGUTHAAN", "PONENO", ANIM_SLIDE_MALE },
  { MS(275.5), MS(3.5), "NAATKALUM", "VEENANATHAE", ANIM_SLIDE_MALE },

  { MS(280), MS(3), "VAANATHIL", "NEE VENNILAA", ANIM_MOON_STARS },
  { MS(283.5), MS(3), "YEKKATHIL", "NAAN THEIVATHAA", ANIM_MOON_STARS },
  { MS(287), MS(3.5), "IPPOZHUTHAE ENNODU", "VANTHAAL ENNA", ANIM_SLIDE_MALE },
  { MS(291), MS(3.5), "OOR PAARKA ONDRAGA", "SENDRAAL ENNA", ANIM_SLIDE_MALE },

  // FINAL
  { MS(296), MS(4), "VENNILA..", "", ANIM_MOON_STARS },
  { MS(301), MS(4), "VENNILA..", "", ANIM_MOON_STARS },
  { MS(306), MS(6), "VENNILA.....", "", ANIM_FINAL_FADE }
};

const int TOTAL_EVENTS = sizeof(timeline) / sizeof(LyricEvent);

// =========================================================================
// PARTICLE SYSTEM & DRAWING HELPERS
// =========================================================================
#define MAX_PARTICLES 15
struct Particle {
  float x, y, vx, vy;
  uint8_t size;
  bool active;
};
Particle particles[MAX_PARTICLES];

void spawnParticle(float x, float y, float vx, float vy, uint8_t size) {
  for(int i=0; i<MAX_PARTICLES; i++) {
    if(!particles[i].active) {
      particles[i] = {x, y, vx, vy, size, true};
      break;
    }
  }
}

void updateAndDrawParticles(AnimType type) {
  // Randomly spawn based on type
  if(random(100) < 15) {
      if(type == ANIM_SLIDE_MALE) {
          spawnParticle(random(128), 64 + random(10), (random(10)-5)/20.0, -((random(10)+5)/10.0), random(1, 3));
      } else if (type == ANIM_SLIDE_FEMALE) {
          spawnParticle(random(128), 64 + random(10), (random(10)-5)/20.0, -((random(10)+5)/10.0), random(1, 3));
      }
  }

  for(int i=0; i<MAX_PARTICLES; i++) {
    if(particles[i].active) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      
      if(type == ANIM_SLIDE_MALE) {
          // Male: Square blocks (pixels)
          display.fillRect((int)particles[i].x, (int)particles[i].y, particles[i].size, particles[i].size, SSD1306_WHITE);
      } else if (type == ANIM_SLIDE_FEMALE) {
          // Female: Open circles / bubbles
          display.drawCircle((int)particles[i].x, (int)particles[i].y, particles[i].size, SSD1306_WHITE);
      }
      
      if(particles[i].y < -5 || particles[i].x < -5 || particles[i].x > 133) {
          particles[i].active = false;
      }
    }
  }
}

#define NUM_STARS 25
struct Star {
    int x, y;
    float phase;
};
Star stars[NUM_STARS];

void initStars() {
    for(int i=0; i<NUM_STARS; i++) {
        stars[i] = { (int)random(128), (int)random(45), (float)random(100)/10.0 };
    }
}

void drawMoonAndStars(unsigned long timeMs) {
    for(int i=0; i<NUM_STARS; i++) {
        float brightness = sin(timeMs * 0.003 + stars[i].phase);
        if(brightness > 0.5) {
            display.drawPixel(stars[i].x, stars[i].y, SSD1306_WHITE);
        } else if (brightness > 0.95) { 
            // Twinkle (slightly larger)
            display.drawPixel(stars[i].x, stars[i].y, SSD1306_WHITE);
            display.drawPixel(stars[i].x+1, stars[i].y, SSD1306_WHITE);
        }
    }
    
    // Draw Crescent Moon
    int moonX = 105;
    int moonY = 15;
    int r = 12;
    display.fillCircle(moonX, moonY, r, SSD1306_WHITE);
    display.fillCircle(moonX - 3, moonY - 3, r - 2, SSD1306_BLACK); 
}

void drawHeart(int cx, int cy, float scale) {
    int r = (int)(4.0 * scale);
    if(r < 1) r = 1;
    int yOff = -r;
    display.fillCircle(cx - r, cy + yOff, r, SSD1306_WHITE);
    display.fillCircle(cx + r, cy + yOff, r, SSD1306_WHITE);
    display.fillTriangle(cx - 2*r, cy + yOff, cx + 2*r, cy + yOff, cx, cy + (int)(2.5*r), SSD1306_WHITE);
}

// Utility to center text on screen with an X offset
void centerText(const char* text, int y, int xOffset) {
    if(strlen(text) == 0) return;
    int16_t x1, y1;
    uint16_t w, h;
    display.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
    int x = (SCREEN_WIDTH - w) / 2 + xOffset;
    display.setCursor(x, y);
    display.print(text);
}

// =========================================================================
// RENDERERS FOR ANIMATIONS
// =========================================================================
void renderTypewriter(const char* l1, const char* l2, float t) {
    int len1 = strlen(l1);
    int len2 = strlen(l2);
    int totalLen = len1 + len2;
    if(totalLen == 0) return;
    
    // Finish typing by t=0.7 so it stays readable for a bit
    float typed_t = t / 0.7;
    if(typed_t > 1.0) typed_t = 1.0;
    
    int charsToShow = (int)(typed_t * totalLen);
    
    char buf1[32] = {0};
    char buf2[32] = {0};
    
    if (charsToShow <= len1) {
        strncpy(buf1, l1, charsToShow);
    } else {
        strncpy(buf1, l1, len1);
        strncpy(buf2, l2, charsToShow - len1);
    }
    
    int yBase = (len2 == 0) ? 28 : 20;
    int16_t x1, y1; uint16_t w, h;
    
    // Line 1
    if (len1 > 0) {
        display.getTextBounds(l1, 0, 0, &x1, &y1, &w, &h);
        int startX1 = (SCREEN_WIDTH - w) / 2;
        display.setCursor(startX1, yBase);
        display.print(buf1);
        
        // Blink cursor while typing this line
        if(charsToShow <= len1 && (millis() % 500 < 250)) {
            display.getTextBounds(buf1, 0, 0, &x1, &y1, &w, &h);
            display.fillRect(startX1 + w + 2, yBase, 5, 7, SSD1306_WHITE);
        }
    }
    
    // Line 2
    if (len2 > 0) {
        display.getTextBounds(l2, 0, 0, &x1, &y1, &w, &h);
        int startX2 = (SCREEN_WIDTH - w) / 2;
        display.setCursor(startX2, yBase + 16);
        display.print(buf2);
        
        // Blink cursor while typing this line or if finished typing all
        if(charsToShow > len1 && (millis() % 500 < 250)) {
            display.getTextBounds(buf2, 0, 0, &x1, &y1, &w, &h);
            display.fillRect(startX2 + w + 2, yBase + 16, 5, 7, SSD1306_WHITE);
        }
    }
}

// =========================================================================
// MAIN SETUP & LOOP
// =========================================================================
unsigned long songStartTime = 0;
bool isPlaying = false;

void setup() {
  Serial.begin(115200);
  
  // Custom I2C for XIAO ESP32-S3
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000); // 400kHz fast I2C
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Halt
  }
  
  initStars();
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // STARTUP ANIMATION
  centerText("MUNDHINAM", 28, 0);
  // draw a small music note
  display.fillCircle(105, 30, 2, SSD1306_WHITE);
  display.drawLine(107, 30, 107, 22, SSD1306_WHITE);
  display.drawLine(107, 22, 112, 24, SSD1306_WHITE);
  display.display();
  delay(3000); 
  
  songStartTime = millis();
  isPlaying = true;
}

void loop() {
  if (!isPlaying) return;
  
  unsigned long now = millis();
  unsigned long elapsed = now - songStartTime;
  
  // Find current event
  int evIdx = -1;
  for(int i = 0; i < TOTAL_EVENTS; i++) {
      if (elapsed >= timeline[i].startTimeMs && elapsed < (timeline[i].startTimeMs + timeline[i].durationMs)) {
          evIdx = i;
          break;
      }
  }
  
  display.clearDisplay();
  
  if (evIdx != -1) {
      const LyricEvent& ev = timeline[evIdx];
      unsigned long evElapsed = elapsed - ev.startTimeMs;
      float t = (float)evElapsed / (float)ev.durationMs; // 0.0 to 1.0
      
      int yBase = (strlen(ev.line2) == 0) ? 28 : 20;
      
      switch(ev.animation) {
          case ANIM_TYPEWRITER:
              renderTypewriter(ev.line1, ev.line2, t);
              break;
              
          case ANIM_SLIDE_MALE:
          case ANIM_SLIDE_FEMALE: {
              updateAndDrawParticles(ev.animation);
              
              int dir = (ev.animation == ANIM_SLIDE_MALE) ? -1 : 1;
              int xOff = 0;
              
              // Slide in fast (first 15%)
              if (t < 0.15) {
                  float localT = t / 0.15;
                  float easeOut = 1.0 - pow(1.0 - localT, 3.0);
                  xOff = dir * (int)(128 * (1.0 - easeOut)); 
              } else if (t > 0.85) { 
                  // Slide out (last 15%)
                  float localT = (t - 0.85) / 0.15;
                  float easeIn = pow(localT, 3.0);
                  xOff = -dir * (int)(128 * easeIn);
              }
              
              if (strlen(ev.line2) == 0) {
                  centerText(ev.line1, yBase + 8, xOff);
              } else {
                  centerText(ev.line1, yBase, xOff);
                  centerText(ev.line2, yBase + 16, xOff);
              }
              break;
          }
              
          case ANIM_MOON_STARS:
              drawMoonAndStars(now);
              if (strlen(ev.line2) == 0) {
                  centerText(ev.line1, 48, 0); // Put text at bottom below moon
              } else {
                  centerText(ev.line1, 40, 0);
                  centerText(ev.line2, 52, 0);
              }
              break;
              
          case ANIM_HEART_PULSE: {
              float scale = 1.5 + 0.5 * abs(sin(now * 0.007)); // Pulsing rate
              drawHeart(64, 25, scale);
              centerText(ev.line1, 48, 0);
              break;
          }
              
          case ANIM_CLAPS: {
              // Screen shake for CLAPS
              int offsetX = random(7) - 3; 
              int offsetY = random(7) - 3;
              int r = (int)(t * 80); // Expanding circle
              display.drawCircle(64, 32, r, SSD1306_WHITE);
              display.drawCircle(64, 32, r/2, SSD1306_WHITE);
              
              centerText(ev.line1, 28 + offsetY, offsetX);
              break;
          }
              
          case ANIM_POP_MALE:
          case ANIM_POP_FEMALE: {
              int offset = (ev.animation == ANIM_POP_MALE) ? -15 : 15;
              if(t < 0.9) { 
                  centerText(ev.line1, 28, offset);
              }
              break;
          }
              
          case ANIM_FINAL_FADE: {
              drawMoonAndStars(now);
              // Slowly drop text off screen
              int yDrop = (int)(t * 30);
              centerText(ev.line1, 48 + yDrop, 0);
              break;
          }
      }
  } else {
      // Idle / waiting for next event. Let's just draw some stars to not make it fully black.
      if (elapsed > MS(20) && elapsed < MS(300)) {
          drawMoonAndStars(now);
      }
  }
  
  display.display();
  
  // Cap framerate (approx 30-40 FPS)
  delay(20); 
}
