#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "INFINITUM13AE";
const char* password = "M3zKhzVRq2";

bool waitingForSensorData = false;
unsigned long sensorDataTimeout = 0;


// API endpoints
const char* BASE_URL = "http://192.168.1.183:3000";
const char* ACTIVAS_ENDPOINT = "/api/bandejas/activas";
const char* ACTIVAS12_ENDPOINT = "/api/bandejas/activas12horas";
const char* UPDATE_ENDPOINT = "/api/bandejas/updateFromESP32";
const char* FINALIZAR_ENDPOINT = "/api/bandejas/finalizar";

// UART with Arduino
#define RX1_PIN 16
#define TX1_PIN 17

// Timing
unsigned long previousMillis = 0;
const long interval = 5000;  // 5 seconds

// State tracking
bool bandejasActivas[10] = {false};

void setup() {
    Serial.begin(115200);
    Serial2.begin(115200, SERIAL_8N1, RX1_PIN, TX1_PIN);

    Serial.println("\nESP32 Starting up...");
    Serial.print("Connecting to WiFi");
    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

void loop() {
    unsigned long currentMillis = millis();
    
    if (currentMillis - previousMillis >= interval) {
        previousMillis = currentMillis;
        
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\n--- Starting periodic check ---");
            checkActiveBandejas();
            check12HourBandejas();
            
            // Check if we're still waiting for a previous response
            if (waitingForSensorData) {
                if (currentMillis > sensorDataTimeout) {
                    Serial.println("Timeout waiting for sensor data");
                    waitingForSensorData = false;
                    requestAndUpdateStates(); // Try again
                }
            } else {
                requestAndUpdateStates();
            }
            
            Serial.println("--- Periodic check complete ---\n");
        } else {
            Serial.println("WiFi connection lost. Attempting to reconnect...");
            WiFi.begin(ssid, password);
        }
    }

    // Check for Arduino responses
    processArduinoResponse();
}


void checkActiveBandejas() {
    Serial.println("Checking active bandejas...");
    HTTPClient http;
    http.begin(String(BASE_URL) + ACTIVAS_ENDPOINT);
    
    int httpCode = http.GET();
    Serial.print("Active bandejas HTTP response: ");
    Serial.println(httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Received payload: " + payload);
        
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, payload);
        
        // Reset current active state
        bool newBandejasActivas[10] = {false};
        
        // Process active bandejas
        JsonArray bandejas = doc["bandejas"];
        for (JsonVariant bandeja : bandejas) {
            int id_bandeja = bandeja["id_bandeja"].as<int>();
            if (id_bandeja >= 0 && id_bandeja < 10) {
                newBandejasActivas[id_bandeja] = true;
                // If this is a newly active bandeja, send command to Arduino
                if (!bandejasActivas[id_bandeja]) {
                    Serial.println("Sending activation command for bandeja " + String(id_bandeja));
                    Serial2.println("ON," + String(id_bandeja));
                }
            }
        }
        
        // Update stored state and log changes
        for (int i = 0; i < 10; i++) {
            if (bandejasActivas[i] != newBandejasActivas[i]) {
                Serial.println("Bandeja " + String(i) + " state changed: " + 
                             String(bandejasActivas[i]) + " -> " + String(newBandejasActivas[i]));
            }
        }
        memcpy(bandejasActivas, newBandejasActivas, sizeof(bandejasActivas));
    }
    
    http.end();
}

void check12HourBandejas() {
    Serial.println("Checking for bandejas active > 12 hours...");
    HTTPClient http;
    http.begin(String(BASE_URL) + ACTIVAS12_ENDPOINT);
    
    int httpCode = http.GET();
    Serial.print("12-hour check HTTP response: ");
    Serial.println(httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Received payload: " + payload);
        
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, payload);
        
        if (!doc["bandeja"].isNull()) {
            int id_bandeja = doc["id_bandeja"].as<int>();
            if (id_bandeja >= 0 && id_bandeja < 10) {
                Serial.println("Found bandeja " + String(id_bandeja) + " active > 12 hours. Stopping...");
                Serial2.println("OFF," + String(id_bandeja));
                finalizarBandeja(id_bandeja);
            }
        }
    }
    
    http.end();
}

