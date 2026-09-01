# Convenciones de código — TypeScript · React · Fastify

Reglas de estilo y diseño obligatorias para el proyecto. La mayoría son
**exigibles por ESLint** (columna _Regla_), de modo que no dependen de la buena
voluntad: el linter falla el PR. Las que no se pueden automatizar se revisan en
code review.

> Regla de oro: si una convención se puede automatizar, se automatiza. Lo que el
> linter puede atrapar, no lo atrapa una persona en la revisión.

## 1. Principios generales (aplican a todo el stack)

| # | Regla | Regla ESLint / herramienta |
|---|-------|----------------------------|
| G1 | **`const` por defecto.** `let` solo cuando hay reasignación real; nunca `var`. | `prefer-const`, `no-var` |
| G2 | **Inmutabilidad.** No mutar parámetros ni objetos recibidos; crear copias. Tipos `readonly` donde aplique. | `prefer-const`, revisión |
| G3 | **Funciones como arrow functions con nombre**, asignadas a `const`. Nada de `function` sueltas ni anónimas guardadas en variables. | `func-style: [arrow]`, `prefer-arrow-callback` |
| G4 | **Callbacks nombrados** cuando el callback tiene lógica; los triviales (`.map(x => x.id)`) pueden ir inline. | revisión |
| G5 | **Umbral de tamaño: máx. ~40 líneas por función.** Si crece, se extrae y modulariza. | `max-lines-per-function`, `complexity` |
| G6 | **Un archivo, una responsabilidad.** Máx. ~200 líneas por archivo. | `max-lines` |
| G7 | **Nombres explícitos.** Nada de `data`, `tmp`, `x` en lógica de negocio. Español consistente con el dominio (alumno, pago, clase). | revisión |
| G8 | **Sin código muerto** ni imports/vars sin usar. | `no-unused-vars`, `no-unreachable` |
| G9 | **Formateo automático** con Prettier; nadie discute comillas ni comas. | Prettier |

## 2. TypeScript — manejo estricto de datos

| # | Regla | Regla ESLint / herramienta |
|---|-------|----------------------------|
| T1 | **`strict` activo** (ya en `tsconfig.base.json`), incluido `noUncheckedIndexedAccess`. No relajar. | tsconfig |
| T2 | **Prohibido `any`.** Si el tipo es desconocido, `unknown` + estrechamiento (narrowing). | `no-explicit-any` |
| T3 | **Prohibido el `!` (non-null assertion)** salvo justificación escrita en comentario. | `no-non-null-assertion` |
| T4 | **Tipos inferidos de Zod** (`z.infer`), fuente única en `@dunamis/contracts`. No declarar `interface` paralela a un esquema. | revisión |
| T5 | **Validar en las fronteras** (entrada de API, respuesta de BD, archivos) con Zod, no dentro de la lógica. | revisión |
| T6 | **Sin casts silenciosos** (`as Foo`) para tapar errores de tipo; corregir el tipo. `as const` sí permitido. | revisión |
| T7 | **`import type`** para lo que solo se usa como tipo (ya forzado por `verbatimModuleSyntax`). | `consistent-type-imports` |
| T8 | **Retornos explícitos** en funciones exportadas / de capa pública. | `explicit-module-boundary-types` |
| T9 | Preferir **uniones discriminadas y `enum` de Zod** sobre `string` libre para estados (clase, pago, vehículo). | revisión |

## 3. React

| # | Regla | Regla ESLint / herramienta |
|---|-------|----------------------------|
| R1 | **Componentes como `const Nombre = () => {}`**, nunca `function`. `PascalCase`. | `func-style`, revisión |
| R2 | **Un componente por archivo**; el archivo se llama como el componente. | revisión |
| R3 | **Separar presentación de lógica.** Componentes presentacionales (solo props → UI); la lógica de datos vive en hooks (`useX`) o en la capa `api/`. | revisión |
| R4 | **Props tipadas** con `type Props` explícito. Nada de `props: any`. | `no-explicit-any` |
| R5 | **Handlers con lógica → función nombrada** (`const handleSubmit = () => …`); no arrow anónima gorda en el JSX. | revisión |
| R6 | **Reglas de hooks**: solo en el tope del componente, deps completas. | `react-hooks/rules-of-hooks`, `exhaustive-deps` |
| R7 | **`key` estable** en listas (nunca el índice si el orden puede cambiar). | `react/jsx-key` |
| R8 | **Estado derivado se calcula, no se duplica** en `useState`. | revisión |
| R9 | **Ningún `fetch` fuera de `src/api/`.** Los componentes llaman a la capa `api`, tipada con `@dunamis/contracts`. | revisión |
| R10 | **Sin lógica de negocio en el componente**: formatear/mostrar sí, reglas no. | revisión |

