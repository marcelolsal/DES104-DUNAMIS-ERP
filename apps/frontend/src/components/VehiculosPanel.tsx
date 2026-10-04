import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Mantenimiento, Vehiculo } from "@dunamis/contracts";
import { mantenimientosApi } from "../api/mantenimientos.js";
import { vehiculosApi } from "../api/vehiculos.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";

type EstadoFiltro = "todos" | Vehiculo["estado"];
type ModalActivo = "vehiculo" | "mantenimiento" | null;

interface VehiculoForm {
  placa: string;
  modelo: string;
  kilometraje: string;
  estado: Vehiculo["estado"];
}

interface MantenimientoForm {
  fecha: string;
  descripcion: string;
  costo: string;
}

const vehiculoVacio: VehiculoForm = {
  placa: "",
  modelo: "",
  kilometraje: "",
  estado: "activo",
};

const mantenimientoVacio: MantenimientoForm = {
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: "",
  costo: "",
};

const estados: { value: EstadoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Disponibles" },
  { value: "en_mantenimiento", label: "En mantenimiento" },
  { value: "baja", label: "De baja" },
];

const estadoTexto: Record<Vehiculo["estado"], string> = {
  activo: "Disponible",
  en_mantenimiento: "Mantenimiento",
  baja: "De baja",
};

const fechaLegible = (fecha: Date): string => new Intl.DateTimeFormat("es-SV", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(fecha)).replaceAll(".", "").toUpperCase();

const costoLegible = (costo: number): string => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(costo);

const kilometrajeLegible = (kilometraje: number): string => `${new Intl.NumberFormat("en-US").format(kilometraje)} km`;

