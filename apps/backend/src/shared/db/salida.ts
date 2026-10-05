import type { ZodType } from "zod";

// Valida lo que sale de la BD contra el contrato. Si no cumple es un fallo del
// servidor (500 genérico), no del cliente: el ZodError solo da 400 en la entrada.
export const parseSalida = <T>(schema: ZodType<T>, datos: unknown): T => {
  const resultado = schema.safeParse(datos);
  if (!resultado.success) {
    throw new Error("La salida no cumple el contrato", { cause: resultado.error });
  }
  return resultado.data;
};
