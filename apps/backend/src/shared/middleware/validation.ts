import type { FastifyRequest, FastifyReply } from "fastify";
import type { ZodType } from "zod";

// Factory de preHandler: valida req.body contra un esquema Zod de @dunamis/contracts.
// El body queda tipado y saneado antes de llegar al controller.
export const validateBody = <T>(schema: ZodType<T>) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({
        error: "Datos inválidos",
        detalles: result.error.flatten(),
      });
    }
    req.body = result.data;
  };
};