export const VehiculosPanel = (): ReactNode => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [seleccionado, setSeleccionado] = useState<Vehiculo | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<EstadoFiltro>("todos");
  const [modal, setModal] = useState<ModalActivo>(null);
  const [vehiculoForm, setVehiculoForm] = useState<VehiculoForm>(vehiculoVacio);
  const [mantenimientoForm, setMantenimientoForm] = useState<MantenimientoForm>(mantenimientoVacio);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const cargarVehiculos = async (): Promise<void> => {
    setCargando(true);
    try {
      const lista = await vehiculosApi.listar();
      setVehiculos(lista);
      setError(undefined);
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarVehiculos();
  }, []);

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");
    return vehiculos.filter((vehiculo) => {
      const coincideEstado = filtro === "todos" || vehiculo.estado === filtro;
      const coincideTexto = texto.length === 0
        || vehiculo.placa.toLocaleLowerCase("es").includes(texto)
        || vehiculo.modelo.toLocaleLowerCase("es").includes(texto);
      return coincideEstado && coincideTexto;
    });
  }, [busqueda, filtro, vehiculos]);

  const abrirDetalle = async (vehiculo: Vehiculo): Promise<void> => {
    setSeleccionado(vehiculo);
    setMantenimientos([]);
    setError(undefined);
    setSuccess(undefined);
    try {
      setMantenimientos(await mantenimientosApi.listar(vehiculo.id_vehiculo));
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
    }
  };

  const volverAlListado = (): void => {
    setSeleccionado(null);
    setMantenimientos([]);
    setError(undefined);
    setSuccess(undefined);
  };

  const abrirNuevoVehiculo = (): void => {
    setVehiculoForm(vehiculoVacio);
    setError(undefined);
    setSuccess(undefined);
    setModal("vehiculo");
  };

  const abrirNuevoMantenimiento = (): void => {
    setMantenimientoForm({ ...mantenimientoVacio, fecha: new Date().toISOString().slice(0, 10) });
    setError(undefined);
    setSuccess(undefined);
    setModal("mantenimiento");
  };

  const cerrarModal = (): void => {
    if (!guardando) setModal(null);
  };

  const guardarVehiculo = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGuardando(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await vehiculosApi.crear({
        ...vehiculoForm,
        placa: vehiculoForm.placa.trim().toUpperCase(),
        modelo: vehiculoForm.modelo.trim(),
        kilometraje: Number(vehiculoForm.kilometraje),
      });
      setModal(null);
      setSuccess("Vehículo registrado correctamente.");
      await cargarVehiculos();
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
    } finally {
      setGuardando(false);
    }
  };

  const guardarMantenimiento = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!seleccionado) return;
    setGuardando(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await mantenimientosApi.crear({
        id_vehiculo: seleccionado.id_vehiculo,
        fecha: mantenimientoForm.fecha,
        descripcion: mantenimientoForm.descripcion.trim(),
        costo: Number(mantenimientoForm.costo),
      });
      setModal(null);
      setSuccess("Mantenimiento registrado correctamente.");
      setMantenimientos(await mantenimientosApi.listar(seleccionado.id_vehiculo));
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="fleet-page" aria-labelledby="fleet-title">
      <ApiMessage error={error} success={success} />

      {seleccionado ? (
        <>
          <div className="fleet-titlebar fleet-titlebar--detail">
            <div>
              <button className="fleet-back" type="button" onClick={volverAlListado}>← Volver a vehículos</button>
              <p className="fleet-eyebrow">Detalle del vehículo</p>
              <h2 id="fleet-title">{seleccionado.modelo} · {seleccionado.placa}</h2>
            </div>
            <button className="fleet-primary" type="button" onClick={abrirNuevoMantenimiento}>+ Registrar mantenimiento</button>
          </div>

          <div className="vehicle-summary">
            <div><span>Vehículo</span><strong>{seleccionado.modelo}</strong></div>
            <div><span>Placa</span><strong>{seleccionado.placa}</strong></div>
            <div><span>Kilometraje</span><strong>{kilometrajeLegible(seleccionado.kilometraje)}</strong></div>
            <div className={`fleet-status fleet-status--${seleccionado.estado}`}>
              <span aria-hidden="true">●</span> {estadoTexto[seleccionado.estado]}
            </div>
          </div>

          <div className="history-card">
            <h3>Historial de mantenimiento</h3>
            <div className="fleet-table-wrap">
              <table className="fleet-table">
                <thead><tr><th>Fecha</th><th>Servicio / descripción</th><th>Costo</th></tr></thead>
                <tbody>
                  {mantenimientos.map((mantenimiento) => (
                    <tr key={mantenimiento.id_mantenimiento}>
                      <td><strong>{fechaLegible(mantenimiento.fecha)}</strong></td>
                      <td className="history-description">{mantenimiento.descripcion}</td>
                      <td><strong>{costoLegible(mantenimiento.costo)}</strong></td>
                    </tr>
                  ))}
                  {mantenimientos.length === 0 && (
                    <tr><td className="fleet-empty" colSpan={3}>Este vehículo todavía no tiene mantenimientos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="fleet-titlebar">
            <div>
              <p className="fleet-eyebrow">Gestión</p>
              <h2 id="fleet-title">Vehículos</h2>
            </div>
            <button className="fleet-primary" type="button" onClick={abrirNuevoVehiculo}>+ Nuevo vehículo</button>
          </div>

          <div className="fleet-filters">
            <label className="fleet-search">
              <span className="sr-only">Buscar vehículo</span>
              <input
                type="search"
                placeholder="Buscar por placa o modelo..."
                value={busqueda}
                onChange={(event) => { setBusqueda(event.target.value); }}
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select value={filtro} onChange={(event) => { setFiltro(event.target.value as EstadoFiltro); }}>
                {estados.map((estado) => <option key={estado.value} value={estado.value}>{estado.label}</option>)}
              </select>
            </label>
          </div>

          <div className="fleet-table-wrap">
            <table className="fleet-table">
              <thead><tr><th>Placa</th><th>Vehículo</th><th>Kilometraje</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {vehiculosFiltrados.map((vehiculo) => (
                  <tr key={vehiculo.id_vehiculo}>
                    <td><strong>{vehiculo.placa}</strong></td>
                    <td><strong>{vehiculo.modelo}</strong></td>
                    <td>{kilometrajeLegible(vehiculo.kilometraje)}</td>
                    <td><span className={`fleet-badge fleet-badge--${vehiculo.estado}`}>{estadoTexto[vehiculo.estado]}</span></td>
                    <td><button className="fleet-detail" type="button" onClick={() => { void abrirDetalle(vehiculo); }}>Ver detalle →</button></td>
                  </tr>
                ))}
                {!cargando && vehiculosFiltrados.length === 0 && (
                  <tr><td className="fleet-empty" colSpan={5}>No se encontraron vehículos con esos filtros.</td></tr>
                )}
                {cargando && <tr><td className="fleet-empty" colSpan={5}>Cargando vehículos...</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <div className="fleet-modal-backdrop" role="presentation" onMouseDown={cerrarModal}>
          <div className="fleet-modal" role="dialog" aria-modal="true" aria-labelledby="fleet-modal-title" onMouseDown={(event) => { event.stopPropagation(); }}>
            <div className="fleet-modal-header">
              <div>
                <p className="fleet-eyebrow">Nuevo registro</p>
                <h3 id="fleet-modal-title">{modal === "vehiculo" ? "Registrar vehículo" : "Registrar mantenimiento"}</h3>
              </div>
              <button className="fleet-close" type="button" aria-label="Cerrar" onClick={cerrarModal}>×</button>
            </div>

            {modal === "vehiculo" ? (
              <form className="fleet-form" onSubmit={(event) => { void guardarVehiculo(event); }}>
                <label>Placa<input required maxLength={20} value={vehiculoForm.placa} onChange={(event) => { setVehiculoForm({ ...vehiculoForm, placa: event.target.value }); }} /></label>
                <label>Modelo<input required maxLength={120} value={vehiculoForm.modelo} onChange={(event) => { setVehiculoForm({ ...vehiculoForm, modelo: event.target.value }); }} /></label>
                <label>Kilometraje<input required min="0" step="1" type="number" value={vehiculoForm.kilometraje} onChange={(event) => { setVehiculoForm({ ...vehiculoForm, kilometraje: event.target.value }); }} /></label>
                <label>Estado<select value={vehiculoForm.estado} onChange={(event) => { setVehiculoForm({ ...vehiculoForm, estado: event.target.value as Vehiculo["estado"] }); }}><option value="activo">Disponible</option><option value="en_mantenimiento">En mantenimiento</option><option value="baja">De baja</option></select></label>
                <div className="fleet-form-actions"><button type="button" onClick={cerrarModal}>Cancelar</button><button className="fleet-primary" disabled={guardando} type="submit">{guardando ? "Guardando..." : "Registrar vehículo"}</button></div>
              </form>
            ) : (
              <form className="fleet-form" onSubmit={(event) => { void guardarMantenimiento(event); }}>
                <p className="fleet-form-context">Vehículo: <strong>{seleccionado?.modelo} · {seleccionado?.placa}</strong></p>
                <label>Fecha<input required type="date" value={mantenimientoForm.fecha} onChange={(event) => { setMantenimientoForm({ ...mantenimientoForm, fecha: event.target.value }); }} /></label>
                <label className="fleet-form-wide">Descripción<textarea required maxLength={255} rows={4} value={mantenimientoForm.descripcion} onChange={(event) => { setMantenimientoForm({ ...mantenimientoForm, descripcion: event.target.value }); }} /></label>
                <label>Costo (USD)<input required min="0" step="0.01" type="number" value={mantenimientoForm.costo} onChange={(event) => { setMantenimientoForm({ ...mantenimientoForm, costo: event.target.value }); }} /></label>
                <div className="fleet-form-actions"><button type="button" onClick={cerrarModal}>Cancelar</button><button className="fleet-primary" disabled={guardando} type="submit">{guardando ? "Guardando..." : "Registrar mantenimiento"}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
