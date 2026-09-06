CREATE TABLE "alumno" (
	"id_alumno" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(160) NOT NULL,
	"dui" varchar(20) NOT NULL,
	"correo" varchar(160) NOT NULL,
	"telefono" varchar(30) NOT NULL,
	"contacto_emergencia" varchar(160) NOT NULL,
	"fecha_inscripcion" date NOT NULL,
	"id_paquete" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clase" (
	"id_clase" serial PRIMARY KEY NOT NULL,
	"id_alumno" integer NOT NULL,
	"id_instructor" integer NOT NULL,
	"id_vehiculo" integer NOT NULL,
	"fecha_hora" timestamp NOT NULL,
	"estado" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor" (
	"id_instructor" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(160) NOT NULL,
	"especialidad" varchar(120) NOT NULL,
	"telefono" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mantenimiento" (
	"id_mantenimiento" serial PRIMARY KEY NOT NULL,
	"id_vehiculo" integer NOT NULL,
	"fecha" date NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"costo" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pago" (
	"id_pago" serial PRIMARY KEY NOT NULL,
	"id_alumno" integer NOT NULL,
	"monto" numeric(10, 2) NOT NULL,
	"fecha" date NOT NULL,
	"metodo" varchar(30) NOT NULL,
	"estado" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paquete" (
	"id_paquete" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"total_horas" integer NOT NULL,
	"precio" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehiculo" (
	"id_vehiculo" serial PRIMARY KEY NOT NULL,
	"placa" varchar(20) NOT NULL,
	"modelo" varchar(120) NOT NULL,
	"kilometraje" integer NOT NULL,
	"estado" varchar(30) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alumno" ADD CONSTRAINT "alumno_id_paquete_paquete_id_paquete_fk" FOREIGN KEY ("id_paquete") REFERENCES "public"."paquete"("id_paquete") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clase" ADD CONSTRAINT "clase_id_alumno_alumno_id_alumno_fk" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumno"("id_alumno") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clase" ADD CONSTRAINT "clase_id_instructor_instructor_id_instructor_fk" FOREIGN KEY ("id_instructor") REFERENCES "public"."instructor"("id_instructor") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clase" ADD CONSTRAINT "clase_id_vehiculo_vehiculo_id_vehiculo_fk" FOREIGN KEY ("id_vehiculo") REFERENCES "public"."vehiculo"("id_vehiculo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mantenimiento" ADD CONSTRAINT "mantenimiento_id_vehiculo_vehiculo_id_vehiculo_fk" FOREIGN KEY ("id_vehiculo") REFERENCES "public"."vehiculo"("id_vehiculo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago" ADD CONSTRAINT "pago_id_alumno_alumno_id_alumno_fk" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumno"("id_alumno") ON DELETE no action ON UPDATE no action;