## 4. Fastify / Backend

| # | Regla | Regla ESLint / herramienta |
|---|-------|----------------------------|
| F1 | **Respetar las 4 capas**: `routes → controller → service → repository`. Cada capa llama solo a la de abajo. | revisión |
| F2 | **Solo `repository` toca la BD** (Drizzle); solo `storage/s3.ts` conoce S3. | revisión |
| F3 | **`controller` no tiene reglas de negocio**; traduce HTTP ↔ servicio. **`service` no ve `req`/`res`.** | revisión |
| F4 | **Toda entrada se valida** con un esquema Zod de `contracts` (`validateBody`) antes del controller. | revisión |
| F5 | **Handlers `async`**; errores se lanzan y los captura el error handler central, no `try/catch` repartido. | revisión |
| F6 | **Nunca lanzar strings**: `throw new Error(...)` con `statusCode` cuando aplique. | `no-throw-literal` |
| F7 | **Sin secretos hardcodeados**; todo por `config.ts` (env validado con Zod). | revisión |
| F8 | **Un módulo por dominio de negocio** (estudiantes, pagos, …), replicando la plantilla de `estudiantes`. | revisión |
| F9 | **Log estructurado** con el logger de Fastify (`app.log`), no `console.log`. | `no-console` |

## 5. Nomenclatura

| # | Regla |
|---|-------|
| N1 | **Variables y funciones:** `camelCase`. **Componentes y tipos:** `PascalCase`. **Constantes globales inmutables:** `UPPER_SNAKE_CASE`. |
| N2 | **Booleanos** con prefijo `is`/`has`/`can`/`should` (`isActivo`, `hasPagoPendiente`). |
| N3 | **Funciones = verbo** (`crearAlumno`, `calcularSaldo`); **datos = sustantivo** (`alumno`, `saldo`). |
| N4 | **Archivos:** módulo backend `dominio.capa.ts` (`estudiantes.service.ts`); componente React `PascalCase.tsx`; el resto `kebab-case.ts`. |
| N5 | **Sin abreviaturas crípticas** (`cnt`, `usr`); nombres completos del dominio en español. |
| N6 | **Nada de sufijos de tipo Hungarian** (`strNombre`, `arrAlumnos`); el tipo ya lo dice TS. |

## 6. Imports y módulos

| # | Regla |
|---|-------|
| I1 | **Orden:** primero librerías externas, luego `@dunamis/*`, luego relativos. Bloques separados por línea en blanco. |
| I2 | **Sin imports circulares.** Si dos módulos se necesitan mutuamente, falta una abstracción. |
| I3 | **Cruce de paquetes solo por el índice público** (`@dunamis/contracts`), nunca a rutas internas de otro paquete. |
| I4 | **`import type`** para lo que solo se usa como tipo (T7). |
| I5 | **Sin `export default`**; exports nombrados (mejor autocompletado y refactor). Excepción: lo que una herramienta exige por default (config). |

## 7. Asincronía y errores

| # | Regla | Regla ESLint |
|---|-------|--------------|
| A1 | **Sin promesas flotantes**: toda promesa se espera (`await`) o se maneja explícitamente. | `no-floating-promises` |
| A2 | **Sin `async` sin `await`** dentro. | `require-await` |
| A3 | **No mezclar** `.then()` con `async/await` en la misma función; elegir uno. | revisión |
| A4 | **Errores tipados** (`Error` con `statusCode`), nunca `throw "texto"`. | `only-throw-error` (F6) |
| A5 | **No tragar errores** con `catch {}` vacío; o se maneja o se relanza. | revisión |
| A6 | **`try/catch` solo donde se puede resolver**; el resto sube al error handler central (F5). | revisión |

