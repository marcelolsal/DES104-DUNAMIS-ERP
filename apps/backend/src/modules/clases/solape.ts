// Lógica pura de solapes horarios. Sin BD ni env → testeable en aislamiento.
// Toda clase ocupa la franja [fecha_hora, fecha_hora + duración). Como la
// duración es fija, dos franjas se solapan si sus inicios distan menos que ella.
// ponytail: duración fija global; si algún día hay clases de distinta duración,
// la salida es una columna fecha_fin por clase (issue nuevo, no #17).

export type Franja = { fecha_hora: Date };

export const seSolapan = (a: Date, b: Date, duracionMin: number): boolean =>
  Math.abs(a.getTime() - b.getTime()) < duracionMin * 60_000;

// De un conjunto de clases candidatas (mismo instructor o vehículo, no
// canceladas), devuelve las que chocan con la franja dada.
export const solapesCon = <T extends Franja>(
  fecha: Date,
  candidatas: T[],
  duracionMin: number,
): T[] => candidatas.filter((c) => seSolapan(fecha, c.fecha_hora, duracionMin));
