import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// Esquema Drizzle de las 7 entidades (ver docs/04-modelo-datos).
export const paquete = pgTable("paquete", {
  id_paquete: serial("id_paquete").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  total_horas: integer("total_horas").notNull(),
  precio: numeric("precio", { precision: 10, scale: 2 }).notNull(),
});

export const alumno = pgTable("alumno", {
  id_alumno: serial("id_alumno").primaryKey(),
  nombre: varchar("nombre", { length: 160 }).notNull(),
  dui: varchar("dui", { length: 20 }).notNull(),
  correo: varchar("correo", { length: 160 }).notNull(),
  telefono: varchar("telefono", { length: 30 }).notNull(),
  contacto_emergencia: varchar("contacto_emergencia", { length: 160 }).notNull(),
  fecha_inscripcion: date("fecha_inscripcion").notNull(),
  id_paquete: integer("id_paquete")
    .notNull()
    .references(() => paquete.id_paquete),
});

export const instructor = pgTable("instructor", {
  id_instructor: serial("id_instructor").primaryKey(),
  nombre: varchar("nombre", { length: 160 }).notNull(),
  especialidad: varchar("especialidad", { length: 120 }).notNull(),
  telefono: varchar("telefono", { length: 30 }).notNull(),
});

export const vehiculo = pgTable("vehiculo", {
  id_vehiculo: serial("id_vehiculo").primaryKey(),
  placa: varchar("placa", { length: 20 }).notNull(),
  modelo: varchar("modelo", { length: 120 }).notNull(),
  kilometraje: integer("kilometraje").notNull(),
  estado: varchar("estado", { length: 30 }).notNull(),
});

export const clase = pgTable("clase", {
  id_clase: serial("id_clase").primaryKey(),
  id_alumno: integer("id_alumno")
    .notNull()
    .references(() => alumno.id_alumno),
  id_instructor: integer("id_instructor")
    .notNull()
    .references(() => instructor.id_instructor),
  id_vehiculo: integer("id_vehiculo")
    .notNull()
    .references(() => vehiculo.id_vehiculo),
  fecha_hora: timestamp("fecha_hora").notNull(),
  estado: varchar("estado", { length: 30 }).notNull(),
});

export const mantenimiento = pgTable("mantenimiento", {
  id_mantenimiento: serial("id_mantenimiento").primaryKey(),
  id_vehiculo: integer("id_vehiculo")
    .notNull()
    .references(() => vehiculo.id_vehiculo),
  fecha: date("fecha").notNull(),
  descripcion: varchar("descripcion", { length: 255 }).notNull(),
  costo: numeric("costo", { precision: 10, scale: 2 }).notNull(),
});

export const pago = pgTable("pago", {
  id_pago: serial("id_pago").primaryKey(),
  id_alumno: integer("id_alumno")
    .notNull()
    .references(() => alumno.id_alumno),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  metodo: varchar("metodo", { length: 30 }).notNull(),
  estado: varchar("estado", { length: 30 }).notNull(),
});
