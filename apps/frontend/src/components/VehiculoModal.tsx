import { useState, type ChangeEvent, type ReactNode } from "react";
import type { NuevoVehiculo, Vehiculo } from "@dunamis/contracts";
import { vehiculosApi } from "../api/vehiculos.js";
import { FlotaModal } from "./FlotaModal.js";

interface VehiculoForm {
  placa: string;
  modelo: string;
  kilometraje: string;
  estado: Vehiculo["estado"];
}

const formularioInicial = (vehiculo: Vehiculo | null): VehiculoForm => ({
  placa: vehiculo?.placa ?? "",
  modelo: vehiculo?.modelo ?? "",
  kilometraje: vehiculo ? String(vehiculo.kilometraje) : "",
  estado: vehiculo?.estado ?? "activo",
});

const aDatos = (formulario: VehiculoForm): NuevoVehiculo => ({
  placa: formulario.placa.trim().toUpperCase(),
  modelo: formulario.modelo.trim(),
  kilometraje: Number(formulario.kilometraje),
  estado: formulario.estado,
});

type Cambio = ChangeEvent<HTMLInputElement | HTMLSelectElement>;

// Cada control lleva en `name` el campo del formulario que edita.
const Campos = ({
  formulario,
  onCambio,
}: {
  formulario: VehiculoForm;
  onCambio: (event: Cambio) => void;
}): ReactNode => (
  <>
    <label>
      Placa
      <input
        name="placa"
        autoFocus
        required
        maxLength={20}
        value={formulario.placa}
        onChange={onCambio}
      />
    </label>
    <label>
      Modelo
      <input name="modelo" required maxLength={120} value={formulario.modelo} onChange={onCambio} />
    </label>
    <label>
      Kilometraje
      <input
        name="kilometraje"
        required
        min="0"
        step="1"
        type="number"
        value={formulario.kilometraje}
        onChange={onCambio}
      />
    </label>
    <label>
      Estado
      <select name="estado" value={formulario.estado} onChange={onCambio}>
        <option value="activo">Disponible</option>
        <option value="en_mantenimiento">En mantenimiento</option>
        <option value="baja">De baja</option>
      </select>
    </label>
  </>
);

interface VehiculoModalProps {
  /** Vehículo a editar; `null` para registrar uno nuevo. */
  vehiculo: Vehiculo | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

export const VehiculoModal = ({
  vehiculo,
  onCerrar,
  onGuardado,
}: VehiculoModalProps): ReactNode => {
  const [formulario, setFormulario] = useState(() => formularioInicial(vehiculo));
  const titulo = vehiculo ? "Editar vehículo" : "Registrar vehículo";
  const cambiar = (event: Cambio): void => {
    setFormulario({ ...formulario, [event.target.name]: event.target.value });
  };
  const guardar = async (): Promise<void> => {
    if (vehiculo) await vehiculosApi.actualizar(vehiculo.id_vehiculo, aDatos(formulario));
    else await vehiculosApi.crear(aDatos(formulario));
    onGuardado(`Vehículo ${vehiculo ? "actualizado" : "registrado"} correctamente.`);
  };

  return (
    <FlotaModal
      etiqueta={vehiculo ? "Edición" : "Nuevo registro"}
      titulo={titulo}
      textoGuardar={vehiculo ? "Guardar cambios" : titulo}
      onGuardar={guardar}
      onCerrar={onCerrar}
    >
      <Campos formulario={formulario} onCambio={cambiar} />
    </FlotaModal>
  );
};
