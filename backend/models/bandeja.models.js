class Bandeja {
  constructor(
    id,
    id_bandeja,
    temperaturaActual,
    humedadActual,
    estadoMotor,
    estadoResistencia,
    estatus,
    ultimaActualizacion,
    tipo,
    horaInicio
  ) {
    this.id = id;
    this.id_bandeja = id_bandeja;
    this.temperaturaActual = temperaturaActual;
    this.humedadActual = humedadActual;
    this.estadoMotor = estadoMotor;
    this.estadoResistencia = estadoResistencia;
    this.estatus = estatus; // "disponible", "pendiente", "activo"
    this.horaInicio = horaInicio;
    this.ultimaActualizacion = ultimaActualizacion;
    this.tipo = tipo; // "Carne", "Fruta", "Verdura"
  }
}

export default Bandeja;
