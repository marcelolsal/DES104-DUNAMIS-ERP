# ADR-0007: Amazon S3 como almacenamiento externo de evidencias

- **Estado:** Aceptado — supersede la parte de **almacenamiento** de [ADR-0001](0001-supabase-plataforma-unica.md)
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

El [ADR-0001](0001-supabase-plataforma-unica.md) había resuelto usar Supabase
Storage para los archivos y descartar S3. Se revisa esa decisión: los archivos
de **evidencias** (contratos digitalizados, fotografías del estado de los
vehículos) se guardarán en un **servicio de almacenamiento de objetos externo y
dedicado**, separado de la plataforma Supabase.

> Driver a confirmar por el equipo (afecta solo a la justificación, no a la
> decisión): p. ej. cuenta AWS existente, requisito académico de trabajar con
> S3, o preferencia por aislar las evidencias en un bucket propio fuera de Supabase.

Las demás partes del ADR-0001 **siguen vigentes**: Supabase para **base de datos
(PostgreSQL)** y para **autenticación (Supabase Auth)**.

## Decisión

- **Almacenamiento de evidencias:** **Amazon S3** (bucket dedicado), como
  servicio externo. Guarda los binarios: contratos escaneados y fotos de vehículos.
- La base de datos guarda **la referencia/URL** al objeto en S3, no el binario.
- El acceso a S3 se aísla en un **adaptador de almacenamiento** dentro de la capa
  de datos del backend, de modo que la lógica de negocio no conozca al proveedor.

## Consecuencias

**Positivas**
- Evidencias en almacenamiento de objetos, fuera de la base relacional.
- Aislamiento del proveedor de archivos respecto de Supabase.

**Negativas / costos**
- Se reintroduce un proveedor adicional (AWS) con su propio set de credenciales
  y configuración (bucket, IAM, política de acceso).
- Supabase Storage habría cubierto el mismo caso sin sumar proveedor; el costo de
  esta decisión es esa duplicidad de plataforma de almacenamiento.

## Alternativas consideradas

- **Supabase Storage** (decisión original del ADR-0001) — revertida por esta
  decisión, a favor de un almacenamiento de evidencias externo dedicado.
