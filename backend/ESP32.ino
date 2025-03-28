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
const char* BANDEJAS_STATUS_ENDPOINT = "/bandejas/status"; // Change to your new endpoint
const char* UPDATE_ENDPOINT = "/bandejas/updateFromESP32";

// UART with Arduino
#define RX1_PIN 16
#define TX1_PIN 17

// Timing
unsigned long previousMillis = 0;
const long interval = 5000;  // Increased to 5 seconds
const long COMMAND_TIMEOUT = 3000;  // 3 seconds timeout for command responses
const long SENSOR_READ_TIMEOUT = 4000;  // 4 seconds timeout for sensor data
const long ACK_TIMEOUT = 1000;  // 1 second timeout for ACK

// State tracking
bool commandInProgress = false;
unsigned long commandStartTime = 0;

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
    
    if (!commandInProgress && currentMillis - previousMillis >= interval) {
        previousMillis = currentMillis;
        
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\n--- Starting periodic check ---");
            commandInProgress = true;
            commandStartTime = currentMillis;
            checkBandejas();  // Check bandeja status and send commands to Arduino
        } else {
            Serial.println("WiFi connection lost. Attempting to reconnect...");
            WiFi.begin(ssid, password);
        }
    }

    // Handle command timeout
    if (commandInProgress && currentMillis - commandStartTime > COMMAND_TIMEOUT) {
        Serial.println("Command timeout - resetting state");
        commandInProgress = false;
        waitingForSensorData = false;
    }

    processArduinoResponse();
}

void checkBandejas() {
    Serial.println("Checking bandejas status from database...");
    HTTPClient http;
    http.begin(String(BASE_URL) + BANDEJAS_STATUS_ENDPOINT);
    
    int httpCode = http.GET();
    Serial.print("Bandejas check HTTP response: ");
    Serial.println(httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Received payload: " + payload);
        
        DynamicJsonDocument doc(4096);  // Increased size for all bandejas
        DeserializationError error = deserializeJson(doc, payload);
        
        if (error) {
            Serial.print("deserializeJson() failed: ");
            Serial.println(error.c_str());
            http.end();
            return;
        }
        
        // Create arrays to store bandeja IDs for each category
        int maxBandejas = 12; // Maximum number of bandejas (0-11)
        int bandejasPrendidas[maxBandejas];
        int bandejasApagadas[maxBandejas];
        int prendidasSinResistencia[maxBandejas];
        int countPrendidas = 0;
        int countApagadas = 0; 
        int countSinResistencia = 0;
        
        // Initialize all arrays with -1 (invalid bandeja ID)
        for (int i = 0; i < maxBandejas; i++) {
            bandejasPrendidas[i] = -1;
            bandejasApagadas[i] = -1;
            prendidasSinResistencia[i] = -1;
        }
        
        // Parse bandejas_prendidas array
        if (doc.containsKey("bandejas_prendidas")) {
            JsonArray prendidas = doc["bandejas_prendidas"];
            for (JsonVariant v : prendidas) {
                if (countPrendidas < maxBandejas) {
                    // Handle both numeric and string values
                    if (v.is<int>()) {
                        bandejasPrendidas[countPrendidas++] = v.as<int>();
                    } else if (v.is<const char*>()) {
                        bandejasPrendidas[countPrendidas++] = atoi(v.as<const char*>());
                    }
                }
            }
        }
        
        // Parse bandejas_apagadas array
        if (doc.containsKey("bandejas_apagadas")) {
            JsonArray apagadas = doc["bandejas_apagadas"];
            for (JsonVariant v : apagadas) {
                if (countApagadas < maxBandejas) {
                    // Handle both numeric and string values
                    if (v.is<int>()) {
                        bandejasApagadas[countApagadas++] = v.as<int>();
                    } else if (v.is<const char*>()) {
                        bandejasApagadas[countApagadas++] = atoi(v.as<const char*>());
                    }
                }
            }
        }
        
        // Parse prendida_sinResistencia array
        if (doc.containsKey("prendida_sinResistencia")) {
            JsonArray sinResistencia = doc["prendida_sinResistencia"];
            for (JsonVariant v : sinResistencia) {
                if (countSinResistencia < maxBandejas) {
                    // Handle both numeric and string values
                    if (v.is<int>()) {
                        prendidasSinResistencia[countSinResistencia++] = v.as<int>();
                    } else if (v.is<const char*>()) {
                        prendidasSinResistencia[countSinResistencia++] = atoi(v.as<const char*>());
                    }
                }
            }
        }
        
        // Log parsed data
        Serial.println("Parsed bandeja status:");
        Serial.print("bandejas_prendidas: ");
        for (int i = 0; i < countPrendidas; i++) {
            Serial.print(bandejasPrendidas[i]);
            Serial.print(", ");
        }
        Serial.println();
        
        Serial.print("bandejas_apagadas: ");
        for (int i = 0; i < countApagadas; i++) {
            Serial.print(bandejasApagadas[i]);
            Serial.print(", ");
        }
        Serial.println();
        
        Serial.print("prendida_sinResistencia: ");
        for (int i = 0; i < countSinResistencia; i++) {
            Serial.print(prendidasSinResistencia[i]);
            Serial.print(", ");
        }
        Serial.println();
        
        // Send commands to Arduino based on bandeja status
        sendCommandsToArduino(bandejasPrendidas, countPrendidas, 
                             bandejasApagadas, countApagadas,
                             prendidasSinResistencia, countSinResistencia);
        
    } else {
        Serial.println("Error getting bandejas status: " + String(httpCode));
        if (httpCode > 0) {
            String errorPayload = http.getString();
            Serial.println("Error response: " + errorPayload);
        }
    }
    
    http.end();
}

