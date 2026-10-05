-- Normaliza el valor histórico del seed al valor del contrato.
UPDATE "vehiculo" SET "estado" = 'en_mantenimiento' WHERE "estado" = 'en mantenimiento';--> statement-breakpoint
ALTER TABLE "vehiculo" ADD CONSTRAINT "vehiculo_placa_unique" UNIQUE("placa");