## 8. Comentarios

| # | Regla |
|---|-------|
| C1 | **El comentario dice _por qué_, no _qué_.** Si explica el _qué_, el código no es claro: renómbralo. |
| C2 | **Sin código comentado** en el repo; para eso está git. |
| C3 | **Marcar atajos deliberados** con un comentario que nombre el techo y el upgrade path (p. ej. la deuda técnica consciente). |
| C4 | **Sin comentarios obvios ni ruido** (`// incrementa i`). |

## 9. Datos, números y dinero

| # | Regla |
|---|-------|
| D1 | **El dinero (`precio`, `monto`, `costo`) es `numeric` en la BD**; Drizzle lo devuelve como `string`. Convertir en un solo punto, nunca hacer aritmética con floats sin control. |
| D2 | **Fechas en UTC** en backend y BD; se formatea a hora local solo en presentación. |
| D3 | **IDs son `number` (serial)**; no tratarlos como string en la lógica. |
| D4 | **Enums de estado** (clase, pago, vehículo) salen de los `z.enum` de `contracts`, nunca strings sueltas (T9). |
| D5 | **No confiar en datos externos**: todo lo que entra por API o BD se valida con Zod antes de usarse (T5). |

## 10. Seguridad

| # | Regla |
|---|-------|
| S1 | **Cero secretos en el código o en git**; todo por variables de entorno validadas en `config.ts` (F7). |
| S2 | **Consultas siempre por Drizzle** (parametrizadas); jamás concatenar SQL a mano. |
| S3 | **Auth global por defecto: TODO endpoint exige JWT.** Se aplica una sola vez con `registerAuth` (hook `onRequest` en `app.ts`), no módulo por módulo. Una ruta pública es la única excepción y debe agregarse **explícitamente** a `PUBLIC_ROUTES` — exponer algo es un acto deliberado, nunca un olvido. |
| S4 | **Autorización por rol** se decide en el backend (ADR-0006), nunca se confía en el frontend. |
| S5 | **No loguear datos sensibles** (tokens, DUI completo) en `app.log`. |

## 11. Accesibilidad (React)

| # | Regla |
|---|-------|
| X1 | **HTML semántico** (`button`, `nav`, `main`, `label`); `div` clicable es un error. |
| X2 | **Todo input tiene `label` asociado.** |
| X3 | **Imágenes con `alt`**; decorativas con `alt=""`. |
| X4 | **Foco y teclado**: lo operable con mouse debe serlo con teclado. |

## 12. Git y commits

| # | Regla |
|---|-------|
| V1 | **Un commit = un cambio coherente**; no mezclar refactor con feature. |
| V2 | **Ramas por trabajo**: `feat/…`, `fix/…`, `docs/…`; no se commitea directo a `main`. |
| V3 | **Mensaje en imperativo** y descriptivo; el emoji inicial (estilo del repo) es opcional pero consistente. |
| V4 | **El PR pasa `lint`, `typecheck` y `build`** antes de pedir revisión. |
| V5 | **No commitear** `node_modules`, `dist`, ni `.env` (ya en `.gitignore`). |

## 13. Cómo se exige (tooling)

Estas reglas se materializan en un **ESLint flat config compartido en la raíz**
(`eslint.config.js`) más **Prettier** (`.prettierrc.json`). Comandos:

```bash
pnpm lint          # exige las reglas mecánicas (falla el PR si no pasan)
pnpm lint:fix      # arregla lo autofijable
pnpm format        # Prettier sobre todo el repo
pnpm typecheck     # tsc --noEmit en cada paquete
```

El preset base es `@typescript-eslint` (`strictTypeChecked` +
`stylisticTypeChecked`), `eslint-plugin-react`, `eslint-plugin-react-hooks` y
`eslint-config-prettier`. El PR que no pasa `lint`, `typecheck` y `build` no se
mergea (V4). Las reglas marcadas _revisión_ son responsabilidad del revisor.

Umbrales G5/G6/complejidad están en **`warn`** a propósito: avisan sin bloquear
un componente legítimamente largo. Súbelos a `error` cuando el equipo lo decida.
