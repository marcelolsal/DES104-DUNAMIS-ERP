import { useCallback, useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import type { EstadoPago, PagoListado, SaldoAlumno } from "@dunamis/contracts";
import { etiquetadorAlumnos } from "../alumnos.js";
import { estudiantesApi } from "../api/estudiantes.js";
import { pagosApi } from "../api/pagos.js";
import { armarPago, dinero, fechaCorta, formDesdePago, formNuevo } from "../pagos.js";
import type { FormPago } from "../pagos.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import "../pagos.css";

const ESTADOS: EstadoPago[] = ["pagado", "pendiente", "vencido"];
const METODOS: FormPago["metodo"][] = ["efectivo", "tarjeta", "transferencia"];
const titulo = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// <dialog> nativo: showModal() da foco atrapado, Escape y fondo inerte; close()
// devuelve el foco al botón que lo abrió. React no pinta `autofocus` en el DOM,
// así que el primer campo se enfoca a mano.
const abrirDialogo = (dialogo: HTMLDialogElement | null) => {
  if (!dialogo || dialogo.open) return;
  dialogo.showModal();
  dialogo.querySelector("select")?.focus();
};

interface Modal {
  original?: PagoListado; // presente al editar
  form: FormPago;
}

export const PagosPage = () => {
  const [filtroEstado, setFiltroEstado] = useState<EstadoPago>();
  const [filtroAlumno, setFiltroAlumno] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [pagos, setPagos] = useState<PagoListado[]>([]);
  const [cuentas, setCuentas] = useState<SaldoAlumno[]>([]);
  const [alumnos, setAlumnos] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>(); // carga de la lista: reemplaza las tablas
  const [aviso, setAviso] = useState<string>(); // fallos que no invalidan lo mostrado
  const [avisoAlumnos, setAvisoAlumnos] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const [modal, setModal] = useState<Modal>();
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string>();
  const [saldo, setSaldo] = useState<SaldoAlumno>();
  const dialogo = useRef<HTMLDialogElement>(null);
  const nuevo = useRef<HTMLButtonElement>(null);
  // `saving` llega tarde a un segundo click del mismo tick; el ref no.
  const enviando = useRef(false);
  // Ref estable: uno inline se re-ejecuta en cada render y reabría el diálogo
  // recién cerrado antes de su evento close (el foco caía en body).
  const montarDialogo = useCallback((elemento: HTMLDialogElement | null) => {
    dialogo.current = elemento;
    abrirDialogo(elemento);
  }, []);

  useEffect(() => {
    let cancelled = false;
    estudiantesApi
      .listar()
      .then((lista) => {
        if (!cancelled)
          setAlumnos(lista.map(({ id_alumno, nombre }) => ({ id: id_alumno, nombre })));
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setAvisoAlumnos(`No se pudieron cargar los estudiantes: ${mensajeDeError(cause)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lista y cuentas por cobrar. `cancelled` descarta la respuesta de un filtro
  // que ya no es el mostrado.
  useEffect(() => {
    let cancelled = false;
    setLoading(true); // las filas previas siguen visibles mientras recarga
    Promise.all([
      pagosApi.listar({ id_alumno: filtroAlumno, estado: filtroEstado }),
      pagosApi.cuentasPorCobrar(),
    ])
      .then(([lista, porCobrar]) => {
        if (cancelled) return;
        setPagos(lista);
        setCuentas(porCobrar);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(mensajeDeError(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filtroAlumno, filtroEstado, recarga]);

  // Saldo del alumno elegido en el modal, para no enviar un abono que excede.
  const alumnoModal = modal?.form.id_alumno ?? 0;
  useEffect(() => {
    setSaldo(undefined);
    if (!alumnoModal) return;
    let cancelled = false;
    pagosApi
      .saldo(alumnoModal)
      .then((actual) => {
        if (!cancelled) setSaldo(actual);
      })
      .catch(() => {
        // Sin saldo solo falta la ayuda; el backend valida igual al guardar.
      });
    return () => {
      cancelled = true;
    };
  }, [alumnoModal]);

  const abrir = (nuevo: Modal) => {
    setModal(nuevo);
    setModalError(undefined);
    setSuccess(undefined);
    setAviso(undefined);
  };
  // Cerrar siempre por close(): dispara onClose (desmonta) y restaura el foco.
  const cerrar = () => {
    dialogo.current?.close();
  };
  const cambiar = (cambios: Partial<FormPago>) => {
    setModal((actual) => actual && { ...actual, form: { ...actual.form, ...cambios } });
  };

  const guardar = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal || enviando.current) return;
    enviando.current = true;
    setSaving(true);
    setModalError(undefined);
    try {
      const datos = armarPago(modal.form);
      if (modal.original) await pagosApi.actualizar(modal.original.id_pago, datos);
      else await pagosApi.crear(datos);
      cerrar();
      setSuccess(modal.original ? "Pago actualizado." : "Abono registrado.");
      setRecarga((n) => n + 1);
    } catch (cause) {
      // Un doble Escape cierra el <dialog> aunque onCancel lo impida: el error
      // va a la página. Se refresca por si el pago ya no existe (404).
      if (dialogo.current?.open) setModalError(mensajeDeError(cause));
      else setAviso(mensajeDeError(cause));
      setRecarga((n) => n + 1);
    } finally {
      enviando.current = false;
      setSaving(false);
    }
  };

  const eliminar = async (pago: PagoListado) => {
    if (enviando.current) return;
    if (!window.confirm(`¿Eliminar el pago de ${dinero(pago.monto)} de ${pago.alumno}?`)) return;
    setSuccess(undefined);
    setAviso(undefined);
    enviando.current = true;
    try {
      await pagosApi.eliminar(pago.id_pago);
      setSuccess("Pago eliminado.");
    } catch (cause) {
      setAviso(mensajeDeError(cause));
    } finally {
      enviando.current = false;
      setRecarga((n) => n + 1); // también tras un 404: quita la fila obsoleta
      nuevo.current?.focus(); // la fila (y su botón) puede desaparecer
    }
  };

  const etiquetaAlumno = etiquetadorAlumnos(alumnos);
  const yaDescontado =
    modal?.original?.estado === "pagado" && modal.original.id_alumno === alumnoModal;

  return (
    <section className="pagos-page">
      <div className="pagos-heading">
        <div>
          <p className="pagos-eyebrow">FINANZAS</p>
          <h1>PAGOS</h1>
        </div>
        <button
          className="pagos-primary"
          ref={nuevo}
          onClick={() => {
            abrir({ form: formNuevo(filtroAlumno) });
          }}
          type="button"
        >
          + REGISTRAR PAGO
        </button>
      </div>

      <div className="pagos-toolbar">
        <div aria-label="Filtrar por estado" className="pagos-chips" role="group">
          {[undefined, ...ESTADOS].map((estado) => (
            <button
              aria-pressed={filtroEstado === estado}
              key={estado ?? "todos"}
              onClick={() => {
                setFiltroEstado(estado);
                setAviso(undefined);
              }}
              type="button"
            >
              {(estado ?? "todos").toUpperCase()}
            </button>
          ))}
        </div>
        <label>
          ESTUDIANTE
          <select
            onChange={(event) => {
              setFiltroAlumno(Number(event.target.value));
              setAviso(undefined);
            }}
            value={filtroAlumno}
          >
            <option value={0}>Todos</option>
            {alumnos.map((alumno) => (
              <option key={alumno.id} value={alumno.id}>
                {etiquetaAlumno(alumno)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ApiMessage error={error ?? aviso ?? avisoAlumnos} success={success} />

      {!error && (
        <>
          <div className="pagos-table-wrap">
            <table className="pagos-table">
              <thead>
                <tr>
                  <th>ESTUDIANTE</th>
                  <th>CURSO</th>
                  <th>MONTO</th>
                  <th>FECHA</th>
                  <th>MÉTODO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id_pago}>
                    <td>
                      <strong>{pago.alumno}</strong>
                    </td>
                    <td>{pago.curso}</td>
                    <td>
                      <strong>{dinero(pago.monto)}</strong>
                    </td>
                    <td>{fechaCorta(pago.fecha)}</td>
                    <td>{titulo(pago.metodo)}</td>
                    <td>
                      <span className={`pagos-estado ${pago.estado}`}>
                        {pago.estado.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pagos-link"
                        onClick={() => {
                          abrir({ original: pago, form: formDesdePago(pago) });
                        }}
                        type="button"
                      >
                        EDITAR
                      </button>
                      <button
                        className="pagos-link danger"
                        onClick={() => {
                          void eliminar(pago);
                        }}
                        type="button"
                      >
                        ELIMINAR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && pagos.length === 0 && <p className="pagos-empty">Cargando pagos...</p>}
            {!loading && pagos.length === 0 && (
              <p className="pagos-empty">No hay pagos para estos filtros.</p>
            )}
          </div>

          <h2 className="pagos-subtitle">CUENTAS POR COBRAR</h2>
          <div className="pagos-table-wrap">
            <table className="pagos-table">
              <thead>
                <tr>
                  <th>ESTUDIANTE</th>
                  <th>CURSO</th>
                  <th>PRECIO</th>
                  <th>PAGADO</th>
                  <th>SALDO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map((cuenta) => (
                  <tr key={cuenta.id_alumno}>
                    <td>
                      <strong>{cuenta.alumno}</strong>
                    </td>
                    <td>{cuenta.curso}</td>
                    <td>{dinero(cuenta.precio)}</td>
                    <td>{dinero(cuenta.total_pagado)}</td>
                    <td>
                      <strong>{dinero(cuenta.saldo_pendiente)}</strong>
                    </td>
                    <td>
                      <span className={`pagos-estado ${cuenta.estado}`}>
                        {cuenta.estado.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pagos-link"
                        onClick={() => {
                          abrir({ form: formNuevo(cuenta.id_alumno) });
                        }}
                        type="button"
                      >
                        ABONAR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && cuentas.length === 0 && <p className="pagos-empty">Cargando cuentas...</p>}
            {!loading && cuentas.length === 0 && (
              <p className="pagos-empty">No hay cuentas por cobrar.</p>
            )}
          </div>
        </>
      )}

      {modal && (
        <dialog
          aria-labelledby="pagos-modal-title"
          aria-modal="true"
          className="pagos-modal"
          role="dialog"
          onCancel={(event) => {
            if (saving) event.preventDefault();
          }}
          onClose={() => {
            setModal(undefined);
          }}
          ref={montarDialogo}
        >
          <button
            aria-label="Cerrar"
            className="pagos-modal-close"
            disabled={saving}
            onClick={cerrar}
            type="button"
          >
            ×
          </button>
          <p className="pagos-eyebrow">FINANZAS</p>
          <h2 id="pagos-modal-title">{modal.original ? "EDITAR PAGO" : "REGISTRAR PAGO"}</h2>
          <ApiMessage error={modalError} />
          <form
            onSubmit={(event) => {
              void guardar(event);
            }}
          >
            <label>
              ESTUDIANTE
              <select
                required
                onChange={(event) => {
                  cambiar({ id_alumno: Number(event.target.value) });
                }}
                value={modal.form.id_alumno || ""}
              >
                <option disabled value="">
                  Selecciona un estudiante
                </option>
                {alumnos.map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {etiquetaAlumno(alumno)}
                  </option>
                ))}
              </select>
            </label>
            <p aria-live="polite" className="pagos-saldo">
              {saldo &&
                `Saldo pendiente: ${dinero(saldo.saldo_pendiente)} de ${dinero(saldo.precio)}${
                  yaDescontado ? " (ya descuenta este pago)" : ""
                }`}
            </p>
            <div className="pagos-form-grid">
              <label>
                MONTO (USD)
                <input
                  min="0.01"
                  required
                  step="0.01"
                  onChange={(event) => {
                    cambiar({ monto: event.target.value });
                  }}
                  type="number"
                  value={modal.form.monto}
                />
              </label>
              <label>
                FECHA
                <input
                  required
                  onChange={(event) => {
                    cambiar({ fecha: event.target.value });
                  }}
                  type="date"
                  value={modal.form.fecha}
                />
              </label>
              <label>
                MÉTODO
                <select
                  onChange={(event) => {
                    cambiar({ metodo: event.target.value as FormPago["metodo"] });
                  }}
                  value={modal.form.metodo}
                >
                  {METODOS.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {titulo(metodo)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                ESTADO
                <select
                  onChange={(event) => {
                    cambiar({ estado: event.target.value as FormPago["estado"] });
                  }}
                  value={modal.form.estado}
                >
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </label>
            </div>
            <div className="pagos-modal-actions">
              <button className="pagos-secondary" disabled={saving} onClick={cerrar} type="button">
                CANCELAR
              </button>
              {/* aria-disabled, no disabled: un botón deshabilitado pierde el foco y
                  close() ya no lo devuelve. El doble envío lo frena `enviando`. */}
              <button aria-disabled={saving} className="pagos-primary" type="submit">
                {saving ? "GUARDANDO..." : "GUARDAR"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
};
