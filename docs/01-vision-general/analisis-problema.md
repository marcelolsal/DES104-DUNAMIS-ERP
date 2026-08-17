# 2. Análisis del problema

## Problema central

La principal dificultad de la autoescuela está en **cómo se almacena y consulta
la información**. Los datos necesarios para administrar el negocio no están
concentrados en un solo lugar, sino distribuidos entre:

- Contratos físicos
- Libros de pagos
- Hojas de Excel
- Notas sueltas
- Conversaciones y grupos de WhatsApp

El propio representante de la empresa señaló que **la falta de una base de datos
en computadora es una de sus principales necesidades**.

## Dificultades identificadas

| Área | Situación actual | Consecuencia |
|------|------------------|--------------|
| **Historial del alumno** | Se localiza el contrato físico y se revisan las anotaciones. | Consulta lenta, sin visión centralizada. |
| **Clases restantes** | No existe lista centralizada; se cuentan manualmente las clases del contrato. | Cálculo manual y propenso a error. |
| **Programación de clases** | La secretaria programa a diario y coordina horarios por WhatsApp. | Información dispersa entre programaciones. |
| **Control de instructores** | Para saber cuántas clases impartió un instructor en una semana se revisan varias programaciones y contratos. | Trabajo adicional, sin datos inmediatos. |
| **Pagos** | Libro físico para abonos y saldos pendientes. | Para saber quién debe o cuánto ingresó en el día hay que revisar el libro manualmente. |

Los **pagos y reportes** fueron señalados en la entrevista como el área donde
contar con información inmediata sería de mayor utilidad.

## Conclusión del análisis

El problema no es únicamente que algunos procesos sean manuales, sino que la
**información generada está dispersa** y no existe una herramienta que permita
relacionarla y consultarla de forma centralizada. Esto dificulta el seguimiento
de alumnos, el control de pagos, la organización de clases y la administración
de recursos.

## Solución propuesta y priorización

Se plantea una solución que **centralice la información** y facilite el acceso a
los datos que hoy deben buscarse en distintos medios.

1. **Prioridad inicial** — Base de datos de alumnos (datos personales, historial
   y progreso) + módulo de gestión de pagos con reportes.
2. **Posteriormente** — Programación de clases, control de instructores y gestión
   de vehículos.

El objetivo es **resolver una problemática real**, no digitalizar procesos por
digitalizarlos: pasar de una gestión basada en documentos físicos y canales de
comunicación dispersos a una gestión ordenada y accesible.

**Anterior:** [← Introducción](introduccion.md) · **Siguiente:** [Procesos BPMN →](../02-procesos/bpmn.md)
