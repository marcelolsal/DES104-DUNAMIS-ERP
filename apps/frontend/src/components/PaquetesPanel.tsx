import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Paquete } from "@dunamis/contracts";
import { paquetesApi } from "../api/paquetes.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";

interface PaqueteForm { nombre: string; total_horas: string; precio: string }
const formularioVacio: PaqueteForm = { nombre: "", total_horas: "", precio: "" };

export const PaquetesPanel = (): ReactNode => {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [formulario, setFormulario] = useState<PaqueteForm>(formularioVacio);
  const [edicion, setEdicion] = useState<Paquete | null>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const cargar = async () => {
    try {
      setPaquetes(await paquetesApi.listar());
      setError(undefined);
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
    }
  };

  useEffect(() => { void cargar(); }, []);

  const prepararEdicion = (paquete: Paquete) => {
    setEdicion(paquete);
    setFormulario({ nombre: paquete.nombre, total_horas: String(paquete.total_horas), precio: String(paquete.precio) });
    setError(undefined);
    setSuccess(undefined);
  };

  const cancelar = () => { setEdicion(null); setFormulario(formularioVacio); };

  const guardar = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    const datos = { nombre: formulario.nombre, total_horas: Number(formulario.total_horas), precio: Number(formulario.precio) };
    try {
      if (edicion) await paquetesApi.actualizar(edicion.id_paquete, datos);
      else await paquetesApi.crear(datos);
      setSuccess(edicion ? "Paquete actualizado correctamente." : "Paquete creado correctamente.");
      cancelar();
      await cargar();
    } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };

  const eliminar = async (paquete: Paquete) => {
    if (!window.confirm(`¿Eliminar el paquete “${paquete.nombre}”?`)) return;
    setError(undefined); setSuccess(undefined);
    try {
      await paquetesApi.eliminar(paquete.id_paquete);
      setSuccess("Paquete eliminado correctamente.");
      await cargar();
    } catch (errorDesconocido) { setError(mensajeDeError(errorDesconocido)); }
  };

  return <section className="module-panel">
    <div className="module-heading"><div><h2>Paquetes</h2><p>Administra los paquetes de clases.</p></div><button type="button" onClick={() => { void cargar(); }}>Actualizar listado</button></div>
    <ApiMessage error={error} success={success} />
    <form className="record-form" onSubmit={(event) => { void guardar(event); }}>
      <h3>{edicion ? `Editar paquete #${String(edicion.id_paquete)}` : "Crear paquete"}</h3>
      <label>Nombre<input required value={formulario.nombre} onChange={(event) => { setFormulario({ ...formulario, nombre: event.target.value }); }} /></label>
      <label>Total de horas<input required type="number" step="1" value={formulario.total_horas} onChange={(event) => { setFormulario({ ...formulario, total_horas: event.target.value }); }} /></label>
      <label>Precio<input required type="number" step="0.01" value={formulario.precio} onChange={(event) => { setFormulario({ ...formulario, precio: event.target.value }); }} /></label>
      <div className="form-actions"><button className="primary" type="submit">{edicion ? "Guardar cambios" : "Crear paquete"}</button>{edicion && <button type="button" onClick={cancelar}>Cancelar</button>}</div>
    </form>
    <div className="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Horas</th><th>Precio</th><th>Acciones</th></tr></thead><tbody>
      {paquetes.map((paquete) => <tr key={paquete.id_paquete}><td>{paquete.id_paquete}</td><td>{paquete.nombre}</td><td>{paquete.total_horas}</td><td>{paquete.precio}</td><td className="actions"><button type="button" onClick={() => { prepararEdicion(paquete); }}>Editar</button><button className="danger" type="button" onClick={() => { void eliminar(paquete); }}>Eliminar</button></td></tr>)}
      {!paquetes.length && <tr><td colSpan={5}>No hay paquetes para mostrar.</td></tr>}
    </tbody></table></div>
  </section>;
};
