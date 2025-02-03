document.addEventListener("DOMContentLoaded", function () {
    const barras = document.querySelectorAll(".barra");
    
    barras.forEach(barra => {
        let tipo = barra.dataset.tipo;
        let valor = Math.floor(Math.random() * 101);
        
        barra.style.width = valor + "%";
        
        if (tipo === "temperatura") {
            barra.style.background = `rgb(${255 - (valor * 2.55)}, 0, 0)`;
        } else if (tipo === "humedad") {
            barra.style.background = `rgb(0, 0, ${255 - (valor * 2.55)})`;
        } else if (tipo === "tiempo") {
            barra.style.background = `rgb(0, ${255 - (valor * 2.55)}, 0)`;
        }
    });

    document.querySelector(".emergencia").addEventListener("click", function () {
        alert("¡Emergencia activada!");
    });

    document.querySelectorAll(".activar").forEach(boton => {
        boton.addEventListener("click", function () {
            alert("Resistencia activada para la charola");
        });
    });
});
