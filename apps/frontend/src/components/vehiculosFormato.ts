import type { Vehiculo } from "@dunamis/contracts";

export const estadoTexto: Record<Vehiculo["estado"], string> = {
  activo: "Disponible",
  en_mantenimiento: "Mantenimiento",
  baja: "De baja",
};

export const kilometrajeLegible = (kilometraje: number): string =>
  `${new Intl.NumberFormat("en-US").format(kilometraje)} km`;
