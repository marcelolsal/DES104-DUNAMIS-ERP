# Documentación — Sistema ERP Autoescuela Dunamis

ERP para la gestión de una autoescuela: centraliza alumnos, pagos, clases,
instructores y vehículos en un único sistema, reemplazando los contratos
físicos, libros de pagos y grupos de WhatsApp que se usan hoy.

> Esta documentación es la migración a formato Markdown del documento original
> `ERP_Autoescuela Dunamis.pdf`. A partir de aquí, la fuente de verdad es este
> directorio `docs/`, versionado junto con el código.

## Índice

| # | Sección | Contenido |
|---|---------|-----------|
| 01 | [Visión general](01-vision-general/) | [Introducción](01-vision-general/introduccion.md) · [Análisis del problema](01-vision-general/analisis-problema.md) |
| 02 | [Procesos (BPMN)](02-procesos/bpmn.md) | Proceso actual (AS-IS) y proceso propuesto (TO-BE) |
| 03 | [Arquitectura](03-arquitectura/diseno-tecnico.md) | Arquitectura cliente-servidor de 3 capas y stack tecnológico |
| 04 | [Modelo de datos](04-modelo-datos/modelo-datos.md) | Diagrama E-R y diccionario de datos (7 entidades) |
| 05 | [Diseño UI](05-diseno-ui/mockups.md) | Mockups de las pantallas principales |
| 06 | [Gestión del proyecto](06-gestion-proyecto/) | [Cronograma y roles](06-gestion-proyecto/cronograma.md) · [Presupuesto](06-gestion-proyecto/presupuesto.md) |
| 07 | [Anexos](07-anexos/) | [Declaración de uso de IA](07-anexos/declaracion-ia.md) · [Referencias](07-anexos/referencias.md) |
| 08 | [Convenciones de código](convenciones-codigo.md) | Estilo y diseño obligatorio para TypeScript, React y Fastify |
| — | [Decisiones de arquitectura (ADR)](adr/) | Registro de decisiones técnicas |

## Equipo

| Integrante | Rol |
|------------|-----|
| Kevin Argueta | Product Owner / Documentación |
| Marcelo Leiva | Arquitecto de Software / Tech Lead |
| Erick Chinchilla | Desarrollador Frontend / UI-UX |
| Karla Flores | Desarrollador Frontend / UI-UX |
| Edwin Portillo | Desarrollador Backend / BD y DevOps |
| Edmilson Martínez | Desarrollador Backend / BD y DevOps |

> Los nombres del equipo se listan en el documento original; la asignación
> nominal de roles es una propuesta basada en los seis roles definidos en el
> [cronograma](06-gestion-proyecto/cronograma.md) — ajústenla según acuerden.

**Institución:** Universidad Don Bosco — Facultad de Ingeniería · Desarrollo de Software Empresarial
**Repositorio:** https://github.com/marcelolsal/DES104-DUNAMIS-ERP
