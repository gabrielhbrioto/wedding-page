import Link from "next/link";
import Countdown from "@/components/sections/Countdown";

interface EventData {
  id: string;
  nome_casal: string;
  data_evento: string;
  local_nome: string | null;
  endereco: string | null;
  google_maps_url: string | null;
  gift_list_url: string | null;
  mensagem_home: string | null;
  ativo: boolean | null;
}

async function getEventData(): Promise<EventData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/v1/public/event`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Falha ao buscar dados do evento:", response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.warn("Erro ao buscar dados do evento:", error);
    return null;
  }
}

function formatDate(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    date: formatter.format(date),
    time: timeFormatter.format(date),
  };
}

export default async function Home() {
  const eventData = await getEventData();

  // Fallback para dados padrão se não conseguir buscar (desenvolvimento)
  const couple = eventData?.nome_casal || "Gabriel & Débora";
  const eventDateString =
    eventData?.data_evento || "2027-04-10T16:00:00-03:00";
  const { date: formattedDate, time: formattedTime } =
    formatDate(eventDateString);
  const venue = eventData?.local_nome || "Igreja Presbiteriana Filadélfia";
  const address = eventData?.endereco || "São Carlos - SP";
  const mapsUrl = eventData?.google_maps_url || "https://maps.app.goo.gl/zyrhFoF9bE7UcrwXA";
  const giftListUrl = eventData?.gift_list_url || null;

  return (
    <main className="overflow-hidden">
      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50 to-[#f8f5f0]" />

        <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-amber-100 blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-100 blur-3xl opacity-40" />

        <div className="relative z-10 max-w-4xl">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-zinc-500">
            Save the Date
          </p>

          <h1 className="mb-6 text-6xl leading-tight md:text-8xl">
            {couple.split(" & ")[0]} <span className="gold">&</span>{" "}
            {couple.split(" & ")[1] || ""}
          </h1>

          <p className="mb-3 text-xl text-zinc-700 md:text-2xl">
            Celebrando o amor e o início de uma nova jornada
          </p>

          <p className="mb-10 text-zinc-500">
            {formattedDate} • {address.split(/,\s*/)[0]}
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/rsvp"
              className="rounded-full bg-zinc-900 px-8 py-4 text-white transition hover:scale-105"
            >
              Confirmar Presença
            </Link>

            {giftListUrl ? (
              <a
                href={giftListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-900 px-8 py-4 transition hover:bg-zinc-900 hover:text-white"
              >
                Lista de Presentes
              </a>
            ) : null}

            <a
              href="#evento"
              className="rounded-full border border-zinc-300 px-8 py-4 transition hover:bg-white"
            >
              Ver Detalhes
            </a>
          </div>
        </div>
      </section>

      {/* CONTAGEM */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
          Falta pouco
        </p>

        <h2 className="mb-12 text-5xl">
          Contagem Regressiva
        </h2>

        <Countdown dataEvento={eventDateString} />
      </section>

      {/* HISTÓRIA */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
            Nossa História
          </p>

          <h2 className="mb-10 text-5xl">
            Um encontro que virou destino
          </h2>

          <p className="text-lg leading-9 text-zinc-600">
            Entre encontros inesperados, conversas infinitas
            e sonhos compartilhados, construímos uma linda
            história. Agora queremos celebrar esse capítulo
            ao lado de quem faz parte da nossa vida.
          </p>
        </div>
      </section>

      {/* EVENTO */}
      <section
        id="evento"
        className="mx-auto max-w-6xl px-6 py-28"
      >
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-10 shadow-sm">
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
              Cerimônia
            </p>

            <h3 className="mb-6 text-4xl">
              {formattedDate}
            </h3>

            <p className="mb-2 text-zinc-700">
              Início às {formattedTime}
            </p>

            <p className="text-zinc-700">
              {venue}
              <br />
              {address}
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-10 text-white">
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-400">
              Localização
            </p>

            <h3 className="mb-6 text-4xl">
              Como chegar
            </h3>

            <p className="mb-8 text-zinc-300">
              Disponibilizaremos rota detalhada para facilitar sua chegada.
            </p>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-white px-8 py-4 text-zinc-900"
            >
              Abrir no mapa
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-zinc-900 to-zinc-800 px-6 py-28 text-center text-white">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-400">
          Confirmação
        </p>

        <h2 className="mb-6 text-5xl">
          Esperamos você
        </h2>

        <p className="mb-10 text-zinc-300">
          Sua presença tornará nosso dia ainda mais especial.
        </p>

        <Link
          href="/rsvp"
          className="rounded-full bg-white px-10 py-4 text-zinc-900"
        >
          Confirmar Presença
        </Link>
      </section>
    </main>
  );
}