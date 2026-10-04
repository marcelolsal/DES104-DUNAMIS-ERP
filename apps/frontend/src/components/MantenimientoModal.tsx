import { useState, type ChangeEvent, type ReactNode } from "react";
import type { Vehiculo } from "@dunamis/contracts";
import { mantenimientosApi } from "../api/mantenimientos.js";
import { FlotaModal } from "./FlotaModal.js";

// Fecha local en formato YYYY-MM-DD (toISOString() es UTC y de noche propone el día siguiente).
const hoyLocal = (): string => {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

interface MantenimientoForm {
  fecha: string;
  descripcion: string;
  costo: string;
}

type Cambio = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

// Cada control lleva en `name` el campo del formulario que edita.
const Campos = ({
  formulario,
  onCambio,
}: {
  formulario: MantenimientoForm;
  onCambio: (event: Cambio) => void;
}): ReactNode => (
  <>
    <label>
      Fecha
      <input name="fecha" required type="date" value={formulario.fecha} onChange={onCambio} />
    </label>
    <label className="fleet-form-wide">
      Descripción
      <textarea
        name="descripcion"
        autoFocus
        required
        maxLength={255}
        rows={4}
        value={formulario.descripcion}
        onChange={onCambio}
      />
    </label>
    <label>
      Costo (USD)
      <input
        name="costo"
        required
        min="0"
        step="0.01"
        type="number"
        value={formulario.costo}
        onChange={onCambio}
      />
    </label>
  </>
);

interface MantenimientoModalProps {
  vehiculo: Vehiculo;
  onCerrar: () => void;
  onGuardado: () => void;
}

export const MantenimientoModal = ({
  vehiculo,
  onCerrar,
  onGuardado,
}: MantenimientoModalProps): ReactNode => {
  const [formulario, setFormulario] = useState<MantenimientoForm>(() => ({
    fecha: hoyLocal(),
    descripcion: "",
    costo: "",
  }));
  const cambiar = (event: Cambio): void => {
    setFormulario({ ...formulario, [event.target.name]: event.target.value });
  };
  const guardar = async (): Promise<void> => {
    await mantenimientosApi.crear({
      id_vehiculo: vehiculo.id_vehiculo,
      fecha: formulario.fecha,
      descripcion: formulario.descripcion.trim(),
      costo: Number(formulario.costo),
    });
    onGuardado();
  };

  return (
    <FlotaModal
      etiqueta="Nuevo registro"
      titulo="Registrar mantenimiento"
      textoGuardar="Registrar mantenimiento"
      onGuardar={guardar}
      onCerrar={onCerrar}
    >
      <p className="fleet-form-context">
        Vehículo:{" "}
        <strong>
          {vehiculo.modelo} · {vehiculo.placa}
        </strong>
      </p>
      <Campos formulario={formulario} onCambio={cambiar} />
    </FlotaModal>
  );
};