void sendCommandsToArduino(int* prendidas, int countPrendidas, 
                          int* apagadas, int countApagadas,
                          int* sinResistencia, int countSinResistencia) {
    // Construimos un string con todos los comandos para enviar al arduino
    // El formato será: "UPDATE,OFF:<list>,FULL:<list>,MONLY:<list>"
    // Donde cada lista es separada por comas y contiene los IDs de las bandejas
    
    String command = "UPDATE,";
    
    // Add bandejas_apagadas (all OFF)
    command += "OFF:";
    for (int i = 0; i < countApagadas; i++) {
        if (apagadas[i] != -1) {
            command += String(apagadas[i]);
            if (i < countApagadas - 1) command += ",";
        }
    }
    
    // Add bandejas_prendidas (MOTOR + RESISTENCIA)
    command += ";FULL:";
    for (int i = 0; i < countPrendidas; i++) {
        if (prendidas[i] != -1) {
            command += String(prendidas[i]);
            if (i < countPrendidas - 1) command += ",";
        }
    }
    
    // Add prendida_sinResistencia (MOTOR only)
    command += ";MONLY:";
    for (int i = 0; i < countSinResistencia; i++) {
        if (sinResistencia[i] != -1) {
            command += String(sinResistencia[i]);
            if (i < countSinResistencia - 1) command += ",";
        }
    }
    
    // Send command to Arduino
    Serial.println("Sending command to Arduino: " + command);
    Serial2.println(command);
}

void requestSensorData() {
    Serial.println("Requesting sensor data from Arduino...");
    Serial2.flush(); // Make sure previous transmissions are complete
    delay(100);  // Short delay to ensure Arduino is ready
    Serial2.println("SEND");
    
    // Wait for acknowledgment with a timeout
    unsigned long startTime = millis();
    bool acknowledged = false;
    
    while (millis() - startTime < ACK_TIMEOUT) {
        if (Serial2.available()) {
            String response = Serial2.readStringUntil('\n');
            response.trim();
            
            Serial.println("Received response: '" + response + "'");
            
            if (response == "ACK") {
                acknowledged = true;
                Serial.println("Arduino acknowledged data request");
                waitingForSensorData = true;
                sensorDataTimeout = millis() + SENSOR_READ_TIMEOUT;
                break;
            }
        }
        yield(); // Allow ESP32 to handle background tasks
    }
    
    if (!acknowledged) {
        Serial.println("No acknowledgment from Arduino");
        waitingForSensorData = false;
        commandInProgress = false;
    }
}

void processArduinoResponse() {
    if (Serial2.available()) {
        String response = Serial2.readStringUntil('\n');
        response.trim();
        
        if (response == "ACK") {
            return;
        }
        
        if (response.startsWith("OK,") || response.startsWith("ERROR,")) {
            Serial.println("Arduino command response: " + response);
            // After receiving command confirmation, request sensor data
            if (response == "OK,UPDATE") {
                delay(100);  // Give Arduino time to prepare
                requestSensorData();
            }
            return;
        }
        
        if (response.length() > 0) {
            Serial.println("Received sensor data from Arduino: " + response);
            updateBackend(response);
            waitingForSensorData = false;
            commandInProgress = false;
            Serial.println("--- Periodic check complete ---\n");
        }
    }
}

void updateBackend(String sensorData) {
    Serial.println("Updating backend with sensor data...");
    HTTPClient http;
    http.begin(String(BASE_URL) + UPDATE_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    
    // Sanitize the sensor data
    String sanitizedData = "";
    for (int i = 0; i < sensorData.length(); i++) {
        char c = sensorData.charAt(i);
        // Skip control characters except tabs and newlines
        if (c < 32) {
            if (c == '\t') sanitizedData += "\\t";
            else if (c == '\n') sanitizedData += "\\n";
            else if (c == '\r') sanitizedData += "\\r";
            // Skip other control characters
        } else {
            // Escape backslash and double quotes
            if (c == '\\' || c == '"') sanitizedData += '\\';
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
 