void finalizarBandeja(int id_bandeja) {
    Serial.println("Finalizing bandeja " + String(id_bandeja));
    HTTPClient http;
    http.begin(String(BASE_URL) + FINALIZAR_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    
    String requestBody = "{\"id_bandeja\":" + String(id_bandeja) + "}";
    Serial.println("Sending request: " + requestBody);
    
    int httpCode = http.PUT(requestBody);
    Serial.print("Finalize bandeja HTTP response: ");
    Serial.println(httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        Serial.println("Server response: " + response);
    }
    
    http.end();
}

void requestAndUpdateStates() {
    Serial.println("Requesting sensor data from Arduino...");
    Serial2.flush(); // Make sure previous transmissions are complete
    Serial2.println("SEND");
    
    // Wait for acknowledgment with a timeout
    unsigned long startTime = millis();
    bool acknowledged = false;
    
    while (millis() - startTime < 2000) { // Increased timeout to 2 seconds for ACK
        if (Serial2.available()) {
            String response = Serial2.readStringUntil('\n');
            response.trim(); // Remove any whitespace or newline characters
            
            Serial.println("Received response: '" + response + "'");
            
            if (response == "ACK") {
                acknowledged = true;
                Serial.println("Arduino acknowledged data request");
                waitingForSensorData = true;
                sensorDataTimeout = millis() + 5000; // 5-second timeout for data
                break;
            }
        }
        yield(); // Allow ESP32 to handle background tasks
    }
    
    if (!acknowledged) {
        Serial.println("No acknowledgment from Arduino");
        waitingForSensorData = false;
    }
}

void processArduinoResponse() {
    if (Serial2.available()) {
        String response = Serial2.readStringUntil('\n');
        
        // Ignore ACK messages as they're handled in requestAndUpdateStates
        if (response == "ACK") {
            return;
        }
        
        // Check if it's a command confirmation
        if (response.startsWith("OK,") || response.startsWith("ERROR,")) {
            Serial.println("Arduino command response: " + response);
            return;
        }
        
        // Process sensor data
        if (response.length() > 0) {
            Serial.println("Received sensor data from Arduino: " + response);
            updateBackend(response);
            waitingForSensorData = false; // Reset the waiting flag
        }
    }
}


void updateBackend(String sensorData) {
    Serial.println("Updating backend with sensor data...");
    HTTPClient http;
    http.begin(String(BASE_URL) + UPDATE_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    
    // Sanitize the sensor data by removing or escaping control characters
    String sanitizedData = "";
    for (int i = 0; i < sensorData.length(); i++) {
        char c = sensorData.charAt(i);
        // Skip control characters (ASCII 0-31 except tabs and newlines which we'll escape)
        if (c < 32) {
            if (c == '\t') {
                sanitizedData += "\\t"; // Escape tab
            } else if (c == '\n') {
                sanitizedData += "\\n"; // Escape newline
            } else if (c == '\r') {
                sanitizedData += "\\r"; // Escape carriage return
            }
            // Skip other control characters
        } else {
            // For backslash and double quotes, add an escape character
            if (c == '\\' || c == '"') {
                sanitizedData += '\\';
            }
            sanitizedData += c;
        }
    }
    
    String requestBody = "{\"data\":\"" + sanitizedData + "\"}";
    Serial.println("Sending request: " + requestBody);
    
    int httpCode = http.POST(requestBody);
    Serial.print("Update backend HTTP response: ");
    Serial.println(httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        Serial.println("Server response: " + response);
    } else {
        Serial.println("Error in HTTP request: " + String(httpCode));
        if (httpCode > 0) {
            String response = http.getString();
            Serial.println("Server error response: " + response);
        }
    }
    
    http.end();
}
 