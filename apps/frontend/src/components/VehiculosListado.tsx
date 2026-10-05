import type { ChangeEvent, ReactNode } from "react";
import type { Vehiculo } from "@dunamis/contracts";
import { estadoTexto, kilometrajeLegible } from "./vehiculosFormato.js";

export interface FiltrosVehiculos {
  busqueda: string;
  estado: "todos" | Vehiculo["estado"];
}

export interface AccionesVehiculo {
  /** Abre el detalle del vehículo con ese id; `null` vuelve al listado. */
  onSeleccionar: (idVehiculo: number | null) => void;
  /** Abre el modal de edición; `null` para registrar un vehículo nuevo. */
  onEditar: (vehiculo: Vehiculo | null) => void;
  onEliminar: (vehiculo: Vehiculo) => void;
}

const filtrar = (vehiculos: Vehiculo[], { busqueda, estado }: FiltrosVehiculos): Vehiculo[] => {
  const texto = busqueda.trim().toLocaleLowerCase("es");
  return vehiculos.filter(
    (vehiculo) =>
      (estado === "todos" || vehiculo.estado === estado) &&
      `${vehiculo.placa} ${vehiculo.modelo}`.toLocaleLowerCase("es").includes(texto),
  );
};

interface FiltrosProps {
  filtros: FiltrosVehiculos;
  onFiltros: (filtros: FiltrosVehiculos) => void;
}

const Filtros = ({ filtros, onFiltros }: FiltrosProps): ReactNode => {
  // Cada control lleva en `name` el filtro que edita.
  const cambiar = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    onFiltros({ ...filtros, [event.target.name]: event.target.value });
  };
  return (
    <div className="fleet-filters">
      <input
        name="busqueda"
        aria-label="Buscar vehículo"
        type="search"
        placeholder="Buscar por placa o modelo..."
        value={filtros.busqueda}
        onChange={cambiar}
      />
      <select
        name="estado"
        aria-label="Filtrar por estado"
        value={filtros.estado}
        onChange={cambiar}
      >
        <option value="todos">Todos</option>
        <option value="activo">Disponibles</option>
        <option value="en_mantenimiento">En mantenimiento</option>
        <option value="baja">De baja</option>
      </select>
    </div>
  );
};

const AccionesFila = (props: AccionesVehiculo & { vehiculo: Vehiculo }): ReactNode => {
  const { vehiculo, onSeleccionar, onEditar, onEliminar } = props;
  return (
    <div className="fleet-row-actions">
      <button
        className="fleet-link"
        type="button"
        onClick={() => {
          onSeleccionar(vehiculo.id_vehiculo);
        }}
      >
        Ver detalle →
      </button>
      <button
        className="fleet-link"
        type="button"
        onClick={() => {
          onEditar(vehiculo);
        }}
      >
        Editar
      </button>
      <button
        className="fleet-link fleet-link--danger"
        type="button"
        onClick={() => {
          onEliminar(vehiculo);
        }}
      >
        Eliminar
      </button>
    </div>
  );
};

interface VehiculosListadoProps extends AccionesVehiculo, FiltrosProps {
  vehiculos: Vehiculo[];
  cargando: boolean;
  cargaFallida: boolean;
}

// Sin filas: distingue carga, flota vacía y filtros sin coincidencias. Si la carga falló no afirma nada.
const textoVacio = ({
  vehiculos,
  cargando,
  cargaFallida,
}: VehiculosListadoProps): string | undefined => {
  if (cargando) return "Cargando vehículos...";
  if (cargaFallida) return undefined;
  return vehiculos.length === 0
    ? "Todavía no hay vehículos registrados."
    : "Ningún vehículo coincide con los filtros.";
};

const Tabla = (props: VehiculosListadoProps): ReactNode => {
  const visibles = filtrar(props.vehiculos, props.filtros);
  const vacio = visibles.length === 0 ? textoVacio(props) : undefined;
  return (
    <div className="fleet-table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Vehículo</th>
            <th>Kilometraje</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((vehiculo) => (
            <tr key={vehiculo.id_vehiculo}>
              <td>
                <strong>{vehiculo.placa}</strong>
              </td>
              <td>
                <strong>{vehiculo.modelo}</strong>
              </td>
              <td>{kilometrajeLegible(vehiculo.kilometraje)}</td>
              <td>
                <span className={`fleet-badge fleet-badge--${vehiculo.estado}`}>
                  {estadoTexto[vehiculo.estado]}
                </span>
              </td>
              <td>
                <AccionesFila {...props} vehiculo={vehiculo} />
              </td>
            </tr>
          ))}
          {vacio && (
            <tr>
              <td className="fleet-empty" colSpan={5}>
                {vacio}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const VehiculosListado = (props: VehiculosListadoProps): ReactNode => (
  <>
    <div className="fleet-titlebar">
      <div>
        <p className="fleet-eyebrow">Gestión</p>
        <h2 id="fleet-title">Vehículos</h2>
      </div>
      <button
        className="fleet-primary"
        type="button"
        onClick={() => {
          props.onEditar(null);
        }}
      >
        + Nuevo vehículo
      </button>
    </div>
    <Filtros filtros={props.filtros} onFiltros={props.onFiltros} />
    <Tabla {...props} />
  </>
);
