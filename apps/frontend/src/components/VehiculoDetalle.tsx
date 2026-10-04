import { useEffect, useState, type ReactNode } from "react";
import type { Mantenimiento, Vehiculo } from "@dunamis/contracts";
import { mantenimientosApi } from "../api/mantenimientos.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import { MantenimientoModal } from "./MantenimientoModal.js";
import type { AccionesVehiculo } from "./VehiculosListado.js";
import { estadoTexto, kilometrajeLegible } from "./vehiculosFormato.js";

type Historial =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; items: Mantenimiento[] };

const fechaLegible = (fecha: Date): string =>
  new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(fecha))
    .replaceAll(".", "")
    .toUpperCase();

const costoLegible = (costo: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(costo);

// Más reciente primero; a igual fecha, el último registrado.
const masRecientePrimero = (a: Mantenimiento, b: Mantenimiento): number =>
  new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
  b.id_mantenimiento - a.id_mantenimiento;

// El detalle se monta con `key` por vehículo, así que el estado inicial siempre es "cargando".
const useHistorial = (idVehiculo: number): { historial: Historial; recargar: () => void } => {
  const [historial, setHistorial] = useState<Historial>({ estado: "cargando" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true; // descarta la respuesta de una petición ya reemplazada
    mantenimientosApi
      .listar(idVehiculo)
      .then((items) => {
        if (vigente) setHistorial({ estado: "listo", items: [...items].sort(masRecientePrimero) });
      })
      .catch((errorDesconocido: unknown) => {
        if (vigente) setHistorial({ estado: "error", mensaje: mensajeDeError(errorDesconocido) });
      });
    return () => {
      vigente = false;
    };
  }, [idVehiculo, version]);

  const recargar = (): void => {
    setVersion((actual) => actual + 1);
  };
  return { historial, recargar };
};

const HistorialTabla = ({ historial }: { historial: Historial }): ReactNode => {
  if (historial.estado === "error") {
    return <ApiMessage error={`No se pudo cargar el historial: ${historial.mensaje}`} />;
  }
  const items = historial.estado === "listo" ? historial.items : [];
  const vacio =
    historial.estado === "cargando"
      ? "Cargando historial..."
      : "Este vehículo todavía no tiene mantenimientos registrados.";
  return (
    <div className="fleet-table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Servicio / descripción</th>
            <th>Costo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((mantenimiento) => (
            <tr key={mantenimiento.id_mantenimiento}>
              <td>
                <strong>{fechaLegible(mantenimiento.fecha)}</strong>
              </td>
              <td className="fleet-history-description">{mantenimiento.descripcion}</td>
              <td>
                <strong>{costoLegible(mantenimiento.costo)}</strong>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="fleet-empty" colSpan={3}>
                {vacio}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Resumen = ({ vehiculo }: { vehiculo: Vehiculo }): ReactNode => (
  <div className="fleet-summary">
    <div>
      <span>Vehículo</span>
      <strong>{vehiculo.modelo}</strong>
    </div>
    <div>
      <span>Placa</span>
      <strong>{vehiculo.placa}</strong>
    </div>
    <div>
      <span>Kilometraje</span>
      <strong>{kilometrajeLegible(vehiculo.kilometraje)}</strong>
    </div>
    <div className={`fleet-status fleet-status--${vehiculo.estado}`}>
      <span aria-hidden="true">●</span> {estadoTexto[vehiculo.estado]}
    </div>
  </div>
);

interface TituloProps {
  vehiculo: Vehiculo;
  onVolver: () => void;
  onEditar: () => void;
  onEliminar: () => void;
  onRegistrar: () => void;
}

const Titulo = ({
  vehiculo,
  onVolver,
  onEditar,
  onEliminar,
  onRegistrar,
}: TituloProps): ReactNode => (
  <div className="fleet-titlebar fleet-titlebar--detail">
    <div>
      <button className="fleet-link fleet-back" type="button" onClick={onVolver}>
        ← Volver a vehículos
      </button>
      <p className="fleet-eyebrow">Detalle del vehículo</p>
      <h2 id="fleet-title">
        {vehiculo.modelo} · {vehiculo.placa}
      </h2>
    </div>
    <div className="fleet-titlebar-actions">
      <button className="fleet-secondary" type="button" onClick={onEditar}>
        Editar
      </button>
      <button
        className="fleet-secondary fleet-secondary--danger"
        type="button"
        onClick={onEliminar}
      >
        Eliminar
      </button>
      <button className="fleet-primary" type="button" onClick={onRegistrar}>
        + Registrar mantenimiento
      </button>
    </div>
  </div>
);

interface VehiculoDetalleProps extends AccionesVehiculo {
  vehiculo: Vehiculo;
  onAviso: (aviso: { success: string }) => void;
}

export const VehiculoDetalle = (props: VehiculoDetalleProps): ReactNode => {
  const { vehiculo, onSeleccionar, onEditar, onEliminar, onAviso } = props;
  const { historial, recargar } = useHistorial(vehiculo.id_vehiculo);
  const [registrando, setRegistrando] = useState(false);
  const alGuardar = (): void => {
    setRegistrando(false);
    onAviso({ success: "Mantenimiento registrado correctamente." });
    recargar();
  };

  return (
    <>
      <Titulo
        vehiculo={vehiculo}
        onVolver={() => {
          onSeleccionar(null);
        }}
        onEditar={() => {
          onEditar(vehiculo);
        }}
        onEliminar={() => {
          onEliminar(vehiculo);
        }}
        onRegistrar={() => {
          setRegistrando(true);
        }}
      />
      <Resumen vehiculo={vehiculo} />
      <div className="fleet-history">
        <h3>Historial de mantenimiento</h3>
        <HistorialTabla historial={historial} />
      </div>
      {registrando && (
        <MantenimientoModal
          vehiculo={vehiculo}
          onCerrar={() => {
            setRegistrando(false);
          }}
          onGuardado={alGuardar}
        />
      )}
    </>
  );
};
