class Bandeja {
  constructor(
    id,
    id_bandeja,
    temperaturaActual,
    humedadActual,
    estadoMotor,
    estadoResistencia,
    estatus,
    ultimaActualizacion
  ) {
    this.id = id;
    this.id_bandeja = id_bandeja;
    this.temperaturaActual = temperaturaActual;
    this.humedadActual = humedadActual;
    this.estadoMotor = estadoMotor;
    this.estadoResistencia = estadoResistencia;
    this.estatus = estatus; // "disponible", "pendiente", "activo"
    this.ultimaActualizacion = ultimaActualizacion;
  }
}

export default Bandeja;
