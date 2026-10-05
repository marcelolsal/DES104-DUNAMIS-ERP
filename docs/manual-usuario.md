# Manual de usuario — DUNAMIS ERP

Guía para la secretaría y la administración de la autoescuela. Describe las
pantallas disponibles en el sistema y aclara qué acciones todavía no se pueden
hacer desde la interfaz.

## Índice

1. [Ingreso al sistema](#1-ingreso-al-sistema)
2. [Navegación general](#2-navegación-general)
3. [Estudiantes](#3-estudiantes)
4. [Paquetes](#4-paquetes)
5. [Vehículos](#5-vehículos)
6. [Mantenimientos](#6-mantenimientos)
7. [Clases (agenda semanal)](#7-clases-agenda-semanal)
8. [Instructores](#8-instructores)
9. [Pagos](#9-pagos)
10. [Reportes y KPIs](#10-reportes-y-kpis)
11. [Página pública (landing)](#11-página-pública-landing)
12. [Mensajes y errores frecuentes](#12-mensajes-y-errores-frecuentes)

---

## 1. Ingreso al sistema

1. Abre la dirección del sistema en el navegador. Sin sesión iniciada se
   muestra la [página pública](#11-página-pública-landing).
2. Pulsa **Admin** (arriba a la derecha) o **Acceso administrativo** (al pie de
   la página). Aparece el **Panel administrativo** («Bienvenido de vuelta»).
   **← Volver al inicio** regresa a la página pública.
3. Escribe tu **correo electrónico** y tu **contraseña** (mínimo 6 caracteres).
4. Pulsa **INICIAR SESION**. Si los datos son incorrectos, el mensaje de error
   aparece debajo del formulario.

- No hay registro desde la pantalla: las cuentas las crea el administrador del
  sistema.
- La sesión queda abierta en ese navegador. Para salir, pulsa **Cerrar sesión**
  junto a tu correo, arriba a la derecha; vuelves a la página pública.

## 2. Navegación general

Una vez dentro, la barra de pestañas muestra los módulos: **Estudiantes**,
**Instructores**, **Paquetes**, **Vehiculos**, **Mantenimientos**, **Clases**,
**Pagos** y **Finanzas** (reportes y KPIs). Al entrar se abre Estudiantes.

- Los avisos de éxito (verde) o de error (rojo) aparecen arriba del contenido
  del módulo.
- Las eliminaciones siempre piden confirmación antes de ejecutarse.

## 3. Estudiantes

### Consultar

La tabla muestra, por estudiante: **nombre** y correo, **curso** (paquete),
**instructor** (el de su clase más reciente, o «Sin asignar»), **horas**
completadas con barra de progreso, **estado** y fecha de **ingreso**.

- **Buscar:** escribe en «Buscar por nombre o email...».
- **Filtrar:** elige **Todos**, **Activo** o **Graduado**.

El estado y el progreso se calculan solos: cada clase marcada como impartida
suma una hora; al completar las horas del paquete el estudiante pasa a
**Graduado**.

### Inscribir un estudiante

1. Pulsa **+ NUEVO ESTUDIANTE**.
2. Completa todos los campos: **Nombre**, **Correo**, **DUI**, **Teléfono**,
   **Contacto de emergencia**, **Curso** (paquete contratado) y **Fecha de
   ingreso** (por defecto, hoy).
3. Pulsa **GUARDAR**. Para salir sin guardar, pulsa **CANCELAR** o la **×**.

### Editar un estudiante

Pulsa **EDITAR** en su fila, cambia los datos y pulsa **GUARDAR**.

> Desde la pantalla no se eliminan estudiantes.

## 4. Paquetes

Los paquetes son los cursos que se ofrecen (horas incluidas y precio). Son los
que aparecen como «Curso» al inscribir un estudiante.

### Crear

1. En el formulario **Crear paquete**, escribe **Nombre**, **Total de horas** y
   **Precio**.
2. Pulsa **Crear paquete**.

### Editar

1. Pulsa **Editar** en la fila del paquete: el formulario se llena con sus datos.
2. Cambia lo necesario y pulsa **Guardar cambios** (o **Cancelar**).

### Eliminar

Pulsa **Eliminar** y confirma. No se puede eliminar un paquete que tenga
estudiantes asignados.

**Actualizar listado** vuelve a cargar la tabla.

## 5. Vehículos

### Consultar la flota

La tabla muestra **placa**, **vehículo** (modelo), **kilometraje** y **estado**
(Disponible, Mantenimiento o De baja).

- **Buscar:** «Buscar por placa o modelo...».
- **Filtrar:** **Todos**, **Disponibles**, **En mantenimiento** o **De baja**.

### Registrar o editar un vehículo

1. Pulsa **+ Nuevo vehículo** (o **Editar** en la fila).
2. Completa **Placa**, **Modelo**, **Kilometraje** y **Estado**. La placa se
   guarda en mayúsculas y no puede repetirse.
3. Pulsa **Registrar vehículo** / **Guardar cambios**.

La ventana se cierra con **Cancelar**, la **×**, la tecla **Esc** o un clic
fuera de ella.

> Solo los vehículos **Disponibles** pueden asignarse a clases. Cambia el estado
> a «En mantenimiento» o «De baja» para que no se ofrezcan al programar.

### Detalle e historial de mantenimiento

1. Pulsa **Ver detalle →** en la fila del vehículo.
2. Verás el resumen (modelo, placa, kilometraje, estado) y el **Historial de
   mantenimiento**, del más reciente al más antiguo.
3. Desde aquí puedes **Editar**, **Eliminar** o **+ Registrar mantenimiento**:
   indica **Fecha** (por defecto, hoy), **Descripción** (hasta 255 caracteres)
   y **Costo (USD)**, y pulsa **Registrar mantenimiento**.
4. **← Volver a vehículos** regresa al listado.

### Eliminar

Pulsa **Eliminar** (en la fila o en el detalle) y confirma. No se puede
eliminar un vehículo con clases o mantenimientos registrados; en ese caso,
márcalo como **De baja**.

## 6. Mantenimientos

Vista general de los mantenimientos de toda la flota. Aquí, además de crear,
se pueden **editar** y **eliminar** registros.

1. En **Crear mantenimiento**, elige el **Vehículo**, la **Fecha**, la
   **Descripción** y el **Costo**, y pulsa **Crear mantenimiento**.
2. Para corregir un registro, pulsa **Editar** en su fila, cambia los datos y
   pulsa **Guardar cambios** (o **Cancelar**).
3. Para borrarlo, pulsa **Eliminar** y confirma.

## 7. Clases (agenda semanal)

### Consultar la agenda

- La agenda muestra la semana de lunes a domingo, por horas (de 07:00 a 18:00;
  se amplía si hay clases fuera de ese rango).
- **HOY** vuelve a la semana actual; **‹** y **›** pasan a la semana anterior o
  siguiente.
- Cada bloque muestra horario, estudiante, instructor y placa. El color indica
  el estado: **Programada**, **Impartida** o **Cancelada** (ver la leyenda).
- **Filtros:** **Instructor**, **Vehículo**, **Estado** y **Buscar** (alumno,
  instructor o vehículo). Arriba a la derecha se ve cuántas clases cumplen los
  filtros.

### Programar una clase

1. Pulsa **+ PROGRAMAR CLASE** (propone la siguiente hora libre) o haz clic en
   una celda vacía de la agenda (usa ese día y hora).
2. Elige **Estudiante**, **Instructor** y **Vehículo**. Los vehículos en
   mantenimiento o de baja aparecen deshabilitados.
3. Ajusta **Fecha y hora** si hace falta y pulsa **GUARDAR CLASE**.

La clase queda como **Programada** y la agenda salta a su semana. La duración
de cada clase se indica en la leyenda (60 minutos por defecto).

Si el instructor o el vehículo ya tienen otra clase en esa franja, el sistema
no la guarda y muestra el aviso de **solape**: elige otra hora, otro instructor
u otro vehículo.

> Por ahora la pantalla solo permite programar clases; editar, cancelar o
> marcar una clase como impartida todavía no está disponible desde la agenda.

## 8. Instructores

### Consultar

Cada instructor aparece en una tarjeta con su **nombre**, **especialidad**,
**teléfono** y, si tiene fecha de ingreso registrada, el año de antigüedad
(«Desde 2021»). La tarjeta muestra también dos métricas:

- **Estudiantes:** alumnos distintos con al menos una clase no cancelada con ese
  instructor.
- **Horas impartidas:** clases marcadas como impartidas multiplicadas por la
  duración de la clase (60 minutos por defecto).

Mientras las métricas cargan se ve «…»; si no se pudieron obtener aparece «—» y
el aviso «No se pudieron cargar las métricas.».

### Registrar o editar un instructor

1. Pulsa **+ NUEVO INSTRUCTOR** (o **EDITAR** en su tarjeta).
2. Completa **Nombre**, **Especialidad** y **Teléfono** (obligatorios; no
   pueden quedar solo con espacios) y, si quieres, la **Fecha de ingreso
   (opcional)**.
3. Pulsa **GUARDAR**. Para salir sin guardar, pulsa **CANCELAR**, la **×** o la
   tecla **Esc**.

- La fecha de ingreso **no puede ser futura**: el calendario no deja elegir
  días posteriores a hoy y, si se envía igual, el sistema responde «La fecha de
  ingreso no puede ser futura». Para quitarla, borra el campo y guarda.

### Eliminar

Pulsa **ELIMINAR** en la tarjeta y confirma. No se puede eliminar un instructor
que tenga clases registradas (programadas, impartidas o canceladas).

## 9. Pagos

La pestaña **Pagos** reúne los abonos de los estudiantes y sus cuentas por
cobrar.

### Estados de un abono

| Estado | Significado |
|--------|-------------|
| **Pagado** | Dinero ya recibido. Descuenta del saldo del estudiante. |
| **Pendiente** | Abono acordado, aún no cobrado, con fecha de hoy en adelante. No descuenta del saldo. |
| **Vencido** | Abono pendiente cuya fecha ya pasó. |

«Vencido» no se elige ni se guarda: el sistema lo calcula solo a partir de un
abono **Pendiente** con fecha pasada (según la fecha de El Salvador). Al
registrar o editar solo se elige entre **Pagado** y **Pendiente**.

### Consultar abonos

La tabla muestra **estudiante**, **curso**, **monto**, **fecha**, **método** y
**estado** de cada abono.

- **Filtrar por estado:** botones **TODOS**, **PAGADO**, **PENDIENTE** y
  **VENCIDO**.
- **Filtrar por estudiante:** lista **ESTUDIANTE** (por defecto, «Todos»).

### Cuentas por cobrar

Debajo de los abonos, **CUENTAS POR COBRAR** lista solo a los estudiantes que
aún deben: **precio** del paquete, total **pagado**, **saldo** y estado de la
cuenta.

- **Saldo** = precio del paquete − abonos **pagados** (nunca negativo).
- La cuenta aparece **VENCIDO** si el estudiante tiene al menos un abono
  vencido; si no, **PENDIENTE**.
- **ABONAR** abre el registro de pago con ese estudiante ya elegido.

### Registrar un pago

1. Pulsa **+ REGISTRAR PAGO** (si filtraste por un estudiante, ya viene
   elegido) o **ABONAR** en su cuenta por cobrar.
2. Elige el **ESTUDIANTE**. Debajo aparece su saldo, p. ej. «Saldo pendiente:
   $150.00 de $300.00».
3. Indica **MONTO (USD)** (mayor que 0, con hasta dos decimales), **FECHA** (por
   defecto, hoy), **MÉTODO** (Efectivo, Tarjeta o Transferencia) y **ESTADO**
   (Pagado por defecto, o Pendiente).
4. Pulsa **GUARDAR**. Aparece «Abono registrado.».

- Un abono **no puede superar el saldo pendiente** del estudiante. Si lo
  supera, el sistema no lo guarda y muestra, por ejemplo, «El abono de 200.00
  excede el saldo pendiente del alumno (150.00)».

### Editar o eliminar un pago

- **EDITAR** abre el pago con sus datos. Un abono **vencido** se carga como
  **Pendiente**; para registrar que ya se cobró, cambia el estado a **Pagado**
  y guarda («Pago actualizado.»). Al editar, el saldo indica «(ya descuenta este
  pago)» si el abono ya estaba pagado. La validación del saldo solo se aplica si
  la edición aumenta lo pagado por el estudiante.
- **ELIMINAR** pide confirmación y borra el abono («Pago eliminado.»).

## 10. Reportes y KPIs

La pestaña **Finanzas** muestra el panel **Indicadores**.

### Elegir el periodo

1. Indica **Desde** y **Hasta**. Al entrar, el periodo es el mes en curso.
2. Pulsa **Aplicar**. Bajo los filtros se confirma el periodo consultado.

El rango incluye ambos días y se valida antes de consultar:

| Mensaje | Causa |
|---------|-------|
| Selecciona la fecha inicial y la final. | Falta una de las fechas o no es válida. |
| La fecha inicial no puede ser posterior a la final. | «Desde» es mayor que «Hasta». |
| El rango no puede superar 366 días. | El periodo es mayor a un año. |

### Indicadores del periodo

Suman los abonos cuya fecha cae dentro del rango:

- **Total recaudado:** abonos **pagados**.
- **Pendiente de cobro:** abonos **pendientes** con fecha de hoy en adelante.
- **Cobros vencidos:** abonos pendientes con fecha ya pasada.

Si no hay abonos en el periodo se muestra «No hay abonos registrados en este
periodo.».

### Indicadores al día de hoy

No dependen del rango elegido:

- **Ingreso del día:** abonos pagados con fecha de hoy.
- **Saldo por cobrar:** suma de las cuentas por cobrar de todos los estudiantes
  (precio del paquete − abonos pagados).

> **«Pendiente de cobro» no es lo mismo que «Saldo por cobrar».** El primero
> solo suma abonos registrados como pendientes dentro del periodo; el segundo
> es todo lo que los estudiantes aún deben de su paquete, tengan o no abonos
> pendientes registrados. Por eso el saldo por cobrar suele ser mayor.

«Hoy» es siempre la fecha de El Salvador.

## 11. Página pública (landing)

Es lo que ve cualquier visitante sin sesión. Es informativa: no tiene registro
en línea ni muestra datos de la base de datos.

- **Encabezado:** enlaces a **Cursos**, **Instructores**, **Precios**,
  **Testimonios** y **Contacto**, y los botones **Cómo inscribirme** y
  **Admin** (lleva al ingreso del sistema).
- **Portada:** «Tu camino inicia aquí.», con **Explorar cursos** y **Cómo
  inscribirme**.
- **Cursos:** clases prácticas con instructor y vehículo asignados, avance por
  horas del paquete y pago por abonos.
- **Instructores:** especialidades (Ciudad, Autopista, Nocturno, Automático y
  Mecánico).
- **Precios:** nombres de los paquetes, sin importes; el precio se confirma en
  la inscripción.
- **Testimonios:** por ahora solo indica que se publicarán más adelante.
- **Contacto:** explica que la inscripción se hace en la secretaría.
- **Pie de página:** enlace **Acceso administrativo**.

> El contenido de la landing es fijo: los cambios de paquetes o instructores en
> el sistema no se reflejan en ella.

## 12. Mensajes y errores frecuentes

| Mensaje | Qué significa / qué hacer |
|---------|---------------------------|
| No se puede eliminar un paquete asignado a alumnos | Hay estudiantes con ese paquete. Cámbiales el curso antes de eliminarlo. |
| No se puede eliminar un vehículo con clases o mantenimientos asociados | Tiene historial. Márcalo como **De baja** en lugar de eliminarlo. |
| No se puede eliminar un instructor con clases asociadas | Tiene clases registradas; no se puede borrar. |
| La fecha de ingreso no puede ser futura | Elige una fecha de ingreso de hoy o anterior, o déjala vacía. |
| El abono de X excede el saldo pendiente del alumno (Y) | Registra un monto igual o menor al saldo indicado. |
| El rango no puede superar 366 días | Acorta el periodo de Finanzas a un año como máximo. |
| Ya existe un vehículo con esa placa | La placa ya está registrada. Revisa el listado. |
| Solape: el instructor / el vehículo ya tiene una clase en esa franja | Cambia la hora, el instructor o el vehículo. |
| Mensaje con nombres de campos (p. ej. `correo: ...`) | Algún dato no tiene el formato esperado. Corrige el campo indicado. |
| Error al iniciar sesión | Correo o contraseña incorrectos, o la cuenta no existe. |
