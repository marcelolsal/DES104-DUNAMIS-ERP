# Manual de usuario — DUNAMIS ERP

Guía para la secretaría y la administración de la autoescuela. Describe las
pantallas que ya están disponibles en el sistema. Las secciones marcadas como
pendientes se completan cuando su módulo esté integrado.

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

1. Abre la dirección del sistema en el navegador. Aparece el **Panel
   administrativo** («Bienvenido de vuelta»).
2. Escribe tu **correo electrónico** y tu **contraseña** (mínimo 6 caracteres).
3. Pulsa **INICIAR SESION**. Si los datos son incorrectos, el mensaje de error
   aparece debajo del formulario.

- No hay registro desde la pantalla: las cuentas las crea el administrador del
  sistema.
- La sesión queda abierta en ese navegador. Para salir, pulsa **Cerrar sesión**
  junto a tu correo, arriba a la derecha.

## 2. Navegación general

Una vez dentro, la barra de pestañas muestra los módulos: **Estudiantes**,
**Paquetes**, **Vehiculos**, **Mantenimientos** y **Clases**. Al entrar se abre
Estudiantes.

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

> Pendiente: se completa cuando el módulo esté integrado.

## 9. Pagos

> Pendiente: se completa cuando el módulo esté integrado.

## 10. Reportes y KPIs

> Pendiente: se completa cuando el módulo esté integrado.

## 11. Página pública (landing)

> Pendiente: se completa cuando el módulo esté integrado.

## 12. Mensajes y errores frecuentes

| Mensaje | Qué significa / qué hacer |
|---------|---------------------------|
| No se puede eliminar un paquete asignado a alumnos | Hay estudiantes con ese paquete. Cámbiales el curso antes de eliminarlo. |
| No se puede eliminar un vehículo con clases o mantenimientos asociados | Tiene historial. Márcalo como **De baja** en lugar de eliminarlo. |
| Ya existe un vehículo con esa placa | La placa ya está registrada. Revisa el listado. |
| Solape: el instructor / el vehículo ya tiene una clase en esa franja | Cambia la hora, el instructor o el vehículo. |
| Mensaje con nombres de campos (p. ej. `correo: ...`) | Algún dato no tiene el formato esperado. Corrige el campo indicado. |
| Error al iniciar sesión | Correo o contraseña incorrectos, o la cuenta no existe. |
