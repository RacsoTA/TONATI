const horno = document.getElementById("horno");
const almacenamiento = document.getElementById("almacenamiento");

const almacenamientoTemp = document.getElementById("almacenamientoTemp");
const almacenamientoTempValue = document.getElementById("almacenamientoTempValue");

const almacenamientoHum = document.getElementById("almacenamientoHum");
const almacenamientoHumValue = document.getElementById("almacenamientoHumValue");

const btnDeshidratar = document.getElementById("btnDeshidratar");
let opcionSeleccionada = false;

const btnCarne = document.getElementById("btnCarne");
const btnVegetales = document.getElementById("btnVegetales");
const btnFrutas = document.getElementById("btnFrutas");

// Crear elementos dinámicamente para el horno
function createRow(id) {
    const row = document.createElement("div");
    row.className = "row";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = id;

    const tempBarContainer = document.createElement("div");
    tempBarContainer.className = "bar-container";

    const tempBar = document.createElement("div");
    tempBar.className = "bar temp";

    const tempValue = document.createElement("span");
    tempValue.className = "value";

    tempBarContainer.appendChild(tempBar);
    tempBarContainer.appendChild(tempValue);

    const humBarContainer = document.createElement("div");
    humBarContainer.className = "bar-container";

    const humBar = document.createElement("div");
    humBar.className = "bar hum";

    const humValue = document.createElement("span");
    humValue.className = "value";

    humBarContainer.appendChild(humBar);
    humBarContainer.appendChild(humValue);

    row.appendChild(label);
    row.appendChild(tempBarContainer);
    row.appendChild(humBarContainer);

    return { row, tempBar, tempValue, humBar, humValue };
}

// Crear filas para el horno con 10 cajones
let hornoRows = [];
for (let i = 1; i <= 2; i++) {
    let hornoData = createRow(i);

    // Crear cajones dentro de cada fila de horno
    let cajon = document.createElement("div");
    cajon.className = "cajon";
    cajon.id = `cajon${i}`;
    hornoData.row.appendChild(cajon);
    
    horno.appendChild(hornoData.row);
    hornoRows.push(hornoData);
}

// Crear el cajón de almacenamiento
let almacenamientoCajon = document.createElement("div");
almacenamientoCajon.className = "cajon";
almacenamiento.appendChild(almacenamientoCajon);

// Actualizar valores cada 3 segundos
function updateValues() {
    hornoRows.forEach(row => {
        let temp = Math.floor(Math.random() * 101);
        let hum = Math.floor(Math.random() * 101);

        row.tempBar.style.width = `${temp}%`;
        row.tempValue.textContent = `${temp}°C`;

        row.humBar.style.width = `${hum}%`;
        row.humValue.textContent = `${hum}%`;

        // Cambiar el estado de ocupación de los cajones del horno (ocupado o libre)
        let cajon = row.row.querySelector('.cajon');
        cajon.classList.toggle("ocupado", Math.random() > 0.5);
    });

    let tempAlmacenamiento = Math.floor(Math.random() * 101);
    let humAlmacenamiento = Math.floor(Math.random() * 101);

    almacenamientoTemp.style.width = `${tempAlmacenamiento}%`;
    almacenamientoTempValue.textContent = `${tempAlmacenamiento}°C`;

    almacenamientoHum.style.width = `${humAlmacenamiento}%`;
    almacenamientoHumValue.textContent = `${humAlmacenamiento}%`;

    almacenamientoCajon.classList.toggle("activo", Math.random() > 0.5);
}

// Habilitar el botón de "Empezar a deshidratar" después de seleccionar una opción
function habilitarDeshidratar() {
    btnDeshidratar.disabled = false;
}

// Evento para seleccionar una opción
btnCarne.addEventListener("click", () => { opcionSeleccionada = true; habilitarDeshidratar(); });
btnVegetales.addEventListener("click", () => { opcionSeleccionada = true; habilitarDeshidratar(); });
btnFrutas.addEventListener("click", () => { opcionSeleccionada = true; habilitarDeshidratar(); });

setInterval(updateValues, 3000);