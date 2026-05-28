import { z } from "zod";

export const rsvpSchema = z.object({
  nome: z
    .string()
    .min(3, "Informe seu nome completo"),

  comparecera: z.boolean(),

  acompanhantes: z
    .number()
    .min(0)
    .max(5),

  restricao: z.string().optional(),
});

export type RSVPFormData = z.infer<typeof rsvpSchema>;