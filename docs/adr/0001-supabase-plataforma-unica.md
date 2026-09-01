# ADR-0001: Supabase como plataforma única (BD + Auth + Storage)

- **Estado:** Aceptado — la parte de **almacenamiento** fue revisada; ver [ADR-0007](0007-s3-almacenamiento-evidencias.md). La base de datos y la autenticación siguen vigentes.
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

El diseño técnico inicial combinaba tres proveedores para la capa de datos:
PostgreSQL en Supabase, un módulo de autenticación propio dentro de la API y
Amazon S3 para el almacenamiento de archivos (contratos escaneados y fotos de
vehículos).

Supabase ya provee, de forma integrada y gestionada, las tres capacidades:
base de datos PostgreSQL, autenticación (Supabase Auth, con JWT y roles) y
almacenamiento de objetos (Supabase Storage, compatible con el modelo S3).
Mantener proveedores separados para autenticación y archivos añade credenciales,
costo y superficie de mantenimiento sin beneficio para el alcance del proyecto
(un ERP pequeño, equipo de 6, proyecto académico de 4 meses).

## Decisión

Se usa **Supabase como plataforma única** para la capa de datos:

- **Base de datos:** PostgreSQL gestionado en Supabase.
- **Autenticación:** Supabase Auth. **No** se construye un módulo de auth propio.
- **Almacenamiento de archivos:** Supabase Storage. **Se descarta Amazon S3.**
  → Revisado en [ADR-0007](0007-s3-almacenamiento-evidencias.md): las evidencias
  se moverán a S3 externo. Base de datos y autenticación no cambian.

## Consecuencias

**Positivas**
- Un solo proveedor y un solo conjunto de credenciales para toda la capa de datos.
- Menos código propio: no se implementa hashing, emisión ni rotación de tokens.
- Menor costo: se elimina la cuenta y la línea de AWS S3 del presupuesto.

**Negativas / costos**
- Acoplamiento a Supabase. Mitigación: el acceso a datos y a archivos se aísla en
  la capa `repository` del backend, de modo que un cambio de proveedor no toque
  la lógica de negocio.
- El almacenamiento de objetos queda sujeto a los límites del plan de Supabase.

## Alternativas consideradas

- **PostgreSQL + Auth propio + S3 (diseño original)** — descartado por duplicar
  capacidades que Supabase ya ofrece integradas.
- **S3 solo para archivos** — descartado: Supabase Storage cubre el caso de uso
  (pocos archivos, contratos y fotos) sin sumar otro proveedor.

## Seguimiento

- Actualizar `docs/03-arquitectura/diseno-tecnico.md`: quitar S3 y el módulo de
  auth propio del diagrama y del stack.
- ~~Actualizar `docs/06-gestion-proyecto/presupuesto.md`: eliminar la fila de
  AWS S3.~~ Anulado por [ADR-0007](0007-s3-almacenamiento-evidencias.md): S3 se
  mantiene para evidencias.
