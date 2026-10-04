import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import type { ReporteFinanciero } from "@dunamis/contracts";
import { reportesApi } from "../api/reportes.js";
import { formatoDinero, formatoFecha, rangoDelMes, validarRango, type Rango } from "../kpis.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import "../kpis.css";

type Tono = "verde" | "amarillo" | "rojo" | "neutro";

interface TarjetaProps {
  titulo: string;
  monto: number | undefined;
  tono: Tono;
  detalle?: string;
}

const Tarjeta = ({ titulo, monto, tono, detalle }: TarjetaProps): ReactNode => (
  <article className={`kpis-card kpis-card--${tono}`}>
    <h3>{titulo}</h3>
    <p className="kpis-valor">{monto === undefined ? "—" : formatoDinero(monto)}</p>
    {detalle && <p className="kpis-detalle">{detalle}</p>}
  </article>
);

// Pide el reporte cada vez que cambia el rango aplicado. Si el rango cambia antes
// de que llegue la respuesta, la anterior se descarta (`activo`).
const useReporte = (rango: Rango) => {
  const [reporte, setReporte] = useState<ReporteFinanciero>();
  const [error, setError] = useState<string>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(undefined);
    setReporte(undefined);
    reportesApi
      .financiero(rango)
      .then((datos) => {
        if (activo) setReporte(datos);
      })
      .catch((errorDesconocido: unknown) => {
        if (activo) setError(mensajeDeError(errorDesconocido));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [rango]);

  return { reporte, error, cargando };
};

const sinMovimientos = (reporte: ReporteFinanciero): boolean =>
  reporte.total_recaudado === 0 &&
  reporte.pendiente_de_cobro === 0 &&
  reporte.cobros_vencidos === 0;

// Fechas en borrador; solo un rango válido llega a `onAplicar` (y dispara la consulta).
const FiltroRango = ({
  inicial,
  onAplicar,
}: {
  inicial: Rango;
  onAplicar: (rango: Rango) => void;
}): ReactNode => {
  const [borrador, setBorrador] = useState<Rango>(inicial);
  const [errorRango, setErrorRango] = useState<string>();

  const aplicar = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const mensaje = validarRango(borrador);
    setErrorRango(mensaje ?? undefined);
    if (!mensaje) onAplicar({ ...borrador });
  };

  return (
    <>
      <form className="kpis-filtros" noValidate onSubmit={aplicar}>
        <label>
          Desde
          <input
            onChange={(e) => {
              setBorrador({ ...borrador, desde: e.target.value });
            }}
            type="date"
            value={borrador.desde}
          />
        </label>
        <label>
          Hasta
          <input
            onChange={(e) => {
              setBorrador({ ...borrador, hasta: e.target.value });
            }}
            type="date"
            value={borrador.hasta}
          />
        </label>
        <button type="submit">Aplicar</button>
      </form>
      {errorRango && (
        <p className="kpis-aviso" role="alert">
          {errorRango}
        </p>
      )}
    </>
  );
};

export const KpisPanel = (): ReactNode => {
  const [rango, setRango] = useState<Rango>(() => rangoDelMes(new Date()));
  const { reporte, error, cargando } = useReporte(rango);

  return (
    <section aria-labelledby="kpis-titulo" className="kpis-page">
      <p className="kpis-eyebrow">Finanzas</p>
      <h2 id="kpis-titulo">Indicadores</h2>
      <FiltroRango inicial={rango} onAplicar={setRango} />
      <ApiMessage error={error} />
      <p aria-live="polite" className="kpis-periodo">
        {cargando
          ? "Cargando indicadores…"
          : `Periodo: ${formatoFecha(rango.desde)} – ${formatoFecha(rango.hasta)}`}
      </p>
      <div aria-busy={cargando} className="kpis-grid">
        <Tarjeta monto={reporte?.total_recaudado} titulo="Total recaudado" tono="verde" />
        <Tarjeta monto={reporte?.pendiente_de_cobro} titulo="Pendiente de cobro" tono="amarillo" />
        <Tarjeta monto={reporte?.cobros_vencidos} titulo="Cobros vencidos" tono="rojo" />
      </div>
      {reporte && sinMovimientos(reporte) && (
        <p className="kpis-vacio" role="status">
          No hay abonos registrados en este periodo.
        </p>
      )}
      <h3 className="kpis-subtitulo">Al día de hoy</h3>
      <p className="kpis-nota">Estos indicadores no dependen del rango seleccionado.</p>
      <div aria-busy={cargando} className="kpis-grid">
        <Tarjeta
          detalle={reporte ? `Cobrado el ${formatoFecha(reporte.hoy)}` : undefined}
          monto={reporte?.ingreso_del_dia}
          titulo="Ingreso del día"
          tono="neutro"
        />
        <Tarjeta
          detalle="Cuentas por cobrar de todos los alumnos"
          monto={reporte?.saldo_por_cobrar}
          titulo="Saldo por cobrar"
          tono="neutro"
        />
      </div>
    </section>
  );
};
