# ADR-0009: Supabase Storage para las evidencias

- **Estado:** Aceptado — reemplaza a [ADR-0007](0007-s3-almacenamiento-evidencias.md) (vuelve a la línea de [ADR-0001](0001-supabase-plataforma-unica.md))
- **Fecha:** 2026-09-05
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

El [ADR-0007](0007-s3-almacenamiento-evidencias.md) había movido el
almacenamiento de evidencias (contratos digitalizados, fotos del estado de los
vehículos) a Amazon S3, separado de Supabase. En la práctica, para un proyecto
académico de 16 semanas, S3 implica: abrir una cuenta AWS, crear y administrar
un bucket, y manejar un IAM user con `access key` + `secret` — un segundo
proveedor y otro juego de credenciales, para un volumen de archivos pequeño.

Supabase, que ya usamos para base de datos y autenticación, incluye
**Storage** (compatible con S3) sin costo ni infraestructura adicional.

## Decisión

Las evidencias se guardan en **Supabase Storage**, en el mismo proyecto que la
base de datos y Auth. El backend sube los archivos con la `service_role` key y
persiste la **URL pública** del archivo en la base de datos (no el binario).

## Consecuencias

**Positivas**
- Cero cuentas y credenciales extra: un solo proveedor (Supabase).
- Menos superficie de infraestructura que administrar y documentar.
- El adaptador de almacenamiento sigue siendo el único punto que conoce el
  proveedor (`apps/backend/src/shared/storage/storage.ts`).

**Negativas / costos**
- Acopla el almacenamiento a Supabase (menos portable que un S3 dedicado).
- Sujeto a las cuotas del plan free de Supabase.

## Alternativas consideradas

- **Amazon S3 (ADR-0007)** — descartada por el costo de infraestructura y de
  credenciales extra frente al beneficio para el alcance del proyecto.
