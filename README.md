# DUNAMIS ERP — Sistema ERP para Autoescuela

Sistema ERP para la gestión de una autoescuela. Centraliza en un solo lugar la
información de alumnos, pagos, clases, instructores y vehículos, reemplazando los
contratos físicos, libros de pagos y grupos de WhatsApp que se usan actualmente.

## Objetivo

Pasar de una gestión basada en documentos físicos y canales de comunicación
dispersos a una plataforma web donde la información esté ordenada, relacionada y
disponible de forma inmediata. La prioridad inicial es la base de datos de
alumnos (datos, historial y progreso) y el control de pagos con reportes.

## Alcance (módulos)

- **Estudiantes** — inscripción, historial y progreso de clases.
- **Pagos** — abonos, cuentas por cobrar y reportes financieros.
- **Clases** — programación y asignación de instructor y vehículo.
- **Instructores** — datos, especialidad y carga de clases.
- **Vehículos** — estado, kilometraje y mantenimiento.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React (desplegado en Vercel) |
| Backend / API | Node.js + Express — API REST (desplegado en Render) |
| Base de datos | PostgreSQL (Supabase) |
| Almacenamiento de archivos | Amazon S3 |

Arquitectura cliente-servidor de tres capas. Más detalle en
[`docs/03-arquitectura/`](docs/03-arquitectura/diseno-tecnico.md).

## Documentación

La documentación completa del proyecto (análisis, procesos BPMN, arquitectura,
modelo de datos, mockups, cronograma y presupuesto) está en
[`docs/`](docs/README.md).

## Equipo

Universidad Don Bosco — Facultad de Ingeniería · Desarrollo de Software Empresarial (DES104).

Kevin Argueta · Marcelo Leiva · Erick Chinchilla · Karla Flores · Edwin Portillo · Edmilson Martínez
