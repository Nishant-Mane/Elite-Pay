/*
 * Elite.Pay — ESP32 POS Firmware
 *
 * Three operating modes (switch via Serial command):
 *   MODE_IDLE      — waiting, no scan processed
 *   MODE_REGISTER  — next tap registers the card to a user (user portal)
 *   MODE_PAY       — polls backend for a pending charge, then processes payment tap
 *
 * Serial commands:
 *   REG:<userId>   — enter registration mode for this user
 *   RESET          — return to idle
 *
 * The payment amount is set by the merchant on the website.
 * The ESP32 fetches it from the backend before awaiting the tap.
 * No amount is typed into Serial — that was the old workaround.
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ── Pin config ───────────────────────────────────────────────
#define SS_PIN    5
#define RST_PIN   22
#define LED_GREEN 2
#define LED_RED   4
#define BUZZER    15

// ── WiFi / Server — fill before flashing ────────────────────
const char* WIFI_SSID     = "Aditya";
const char* WIFI_PASSWORD = "Anuj@0373";
const char* SERVER_URL    = "http://192.168.1.101:3000";  // ← your PC's LAN IP, NOT the ESP32's IP
const char* DEVICE_ID     = "POS_001";
const char* DEVICE_KEY    = "POS_SECRET_KEY";

// ── Operating modes ─────────────────────────────────────────
enum Mode { MODE_IDLE, MODE_REGISTER, MODE_PAY };
Mode currentMode = MODE_IDLE;

// In registration mode, we store the target userId
String registerUserId = "";

// In payment mode, we store the pending amount fetched from backend
float pendingAmount = 0.0;

// ── Offline queue ────────────────────────────────────────────
struct QueuedTap {
  char cardUID[32];
  float amount;
};

#define MAX_QUEUE 20
QueuedTap offlineQueue[MAX_QUEUE];
int queueSize = 0;

// ── RFID + Preferences ──────────────────────────────────────
MFRC522 rfid(SS_PIN, RST_PIN);
Preferences prefs;

bool wifiConnected = false;

// ── Helpers ──────────────────────────────────────────────────
String getCardUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void beepSuccess() {
  digitalWrite(LED_GREEN, HIGH);
  tone(BUZZER, 1000, 200);
  delay(300);
  digitalWrite(LED_GREEN, LOW);
}

void beepDenied() {
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER, 400, 500);
  delay(600);
  digitalWrite(LED_RED, LOW);
}

// One short beep — used when entering a mode (ready signal)
void beepReady() {
  tone(BUZZER, 1500, 80);
  delay(120);
}

// ── Offline queue persistence ────────────────────────────────
void saveQueue() {
  prefs.begin("queue", false);
  prefs.putInt("size", queueSize);
  for (int i = 0; i < queueSize; i++) {
    StaticJsonDocument<96> doc;
    doc["uid"] = offlineQueue[i].cardUID;
    doc["amt"] = offlineQueue[i].amount;
    String val; serializeJson(doc, val);
    prefs.putString(("t" + String(i)).c_str(), val);
  }
  prefs.end();
}

void loadQueue() {
  prefs.begin("queue", false);
  queueSize = prefs.getInt("size", 0);
  for (int i = 0; i < queueSize; i++) {
    String val = prefs.getString(("t" + String(i)).c_str(), "");
    if (val.length() > 0) {
      StaticJsonDocument<96> doc;
      deserializeJson(doc, val);
      strncpy(offlineQueue[i].cardUID, doc["uid"] | "", 31);
      offlineQueue[i].amount = doc["amt"] | 0.0f;
    }
  }
  prefs.end();
}

void queueTap(const String& cardUID, float amount) {
  if (queueSize >= MAX_QUEUE) {
    // Drop oldest
    for (int i = 1; i < MAX_QUEUE; i++) offlineQueue[i-1] = offlineQueue[i];
    queueSize = MAX_QUEUE - 1;
  }
  strncpy(offlineQueue[queueSize].cardUID, cardUID.c_str(), 31);
  offlineQueue[queueSize].amount = amount;
  queueSize++;
  saveQueue();
  Serial.printf("[OFFLINE] Queued. Queue size: %d\n", queueSize);
}

void syncOfflineQueue() {
  if (queueSize == 0) return;
  Serial.printf("[SYNC] Syncing %d offline taps...\n", queueSize);

  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/tap/sync");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<1024> doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["deviceKey"] = DEVICE_KEY;
  JsonArray taps = doc.createNestedArray("taps");
  for (int i = 0; i < queueSize; i++) {
    JsonObject t = taps.createNestedObject();
    t["cardUID"] = offlineQueue[i].cardUID;
    t["amount"]  = offlineQueue[i].amount;
  }

  String body; serializeJson(doc, body);
  int code = http.POST(body);
  if (code == 200) {
    Serial.println("[SYNC] Success — queue cleared");
    queueSize = 0; saveQueue();
  } else {
    Serial.printf("[SYNC] Failed: HTTP %d\n", code);
  }
  http.end();
}

// ── WiFi ─────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WIFI] Connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.printf("\n[WIFI] Connected: %s\n", WiFi.localIP().toString().c_str());
    syncOfflineQueue();
  } else {
    Serial.println("\n[WIFI] Failed — offline mode");
  }
}

// ── Mode: REGISTER ───────────────────────────────────────────
// Called once when a card is tapped in registration mode.
// POSTs { userId, cardUID, deviceId } to /api/cards/register-tap
void handleRegistrationTap(const String& cardUID) {
  Serial.printf("[REG] Card tapped: %s\n", cardUID.c_str());
  Serial.printf("[REG] Registering to user: %s\n", registerUserId.c_str());

  if (!wifiConnected) {
    Serial.println("[REG] No WiFi — cannot register offline");
    beepDenied();
    return;
  }

  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/cards/register-tap");
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  StaticJsonDocument<128> doc;
  doc["userId"]   = registerUserId;
  doc["cardUID"]  = cardUID;
  doc["deviceId"] = DEVICE_ID;
  String body; serializeJson(doc, body);

  int code = http.POST(body);
  String resp = (code > 0) ? http.getString() : "";
  http.end();

  Serial.printf("[REG] HTTP %d — %s\n", code, resp.c_str());

  if (code == 201 || code == 200) {
    Serial.println("[REG] Card registered successfully");
    beepSuccess();
  } else {
    StaticJsonDocument<128> res; deserializeJson(res, resp);
    Serial.printf("[REG] Failed: %s\n", (const char*)(res["message"] | "error"));
    beepDenied();
  }

  // Return to idle after one registration
  currentMode = MODE_IDLE;
  registerUserId = "";
  Serial.println("[MODE] → IDLE");
}

// ── Mode: PAY ────────────────────────────────────────────────
// Step 1: fetch pending charge set by merchant from backend
// Returns true if a pending amount was found and loaded into pendingAmount
bool fetchPendingCharge() {
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/tap/pending?deviceId=" + DEVICE_ID;
  http.begin(url);
  http.setTimeout(5000);
  int code = http.GET();

  if (code != 200) {
    http.end();
    return false;
  }

  String resp = http.getString();
  http.end();

  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, resp);
  if (err) return false;

  if (!doc["pending"]) return false;
  pendingAmount = doc["amount"] | 0.0f;
  return (pendingAmount > 0);
}

// Step 2: process the actual payment tap
void handlePaymentTap(const String& cardUID) {
  Serial.printf("[PAY] Card tapped: %s | Amount: %.2f INR\n", cardUID.c_str(), pendingAmount);

  if (!wifiConnected) {
    queueTap(cardUID, pendingAmount);
    beepDenied(); delay(200); beepDenied(); // 2 beeps = queued offline
    return;
  }

  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/tap");
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  StaticJsonDocument<192> doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["deviceKey"] = DEVICE_KEY;
  doc["cardUID"]   = cardUID;
  doc["amount"]    = pendingAmount;
  String body; serializeJson(doc, body);

  int code = http.POST(body);
  String resp = (code > 0) ? http.getString() : "";
  http.end();

  if (resp.length() == 0) {
    Serial.println("[PAY] No response — queuing offline");
    queueTap(cardUID, pendingAmount);
    beepDenied();
    return;
  }

  StaticJsonDocument<256> res;
  if (deserializeJson(res, resp)) { beepDenied(); return; }

  const char* status = res["status"] | "error";
  if (strcmp(status, "approved") == 0) {
    float balance = res["balance"] | 0.0f;
    const char* name = res["userName"] | "User";
    Serial.printf("[PAY] APPROVED — Customer: %s | New balance: %.2f\n", name, balance);
    beepSuccess();
  } else {
    const char* msg = res["message"] | "Denied";
    Serial.printf("[PAY] DENIED — %s\n", msg);
    beepDenied();
  }

  // Return to idle — merchant must initiate next charge
  currentMode = MODE_IDLE;
  pendingAmount = 0.0;
  Serial.println("[MODE] → IDLE");
}

// ── Serial command parser ─────────────────────────────────────
// Commands:
//   REG:<userId>   → enter registration mode for that user
//   RESET          → force idle
void handleSerial() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();

  if (cmd.startsWith("REG:")) {
    registerUserId = cmd.substring(4);
    registerUserId.trim();
    if (registerUserId.length() == 0) {
      Serial.println("[CMD] REG requires a userId");
      return;
    }
    currentMode = MODE_REGISTER;
    Serial.printf("[MODE] → REGISTER (userId: %s)\n", registerUserId.c_str());
    Serial.println("[ACTION] Tap the NFC card now to register it...");
    beepReady();

  } else if (cmd == "RESET") {
    currentMode = MODE_IDLE;
    registerUserId = "";
    pendingAmount = 0.0;
    Serial.println("[MODE] → IDLE");

  } else {
    Serial.printf("[CMD] Unknown command: %s\n", cmd.c_str());
  }
}

// ── Setup ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  loadQueue();
  connectWiFi();

  Serial.println("=================================");
  Serial.println("  Elite.Pay POS Ready");
  Serial.println("  Commands:");
  Serial.println("    REG:<userId>  — register card for user");
  Serial.println("    RESET         — return to idle");
  Serial.println("=================================");
  Serial.println("[MODE] → IDLE");
}

// ── Loop ─────────────────────────────────────────────────────
void loop() {
  handleSerial();

  // WiFi watchdog
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnected) {
      wifiConnected = false;
      Serial.println("[WIFI] Disconnected");
    }
    WiFi.reconnect();
  } else if (!wifiConnected) {
    wifiConnected = true;
    Serial.println("[WIFI] Reconnected");
    syncOfflineQueue();
  }

  // ── IDLE: poll backend for a pending merchant charge ─────
  // When the merchant clicks "Await Tap" on the website,
  // the backend creates a pending session for this device.
  // We poll every 2 seconds to pick it up automatically.
  static unsigned long lastPoll = 0;
  if (currentMode == MODE_IDLE && wifiConnected && (millis() - lastPoll > 2000)) {
    lastPoll = millis();
    if (fetchPendingCharge()) {
      Serial.printf("[MODE] → PAY (Amount: %.2f INR — awaiting tap)\n", pendingAmount);
      currentMode = MODE_PAY;
      beepReady();
    }
  }

  // ── Scan card only when in REGISTER or PAY mode ──────────
  if (currentMode == MODE_IDLE) {
    delay(50);
    return;
  }

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  String cardUID = getCardUID();

  switch (currentMode) {
    case MODE_REGISTER:
      handleRegistrationTap(cardUID);
      break;
    case MODE_PAY:
      handlePaymentTap(cardUID);
      break;
    default:
      break;
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500); // debounce
}
