#define RX1_PIN 16
#define TX1_PIN 17

unsigned long previousMillis = 0;
const long interval = 5000;

void setup() {
    Serial.begin(115200);
    Serial2.begin(115200, SERIAL_8N1, RX1_PIN, TX1_PIN);  // UART con el único esclavo
}

void loop() {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= interval) {
        previousMillis = currentMillis;
        Serial2.println("SEND");
    }

    leerDatos(Serial2, "Esclavo");
}

void leerDatos(HardwareSerial &puerto, String nombre) {
    if (puerto.available()) {
        String data = "";
        while (puerto.available()) {
            char c = puerto.read();
            if (c == '\n') break;
            data += c;
        }
        if (data == "ERROR") {
            Serial.println("Error al leer los datos de " + nombre);
        } else {
            Serial.print(nombre + ": ");
            Serial.println(data);
        }
    }
}