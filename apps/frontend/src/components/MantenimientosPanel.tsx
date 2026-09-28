import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Mantenimiento, Vehiculo } from "@dunamis/contracts";
import { mantenimientosApi } from "../api/mantenimientos.js";
import { vehiculosApi } from "../api/vehiculos.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";

interface MantenimientoForm { id_vehiculo: string; fecha: string; descripcion: string; costo: string }
const formularioVacio: MantenimientoForm = { id_vehiculo: "", fecha: "", descripcion: "", costo: "" };

const fechaParaInput = (fecha: Date): string => new Date(fecha).toISOString().slice(0, 10);

export const MantenimientosPanel = (): ReactNode => {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [formulario, setFormulario] = useState<MantenimientoForm>(formularioVacio);
  const [edicion, setEdicion] = useState<Mantenimiento | null>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const cargar = async () => {
    try {
      const [listaMantenimientos, listaVehiculos] = await Promise.all([mantenimientosApi.listar(), vehiculosApi.listar()]);
      setMantenimientos(listaMantenimientos); setVehiculos(listaVehiculos); setError(undefined);
    } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };

  useEffect(() => { void cargar(); }, []);
  const cancelar = () => { setEdicion(null); setFormulario(formularioVacio); };
  const prepararEdicion = (mantenimiento: Mantenimiento) => {
    setEdicion(mantenimiento);
    setFormulario({ id_vehiculo: String(mantenimiento.id_vehiculo), fecha: fechaParaInput(mantenimiento.fecha), descripcion: mantenimiento.descripcion, costo: String(mantenimiento.costo) });
    setError(undefined); setSuccess(undefined);
  };
  const guardar = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); setError(undefined); setSuccess(undefined);
    const datos = { id_vehiculo: Number(formulario.id_vehiculo), fecha: new Date(`${formulario.fecha}T00:00:00`), descripcion: formulario.descripcion, costo: Number(formulario.costo) };
    try {
      if (edicion) await mantenimientosApi.actualizar(edicion.id_mantenimiento, datos);
      else await mantenimientosApi.crear(datos);
      setSuccess(edicion ? "Mantenimiento actualizado correctamente." : "Mantenimiento creado correctamente.");
      cancelar(); await cargar();
    } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };
  const eliminar = async (mantenimiento: Mantenimiento) => {
    if (!window.confirm(`¿Eliminar el mantenimiento #${String(mantenimiento.id_mantenimiento)}?`)) return;
    setError(undefined); setSuccess(undefined);
    try { await mantenimientosApi.eliminar(mantenimiento.id_mantenimiento); setSuccess("Mantenimiento eliminado correctamente."); await cargar(); } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };
  const nombreVehiculo = (id: number) => {
    const vehiculo = vehiculos.find((item) => item.id_vehiculo === id);
    return vehiculo ? `${String(vehiculo.id_vehiculo)} - ${vehiculo.placa} - ${vehiculo.modelo}` : `Vehículo #${String(id)}`;
  };
  return <section className="module-panel">
    <div className="module-heading"><div><h2>Mantenimientos</h2><p>Registra el mantenimiento de cada vehículo.</p></div><button type="button" onClick={() => { void cargar(); }}>Actualizar listado</button></div>
    <ApiMessage error={error} success={success} />
    <form className="record-form" onSubmit={(event) => { void guardar(event); }}><h3>{edicion ? `Editar mantenimiento #${String(edicion.id_mantenimiento)}` : "Crear mantenimiento"}</h3>
      <label>Vehículo<select required value={formulario.id_vehiculo} onChange={(event) => { setFormulario({ ...formulario, id_vehiculo: event.target.value }); }}><option value="">Selecciona un vehículo</option>{vehiculos.map((vehiculo) => <option key={vehiculo.id_vehiculo} value={vehiculo.id_vehiculo}>{vehiculo.id_vehiculo} - {vehiculo.placa} - {vehiculo.modelo}</option>)}</select></label>
      <label>Fecha<input required type="date" value={formulario.fecha} onChange={(event) => { setFormulario({ ...formulario, fecha: event.target.value }); }} /></label><label>Descripción<input required value={formulario.descripcion} onChange={(event) => { setFormulario({ ...formulario, descripcion: event.target.value }); }} /></label><label>Costo<input required type="number" step="0.01" value={formulario.costo} onChange={(event) => { setFormulario({ ...formulario, costo: event.target.value }); }} /></label>
      <div className="form-actions"><button className="primary" type="submit">{edicion ? "Guardar cambios" : "Crear mantenimiento"}</button>{edicion && <button type="button" onClick={cancelar}>Cancelar</button>}</div>
    </form>
    <div className="table-wrap"><table><thead><tr><th>ID</th><th>Vehículo</th><th>Fecha</th><th>Descripción</th><th>Costo</th><th>Acciones</th></tr></thead><tbody>{mantenimientos.map((mantenimiento) => <tr key={mantenimiento.id_mantenimiento}><td>{mantenimiento.id_mantenimiento}</td><td>{nombreVehiculo(mantenimiento.id_vehiculo)}</td><td>{fechaParaInput(mantenimiento.fecha)}</td><td>{mantenimiento.descripcion}</td><td>{mantenimiento.costo}</td><td className="actions"><button type="button" onClick={() => { prepararEdicion(mantenimiento); }}>Editar</button><button className="danger" type="button" onClick={() => { void eliminar(mantenimiento); }}>Eliminar</button></td></tr>)}{!mantenimientos.length && <tr><td colSpan={6}>No hay mantenimientos para mostrar.</td></tr>}</tbody></table></div>
  </section>;
};
