# ADR-0003: TypeScript en todo el stack y Zod como fuente única de validación

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Frontend, Backend

## Contexto

Frontend y backend deben compartir un contrato de datos claro. TypeScript da
seguridad de tipos **en tiempo de compilación**, pero no valida los datos que
cruzan la frontera de la API **en tiempo de ejecución** (una respuesta de la BD,
un body de un request, un archivo subido). Ese hueco es la fuente habitual de
errores al integrar frontend y backend.

## Decisión

- **TypeScript en todo el stack.** Frontend y backend se escriben única y
  exclusivamente en TypeScript (versión estable vigente).
- **Zod como fuente única de verdad** para las estructuras de datos: cada
  entidad y cada payload de la API se define como un esquema Zod, y el tipo de
  TypeScript se **infiere** del esquema (`z.infer`). No se declaran tipos e
  interfaces por separado de los esquemas.
- Zod valida en tiempo de ejecución en las fronteras: entrada de la API,
  salida hacia el cliente y datos que vienen de la capa de datos.

## Consecuencias

**Positivas**
- Una sola definición por entidad genera **el tipo y el validador**: no se
  desincronizan.
- Los errores de datos se detectan en la frontera, no dentro de la lógica.
- Los esquemas son candidatos naturales a vivir en un paquete de contratos
  compartido entre frontend y backend (decisión de estructura de repo, pendiente).

**Negativas / costos**
- Validar en runtime tiene un costo de cómputo (despreciable para este volumen).
- El equipo debe adoptar el patrón "esquema primero, tipo inferido".

## Notas de tooling (no forman parte de la decisión)

- El compilador nativo de TypeScript escrito en Go (`tsgo` / "TypeScript 7") está
  en **preview** a la fecha de este ADR. Es un acelerador de type-check/compilación
  y **no cambia el lenguaje ni el código**. El build y el CI del proyecto usan el
  TypeScript **estable**; `tsgo` puede usarse localmente para type-check rápido.
  Al ser reversible, no requiere un ADR propio.

## Alternativas consideradas

- **Solo TypeScript (sin validación en runtime)** — descartado: no protege la
  frontera de la API.
- **Tipos manuales + validador aparte (p. ej. Joi)** — descartado: duplica la
  definición (tipo y validación por separado), que es justo lo que se quiere evitar.
