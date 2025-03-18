#include <DHT.h>

#define NUM_SENSORES 10
#define DHT_TYPE DHT11

int DHT_PINS[NUM_SENSORES] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
int MOTOR_PINS[NUM_SENSORES] = {22, 23, 24, 25, 26, 27, 28, 29, 30, 31};
int RESISTENCIA_PINS[NUM_SENSORES] = {33, 34, 35, 36, 37, 38, 39, 40, 41, 42};

DHT dht[NUM_SENSORES] = {
    DHT(2, DHT_TYPE), DHT(3, DHT_TYPE), DHT(4, DHT_TYPE),
    DHT(5, DHT_TYPE), DHT(6, DHT_TYPE), DHT(7, DHT_TYPE),
    DHT(8, DHT_TYPE), DHT(9, DHT_TYPE), DHT(10, DHT_TYPE),
    DHT(11, DHT_TYPE)
};

void setup() {
    Serial.begin(115200);  // Comunicación con el Monitor Serial
    Serial1.begin(115200); // Comunicación con el ESP32 (maestro)

    // Inicializar los pines
    for (int i = 0; i < NUM_SENSORES; i++) {
        dht[i].begin();
        pinMode(MOTOR_PINS[i], OUTPUT);
        pinMode(RESISTENCIA_PINS[i], OUTPUT);
        digitalWrite(MOTOR_PINS[i], LOW);
        digitalWrite(RESISTENCIA_PINS[i], LOW);
    }
}

void loop() {
    String data = "";

    // Leer los datos de los sensores y mostrarlos en el monitor serial
    for (int i = 0; i < NUM_SENSORES; i++) {
        float temperatura = dht[i].readTemperature();
        float humedad = dht[i].readHumidity();

        // Verificar si las lecturas son válidas
        if (isnan(temperatura) || isnan(humedad)) {
            data += "-1,-1,0,0"; // Valores inválidos
        } else {
            int resistenciaEstado = 0;
            int motorEstado = 0;

            // Encender/apagar motor y resistencia según las condiciones
            digitalWrite(RESISTENCIA_PINS[i], resistenciaEstado);
            digitalWrite(MOTOR_PINS[i], motorEstado);

            // Crear el string con los datos
            data += String(temperatura, 1) + "," + String(humedad, 1) + "," + String(resistenciaEstado) + "," + String(motorEstado);
        }

        // Añadir coma entre los valores, excepto después del último
        if (i < NUM_SENSORES - 1) data += ",";
    }

    // Imprimir los datos en el Monitor Serial
    Serial.println(data);

    // Enviar los datos al ESP32
    Serial1.println(data);

    // Esperar un segundo antes de la próxima lectura
    delay(1000);
}