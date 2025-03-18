class Procesos {
  constructor(
    estatus,
    alimento,
    bandeja_ID,
    horaFinal,
    horaInicio,
    humedades,
    temperaturas
  ) {
    this.estatus = estatus;
    this.alimento = alimento;
    this.bandeja_ID = bandeja_ID;
    this.horaFinal = horaFinal;
    this.horaInicio = horaInicio;
    this.humedades = humedades;
    this.temperaturas = temperaturas;
  }
}

export default Procesos;
