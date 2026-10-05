import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Vehiculo } from "@dunamis/contracts";
import { vehiculosApi } from "../api/vehiculos.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import { VehiculoDetalle } from "./VehiculoDetalle.js";
import { VehiculoModal } from "./VehiculoModal.js";
import { VehiculosListado, type FiltrosVehiculos } from "./VehiculosListado.js";
import "../vehiculos.css";

interface Aviso {
  error?: string;
  success?: string;
}

// Flota cargada + sus errores de carga (aparte del aviso de la última acción).
const useVehiculos = () => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string>();
  const [aviso, setAviso] = useState<Aviso>({});

  const cargar = useCallback(async (): Promise<void> => {
    setCargando(true);
    try {
      setVehiculos(await vehiculosApi.listar());
      setErrorCarga(undefined);
    } catch (errorDesconocido) {
      setErrorCarga(mensajeDeError(errorDesconocido));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const eliminar = (vehiculo: Vehiculo): void => {
    if (!window.confirm(`¿Eliminar el vehículo ${vehiculo.placa}?`)) return;
    setAviso({});
    vehiculosApi
      .eliminar(vehiculo.id_vehiculo)
      .then(() => {
        setVehiculos((actuales) =>
          actuales.filter((otro) => otro.id_vehiculo !== vehiculo.id_vehiculo),
        );
        setAviso({ success: "Vehículo eliminado correctamente." });
      })
      .catch((errorDesconocido: unknown) => {
        setAviso({ error: mensajeDeError(errorDesconocido) });
      });
  };

  return { vehiculos, cargando, errorCarga, aviso, setAviso, cargar, eliminar };
};

export const VehiculosPanel = (): ReactNode => {
  const { vehiculos, cargando, errorCarga, aviso, setAviso, cargar, eliminar } = useVehiculos();
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<FiltrosVehiculos>({ busqueda: "", estado: "todos" });
  // `undefined`: modal cerrado; `null`: alta; un vehículo: edición.
  const [enModal, setEnModal] = useState<Vehiculo | null>();
  // Se deriva del listado: editar actualiza el detalle y eliminar lo cierra.
  const seleccionado = vehiculos.find((vehiculo) => vehiculo.id_vehiculo === idSeleccionado);

  const seleccionar = (idVehiculo: number | null): void => {
    setIdSeleccionado(idVehiculo);
    setAviso({});
  };
  const cerrarModal = (): void => {
    setEnModal(undefined);
  };
  const alGuardar = (mensaje: string): void => {
    setEnModal(undefined);
    setAviso({ success: mensaje });
    void cargar();
  };
  const acciones = { onSeleccionar: seleccionar, onEditar: setEnModal, onEliminar: eliminar };

  return (
    <section className="fleet-page" aria-labelledby="fleet-title">
      <ApiMessage error={errorCarga} />
      <ApiMessage error={aviso.error} success={aviso.success} />
      {seleccionado ? (
        <VehiculoDetalle
          key={seleccionado.id_vehiculo}
          vehiculo={seleccionado}
          onAviso={setAviso}
          {...acciones}
        />
      ) : (
        <VehiculosListado
          vehiculos={vehiculos}
          cargando={cargando}
          cargaFallida={errorCarga !== undefined}
          filtros={filtros}
          onFiltros={setFiltros}
          {...acciones}
        />
      )}
      {enModal !== undefined && (
        <VehiculoModal vehiculo={enModal} onCerrar={cerrarModal} onGuardado={alGuardar} />
      )}
    </section>
  );
};
