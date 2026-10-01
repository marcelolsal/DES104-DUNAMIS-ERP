import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Vehiculo } from "@dunamis/contracts";
import { vehiculosApi } from "../api/vehiculos.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";

interface VehiculoForm { placa: string; modelo: string; kilometraje: string; estado: Vehiculo["estado"] }
const formularioVacio: VehiculoForm = { placa: "", modelo: "", kilometraje: "", estado: "activo" };
const estados: Vehiculo["estado"][] = ["activo", "en_mantenimiento", "baja"];

export const VehiculosPanel = (): ReactNode => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [formulario, setFormulario] = useState<VehiculoForm>(formularioVacio);
  const [edicion, setEdicion] = useState<Vehiculo | null>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const cargar = async () => { try { setVehiculos(await vehiculosApi.listar()); setError(undefined); } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); } };
  useEffect(() => { void cargar(); }, []);
  const cancelar = () => { setEdicion(null); setFormulario(formularioVacio); };
  const prepararEdicion = (vehiculo: Vehiculo) => { setEdicion(vehiculo); setFormulario({ placa: vehiculo.placa, modelo: vehiculo.modelo, kilometraje: String(vehiculo.kilometraje), estado: vehiculo.estado }); setError(undefined); setSuccess(undefined); };
  const guardar = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); setError(undefined); setSuccess(undefined);
    const datos = { ...formulario, kilometraje: Number(formulario.kilometraje) };
    try { if (edicion) await vehiculosApi.actualizar(edicion.id_vehiculo, datos); else await vehiculosApi.crear(datos); setSuccess(edicion ? "Vehículo actualizado correctamente." : "Vehículo creado correctamente."); cancelar(); await cargar(); } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };
  const eliminar = async (vehiculo: Vehiculo) => {
    if (!window.confirm(`¿Eliminar el vehículo ${vehiculo.placa}?`)) return;
    setError(undefined); setSuccess(undefined);
    try { await vehiculosApi.eliminar(vehiculo.id_vehiculo); setSuccess("Vehículo eliminado correctamente."); await cargar(); } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };
  return <section className="module-panel">
    <div className="module-heading"><div><h2>Vehículos</h2><p>Administra la flota de vehículos.</p></div><button type="button" onClick={() => { void cargar(); }}>Actualizar listado</button></div>
    <ApiMessage error={error} success={success} />
    <form className="record-form" onSubmit={(event) => { void guardar(event); }}><h3>{edicion ? `Editar vehículo #${String(edicion.id_vehiculo)}` : "Crear vehículo"}</h3>
      <label>Placa<input required value={formulario.placa} onChange={(event) => { setFormulario({ ...formulario, placa: event.target.value }); }} /></label><label>Modelo<input required value={formulario.modelo} onChange={(event) => { setFormulario({ ...formulario, modelo: event.target.value }); }} /></label><label>Kilometraje<input required type="number" step="1" value={formulario.kilometraje} onChange={(event) => { setFormulario({ ...formulario, kilometraje: event.target.value }); }} /></label><label>Estado<select value={formulario.estado} onChange={(event) => { setFormulario({ ...formulario, estado: event.target.value as Vehiculo["estado"] }); }}>{estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select></label>
      <div className="form-actions"><button className="primary" type="submit">{edicion ? "Guardar cambios" : "Crear vehículo"}</button>{edicion && <button type="button" onClick={cancelar}>Cancelar</button>}</div>
    </form>
    <div className="table-wrap"><table><thead><tr><th>ID</th><th>Placa</th><th>Modelo</th><th>Kilometraje</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{vehiculos.map((vehiculo) => <tr key={vehiculo.id_vehiculo}><td>{vehiculo.id_vehiculo}</td><td>{vehiculo.placa}</td><td>{vehiculo.modelo}</td><td>{vehiculo.kilometraje}</td><td>{vehiculo.estado}</td><td className="actions"><button type="button" onClick={() => { prepararEdicion(vehiculo); }}>Editar</button><button className="danger" type="button" onClick={() => { void eliminar(vehiculo); }}>Eliminar</button></td></tr>)}{!vehiculos.length && <tr><td colSpan={6}>No hay vehículos para mostrar.</td></tr>}</tbody></table></div>
  </section>;
};
