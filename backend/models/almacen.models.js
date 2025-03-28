export class Almacen {
  constructor(
    id,
    temperaturaActual,
    humedadActual,
    estadoMotor,
    estadoResistencia,
    ultimaActualizacion
  ) {
    this.id = id;
    this.temperaturaActual = temperaturaActual;
    this.humedadActual = humedadActual;
    this.estadoMotor = estadoMotor;
    this.estadoResistencia = estadoResistencia;
    this.ultimaActualizacion = ultimaActualizacion;
  }
}
