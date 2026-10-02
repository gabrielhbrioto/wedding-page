import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
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
  recepcao_local_nome: string | null;
  recepcao_endereco: string | null;
  recepcao_google_maps_url: string | null;
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

async function getInviteType(token: string): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/v1/public/invite/${token}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.type;
  } catch (error) {
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
  const cookieStore = await cookies();
  const token = cookieStore.get("invite_token")?.value;
  let inviteType = null;
  
  if (token) {
    inviteType = await getInviteType(token);
  }

  const hasDinner = inviteType && inviteType !== "CERIMONIA";

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
  const mensagemHome = eventData?.mensagem_home || null;
  
  const recepcaoNome = eventData?.recepcao_local_nome || null;
  const recepcaoEndereco = eventData?.recepcao_endereco || null;
  const recepcaoMapsUrl = eventData?.recepcao_google_maps_url || null;
  const showReception = Boolean(hasDinner && recepcaoNome && recepcaoEndereco && recepcaoMapsUrl);

  return (
    <main className="overflow-hidden bg-[#F8F9FA]">
      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6 text-center bg-[#E0F2FE]">
        {/* Imagem de Fundo (Para usar uma foto, descomente o componente Image abaixo e comente o padrão floral) */}
        {/* <Image src="/fotos/fundo.jpg" alt="Fundo" fill className="object-cover opacity-60" priority /> */}
        
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50" />
        <div className="absolute -top-20 left-10 h-96 w-96 rounded-full bg-[#003A6C] blur-[100px] opacity-10" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[#006A89] blur-[100px] opacity-10" />

        <div className="relative z-10 max-w-4xl mx-auto px-8 py-20 bg-white/70 backdrop-blur-sm border border-[#003A6C]/10 shadow-2xl shadow-[#003A6C]/5 rounded-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.5em] text-[#003A6C] font-semibold">
            {formattedDate} • {address.split(/,\s*/)[0]}
          </p>

          <h1 className="mb-4 text-6xl leading-tight md:text-8xl text-[#06264D]">
            {couple.split(" & ")[0]} <span className="font-script text-[#006A89] mx-2 text-7xl md:text-9xl font-normal">&</span>{" "}
            {couple.split(" & ")[1] || ""}
          </h1>

          <p className="font-script text-4xl md:text-6xl text-[#003A6C] mb-12">
            Vamos casar!
          </p>

          <div className="flex flex-col justify-center gap-5 sm:flex-row mt-12">
            <Link
              href="/rsvp"
              className="rounded-full bg-[#006A89] px-10 py-4 text-white transition hover:bg-[#004F69] hover:shadow-[0_0_15px_rgba(0,106,137,0.3)] uppercase tracking-widest text-sm font-medium"
            >
              Confirmar Presença
            </Link>

            {giftListUrl ? (
              <a
                href={giftListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#003A6C] px-10 py-4 text-[#003A6C] transition hover:bg-[#003A6C] hover:text-white uppercase tracking-widest text-sm font-medium"
              >
                Lista de Presentes
              </a>
            ) : null}

            <a
              href="#evento"
              className="rounded-full border border-transparent text-[#06264D] px-10 py-4 transition hover:text-[#006A89] uppercase tracking-widest text-sm font-medium underline underline-offset-8"
            >
              Ver Detalhes
            </a>
          </div>
        </div>
      </section>

      {/* CONTAGEM */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.4em] text-[#003A6C] font-semibold">
          Falta pouco
        </p>
        <h2 className="mb-12 text-4xl md:text-5xl text-[#06264D]">
          Contagem Regressiva
        </h2>
        <Countdown dataEvento={eventDateString} />
      </section>

      {/* BEM-VINDOS */}
      <section className="bg-white py-28 relative border-y border-[#003A6C]/10">
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#006A89] font-semibold">
            Bem-vindos ao nosso casamento!
          </p>

          <h2 className="mb-12 text-5xl md:text-6xl text-[#003A6C]">
            Sim, é verdade! A gente vai se casar!!!
          </h2>

          {mensagemHome ? (
            <p className="text-lg md:text-xl leading-relaxed text-[#06264D] whitespace-pre-line font-light">
              {mensagemHome}
            </p>
          ) : (
            <div className="text-lg md:text-xl leading-relaxed text-[#06264D] space-y-6 font-light">
              <p>
                Estamos muito felizes! Estamos nas nuvens e queremos compartilhar com você todo o nosso amor. Por isso estamos preparando um casamento que fará história e no qual você vai se divertir muito.
              </p>
              <p>
                Enquanto não chega o grande dia criamos um site com um montão de sessões para que todos estejam ao dia de tudo e para compartilhar a nossa história de amor.
              </p>
              <p>
                Uma coisa importante, na sessão presença, poderá confirmar se você vai ou não ao casamento. Confirme o mais rápido possível por favor, que assim, organizar tudo será muito mais fácil.
              </p>
              <p className="font-script text-5xl text-[#006A89] pt-8">
                Aproveite da web e a gente se encontra em breve, muitos beijos!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* GALERIA */}
      <section className="bg-[#F8F9FA] py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#006A89] font-semibold">
            Nossos Momentos
          </p>

          <h2 className="mb-16 text-5xl md:text-6xl text-[#06264D]">
            Galeria de Fotos
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-xl border-4 border-white group">
              <div className="absolute inset-0 bg-[#003A6C]/5 flex flex-col items-center justify-center text-[#003A6C] p-6 text-center transition group-hover:scale-105 duration-500">
                <span className="text-sm font-medium mb-2 uppercase tracking-widest">Foto 1</span>
                <span className="text-xs">Coloque "/fotos/1.jpg" em public</span>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-xl border-4 border-white group">
              <div className="absolute inset-0 bg-[#003A6C]/5 flex flex-col items-center justify-center text-[#003A6C] p-6 text-center transition group-hover:scale-105 duration-500">
                <span className="text-sm font-medium mb-2 uppercase tracking-widest">Foto 2</span>
                <span className="text-xs">Coloque "/fotos/2.jpg" em public</span>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-xl border-4 border-white group sm:col-span-2 md:col-span-1">
              <div className="absolute inset-0 bg-[#003A6C]/5 flex flex-col items-center justify-center text-[#003A6C] p-6 text-center transition group-hover:scale-105 duration-500">
                <span className="text-sm font-medium mb-2 uppercase tracking-widest">Foto 3</span>
                <span className="text-xs">Coloque "/fotos/3.jpg" em public</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTO */}
      <section
        id="evento"
        className="bg-white py-32 border-t border-[#1F578D]/10"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className={`grid gap-10 md:grid-cols-2 ${showReception ? "lg:grid-cols-3" : ""}`}>
            
            {/* Cerimonia Card */}
            <div className="rounded-[2rem] bg-[#1F578D] p-12 shadow-xl text-center relative overflow-hidden text-white">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#006A89]"></div>
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/70 font-medium">
                Cerimônia
              </p>
              <h3 className="mb-6 text-4xl">
                {formattedDate}
              </h3>
              <p className="mb-2 text-white/90">
                Início às {formattedTime}
              </p>
              <p className="text-white/90">
                {venue}
                <br />
                {address}
              </p>
            </div>

            {/* Recepção Card */}
            {showReception ? (
              <div className="rounded-[2rem] bg-[#1F578D] p-12 shadow-xl text-center relative overflow-hidden text-white">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#006A89]"></div>
                <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/70 font-medium">
                  Recepção
                </p>
                <h3 className="mb-6 text-4xl">
                  Jantar
                </h3>
                <p className="mb-2 text-white/90">
                  Logo após a cerimônia
                </p>
                <p className="mb-10 text-white/90">
                  {recepcaoNome}
                  <br />
                  {recepcaoEndereco}
                </p>
                <a
                  href={recepcaoMapsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border border-white/40 px-8 py-3 text-white transition hover:bg-white hover:text-[#1F578D] uppercase tracking-widest text-xs font-bold"
                >
                  Abrir no mapa
                </a>
              </div>
            ) : null}

            {/* Localização Card */}
            <div className="rounded-[2rem] bg-[#1F578D] p-12 text-white text-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#006A89]"></div>
              <div className="relative z-10">
                <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/70 font-medium">
                  Localização
                </p>
                <h3 className="mb-6 text-4xl">
                  Como chegar
                </h3>
                <p className="mb-10 text-white/90">
                  Disponibilizaremos rota detalhada para facilitar sua chegada.
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-white px-8 py-3 text-[#1F578D] hover:bg-gray-100 transition hover:shadow-lg uppercase tracking-widest text-xs font-bold"
                >
                  Abrir no mapa
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#003A6C] px-6 py-32 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="mb-4 text-sm uppercase tracking-[0.5em] text-white/80 font-bold">
            Confirmação
          </p>

          <h2 className="mb-8 text-5xl md:text-7xl font-serif">
            Esperamos por você
          </h2>

          <p className="mb-12 text-white/90 text-xl font-light">
            Sua presença tornará nosso dia ainda mais especial.
          </p>

          <Link
            href="/rsvp"
            className="inline-block rounded-full bg-[#006A89] px-12 py-5 text-white transition hover:bg-[#004F69] uppercase tracking-widest text-sm shadow-2xl font-bold"
          >
            Confirmar Presença
          </Link>
        </div>
      </section>
    </main>
  );
}
