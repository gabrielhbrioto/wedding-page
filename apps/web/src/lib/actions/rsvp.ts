"use server";

import { createClient } from "@/lib/supabase/server";
import { RSVPFormData } from "@/lib/validations/rsvp";

export async function submitRSVP(data: RSVPFormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rsvp")
    .insert({
      nome: data.nome,
      comparecera: data.comparecera,
      acompanhantes: data.acompanhantes,
      restricao: data.restricao || null,
    });

  if (error) {
    throw new Error("Erro ao salvar RSVP.");
  }

  return { success: true };
}