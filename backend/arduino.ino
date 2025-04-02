#include <DHT.h>

#define NUM_SENSORES 11
#define NUM_RELAY 22
#define DHT_TYPE DHT11

// Estas variables ya no se usan, se pueden eliminar
// float MAX_TEMP = 60.0;
// float MIN_TEMP = 40.0;

int DHT_PINS[NUM_SENSORES] =         {2,   3,  4,  5,  6,  7,  8,  9, 10, 11, 12};
int MOTOR_PINS[NUM_SENSORES] =       {22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32};
int RESISTENCIA_PINS[NUM_SENSORES] = {33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43};

// Estado de las bandejas
bool bandeja_activa[NUM_SENSORES] = {false};

DHT dht[NUM_SENSORES] = {
    DHT(2, DHT_TYPE), DHT(3, DHT_TYPE), DHT(4, DHT_TYPE),
    DHT(5, DHT_TYPE), DHT(6, DHT_TYPE), DHT(7, DHT_TYPE),
    DHT(8, DHT_TYPE), DHT(9, DHT_TYPE), DHT(10, DHT_TYPE),
    DHT(11, DHT_TYPE), DHT(12, DHT_TYPE)
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

void processBandejaList(String list, bool motorOn, bool resistenciaOn) {
    while (list.length() > 0) {
        int commaIndex = list.indexOf(',');
        String bandejaStr;
        
        if (commaIndex == -1) {
            bandejaStr = list;
            list = "";
        } else {
            bandejaStr = list.substring(0, commaIndex);
            list = list.substring(commaIndex + 1);
        }
        
        int bandeja = bandejaStr.toInt() + 1;
        if (bandeja > 0 && bandeja <= NUM_SENSORES) {
            digitalWrite(MOTOR_PINS[bandeja], motorOn ? HIGH : LOW);
            digitalWrite(RESISTENCIA_PINS[bandeja], resistenciaOn ? HIGH : LOW);
            bandeja_activa[bandeja] = motorOn || resistenciaOn;
            
            Serial.println("Bandeja " + String(bandeja) + 
                         ": Motor=" + String(motorOn ? "ON" : "OFF") + 
                         ", Resistencia=" + String(resistenciaOn ? "ON" : "OFF"));
        }
    }
}

void procesarComando(String comando) {
    Serial.println("Processing command: " + comando);
    
    if (comando.startsWith("UPDATE,")) {
        // Remove "UPDATE," prefix
        comando = comando.substring(7);
        
        // Split into sections (OFF:x,y,z;FULL:a,b,c;MONLY:d,e,f)
        while (comando.length() > 0) {
            int endIndex = comando.indexOf(';');
            String section;
            
            if (endIndex == -1) {
                section = comando;
                comando = "";
            } else {
                section = comando.substring(0, endIndex);
                comando = comando.substring(endIndex + 1);
            }
            
            // Process each section
            if (section.startsWith("OFF:")) {
                processBandejaList(section.substring(4), false, false);
            }
            else if (section.startsWith("FULL:")) {
                processBandejaList(section.substring(5), true, true);
            }
            else if (section.startsWith("MONLY:")) {
                processBandejaList(section.substring(6), true, false);
            }
            
            // Add small delay between processing sections
            delay(10);
        }
        
        // Give pins time to stabilize before sending OK
        delay(50);
        Serial1.println("OK,UPDATE");
    } else {
        Serial.println("Unknown command format");
        Serial1.println("ERROR,FORMAT");
    }
}

void loop() {
    if (Serial1.available()) {
        String comando = Serial1.readStringUntil('\n');
        comando.trim();
        
        Serial.println("\nReceived command from ESP32: " + comando);
        
        if (comando == "SEND") {
            Serial.println("Recognized SEND command");
            Serial1.println("ACK");
            enviarDatos();
        } else if (comando.startsWith("UPDATE,")) {
            procesarComando(comando);
        } else {
            Serial.println("Unknown command: " + comando);
            Serial1.println("ERROR,UNKNOWN_COMMAND");
        }
    }
}

void enviarDatos() {
    Serial.println("Recopilando datos de todos los sensores...");
    String data = "";
    
    // Give DHT sensors time to stabilize
    delay(100);
    
    for (int i = 0; i < NUM_SENSORES; i++) {
        // Add delay between sensor readings
        if (i > 0) delay(50);  // 50ms delay between sensors
        
        float temperatura = dht[i].readTemperature();
        delay(50);  // Wait between temperature and humidity reading
        float humedad = dht[i].readHumidity();
        
        Serial.println("\nBandeja " + String(i) + ":");
        if (isnan(temperatura) || isnan(humedad)) {
            Serial.println("  Error reading sensor");
            data += "-1,-1";
        } else {
            Serial.println("  Temperature: " + String(temperatura, 1) + "°C");
            Serial.println("  Humidity: " + String(humedad, 1) + "%");
            
            data += String(temperatura, 1) + "," + 
                   String(humedad, 1);
        }
        
        if (i < NUM_SENSORES - 1) data += ",";
    }
    
    Serial.println("\nEnviando datos al ESP32: " + data);
    Serial1.println(data);
}
