#include <DHT.h>

#define NUM_SENSORES 10
#define DHT_TYPE DHT11
#define MAX_TEMP 60.0
#define MIN_TEMP 40.0

int DHT_PINS[NUM_SENSORES] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
int MOTOR_PINS[NUM_SENSORES] = {22, 23, 24, 25, 26, 27, 28, 29, 30, 31};
int RESISTENCIA_PINS[NUM_SENSORES] = {33, 34, 35, 36, 37, 38, 39, 40, 41, 42};

// Estado de las bandejas
bool bandeja_activa[NUM_SENSORES] = {false};

DHT dht[NUM_SENSORES] = {
    DHT(2, DHT_TYPE), DHT(3, DHT_TYPE), DHT(4, DHT_TYPE),
    DHT(5, DHT_TYPE), DHT(6, DHT_TYPE), DHT(7, DHT_TYPE),
    DHT(8, DHT_TYPE), DHT(9, DHT_TYPE), DHT(10, DHT_TYPE),
    DHT(11, DHT_TYPE)
};

void setup() {
    Serial.begin(115200);  // Comunicación con el Monitor Serial
    Serial1.begin(115200); // Comunicación con el ESP32 (maestro)

    Serial.println("\nArduino starting up...");
    Serial.println("Initializing sensors and pins...");

    // Inicializar los pines
    for (int i = 0; i < NUM_SENSORES; i++) {
        dht[i].begin();
        pinMode(MOTOR_PINS[i], OUTPUT);
        pinMode(RESISTENCIA_PINS[i], OUTPUT);
        digitalWrite(MOTOR_PINS[i], LOW);
        digitalWrite(RESISTENCIA_PINS[i], LOW);
        Serial.println("Initialized bandeja " + String(i) + ":");
        Serial.println("  - DHT Pin: " + String(DHT_PINS[i]));
        Serial.println("  - Motor Pin: " + String(MOTOR_PINS[i]));
        Serial.println("  - Resistencia Pin: " + String(RESISTENCIA_PINS[i]));
    }
    Serial.println("Initialization complete!");
}

void procesarComando(String comando) {
    Serial.println("Processing command: " + comando);
    
    // Check if the command contains a comma
    if (comando.indexOf(',') == -1) {
        Serial.println("Error: Invalid command format (no comma found)");
        Serial1.println("ERROR,FORMAT");
        return;
    }
    
    // Formato esperado: "ON,X" o "OFF,X" donde X es el número de bandeja (0-9)
    if (comando.length() < 4) {
        Serial.println("Error: Command too short");
        Serial1.println("ERROR,LENGTH");
        return;
    }
    
    String accion = comando.substring(0, comando.indexOf(','));
    int bandeja = comando.substring(comando.indexOf(',') + 1).toInt();
    
    Serial.println("Parsed command - Action: " + accion + ", Bandeja: " + String(bandeja));
    
    if (bandeja < 0 || bandeja >= NUM_SENSORES) {
        Serial.println("Error: Invalid bandeja number");
        Serial1.println("ERROR," + String(bandeja));
        return;
    }

    if (accion == "ON") {
        bandeja_activa[bandeja] = true;
        Serial.println("Activating bandeja " + String(bandeja));
        Serial1.println("OK," + String(bandeja));
    }
    else if (accion == "OFF") {
        bandeja_activa[bandeja] = false;
        digitalWrite(MOTOR_PINS[bandeja], LOW);
        digitalWrite(RESISTENCIA_PINS[bandeja], LOW);
        Serial.println("Deactivating bandeja " + String(bandeja) + " (motor and resistance OFF)");
        Serial1.println("OK," + String(bandeja));
    }
}

void loop() {
    // Procesar comandos entrantes
    if (Serial1.available()) {
        String comando = Serial1.readStringUntil('\n');
        comando.trim(); // Remove any whitespace or newline characters
        
        Serial.println("\nReceived command from ESP32: " + comando);
        
        if (comando == "SEND") {
            Serial.println("Recognized SEND command");
            Serial1.println("ACK"); // Send acknowledgment
            enviarDatos();
        } else {
            procesarComando(comando);
        }
    }


    // Control de temperatura para bandejas activas
    for (int i = 0; i < NUM_SENSORES; i++) {
        if (bandeja_activa[i]) {
            float temperatura = dht[i].readTemperature();
            if (!isnan(temperatura)) {
                Serial.println("Bandeja " + String(i) + " temperature: " + String(temperatura) + "°C");
                // Control de temperatura
                if (temperatura < MIN_TEMP) {
                    if (digitalRead(RESISTENCIA_PINS[i]) == LOW || digitalRead(MOTOR_PINS[i]) == LOW) {
                        Serial.println("  Temperature below minimum. Activating heater and motor.");
                        digitalWrite(RESISTENCIA_PINS[i], HIGH);
                        digitalWrite(MOTOR_PINS[i], HIGH);
                    }
                }
                else if (temperatura > MAX_TEMP) {
                    if (digitalRead(RESISTENCIA_PINS[i]) == HIGH || digitalRead(MOTOR_PINS[i]) == HIGH) {
                        Serial.println("  Temperature above maximum. Deactivating heater and motor.");
                        digitalWrite(RESISTENCIA_PINS[i], LOW);
                        digitalWrite(MOTOR_PINS[i], LOW);
                    }
                }
            } else {
                Serial.println("Error reading temperature from bandeja " + String(i));
            }
        }
    }

    delay(1000); // Esperar un segundo
}

void enviarDatos() {
    Serial.println("Collecting sensor data for all bandejas...");
    String data = "";
    
    for (int i = 0; i < NUM_SENSORES; i++) {
        float temperatura = dht[i].readTemperature();
        float humedad = dht[i].readHumidity();
        
        Serial.println("\nBandeja " + String(i) + ":");
        if (isnan(temperatura) || isnan(humedad)) {
            Serial.println("  Error reading sensor");
            data += "-1,-1,0,0";
        } else {
            int resistenciaEstado = digitalRead(RESISTENCIA_PINS[i]);
            int motorEstado = digitalRead(MOTOR_PINS[i]);
            Serial.println("  Temperature: " + String(temperatura, 1) + "°C");
            Serial.println("  Humidity: " + String(humedad, 1) + "%");
            Serial.println("  Heater: " + String(resistenciaEstado ? "ON" : "OFF"));
            Serial.println("  Motor: " + String(motorEstado ? "ON" : "OFF"));
            
            data += String(temperatura, 1) + "," + 
                   String(humedad, 1) + "," + 
                   String(resistenciaEstado) + "," + 
                   String(motorEstado);
        }
        
        if (i < NUM_SENSORES - 1) data += ",";
    }
    
    Serial.println("\nSending data to ESP32: " + data);
    Serial1.println(data);
}