import re

with open('apps/web/src/app/page.tsx', 'r') as f:
    content = f.read()

# Update Hero Section
hero_old = """      {/* HERO */}
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
      </section>"""

hero_new = """      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6 text-center bg-[#FCFAF8]">
        {/* Subtle floral/elegant background patterns can go here. We use soft blur circles for a delicate touch */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50" />
        <div className="absolute -top-20 left-10 h-96 w-96 rounded-full bg-[#E8C5C8] blur-[100px] opacity-30" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[#A3B19B] blur-[100px] opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 bg-white/40 backdrop-blur-sm border border-white/60 shadow-xl shadow-stone-200/50 rounded-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#A3B19B] font-semibold">
            {formattedDate} • {address.split(/,\s*/)[0]}
          </p>

          <h1 className="mb-4 text-6xl leading-tight md:text-8xl text-[#4A443E]">
            {couple.split(" & ")[0]} <span className="font-script text-[#D4A373] mx-2 text-7xl md:text-9xl font-normal">&</span>{" "}
            {couple.split(" & ")[1] || ""}
          </h1>

          <p className="font-script text-4xl md:text-5xl text-[#D4A373] mb-8">
            Vamos casar!
          </p>

          <div className="flex flex-col justify-center gap-5 sm:flex-row mt-12">
            <Link
              href="/rsvp"
              className="rounded-full bg-[#A3B19B] px-10 py-4 text-white transition hover:bg-[#8A9A86] hover:shadow-lg uppercase tracking-widest text-sm"
            >
              Confirmar Presença
            </Link>

            {giftListUrl ? (
              <a
                href={giftListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#D4A373] px-10 py-4 text-[#D4A373] transition hover:bg-[#D4A373] hover:text-white uppercase tracking-widest text-sm"
              >
                Lista de Presentes
              </a>
            ) : null}

            <a
              href="#evento"
              className="rounded-full border border-stone-300 px-10 py-4 text-stone-600 transition hover:bg-stone-50 uppercase tracking-widest text-sm"
            >
              Ver Detalhes
            </a>
          </div>
        </div>
      </section>"""

content = content.replace(hero_old, hero_new)

# Update Historia Section
historia_old = """      {/* HISTÓRIA */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
            Nossa História
          </p>

          <h2 className="mb-10 text-5xl">
            Um encontro que virou destino
          </h2>

          {mensagemHome ? (
            <p className="text-lg leading-9 text-zinc-600">
              {mensagemHome}
            </p>
          ) : (
            <p className="text-lg leading-9 text-zinc-600">
              Entre encontros inesperados, conversas infinitas
              e sonhos compartilhados, construímos uma linda
              história. Agora queremos celebrar esse capítulo
              ao lado de quem faz parte da nossa vida.
            </p>
          )}
        </div>
      </section>"""

historia_new = """      {/* BEM-VINDOS */}
      <section className="bg-white py-28 relative">
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#D4A373]">
            Bem-vindos ao nosso casamento!
          </p>

          <h2 className="mb-12 text-5xl md:text-6xl text-[#4A443E]">
            Sim, é verdade! A gente vai se casar!!!
          </h2>

          {mensagemHome ? (
            <p className="text-lg leading-relaxed text-[#6E6862] whitespace-pre-line">
              {mensagemHome}
            </p>
          ) : (
            <div className="text-lg leading-relaxed text-[#6E6862] space-y-6">
              <p>
                Estamos muito felizes! Estamos nas nuvens e queremos compartilhar com você todo o nosso amor. Por isso estamos preparando um casamento que fará história e no qual você vai se divertir muito.
              </p>
              <p>
                Enquanto não chega o grande dia criamos um site com um montão de sessões para que todos estejam ao dia de tudo e para compartilhar a nossa história de amor.
              </p>
              <p>
                Uma coisa importante, na sessão presença, poderá confirmar se você vai ou não ao casamento. Confirme o mais rápido possível por favor, que assim, organizar tudo será muito mais fácil.
              </p>
              <p className="font-script text-4xl text-[#A3B19B] pt-6">
                Aproveite da web e a gente se encontra em breve, muitos beijos!
              </p>
            </div>
          )}
        </div>
      </section>"""

content = content.replace(historia_old, historia_new)

# Update Evento Section colors
evento_old = """      {/* EVENTO */}
      <section
        id="evento"
        className="mx-auto max-w-6xl px-6 py-28"
      >
        <div className={`grid gap-10 md:grid-cols-2 ${showReception ? "lg:grid-cols-3" : ""}`}>
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

          {showReception ? (
            <div className="rounded-3xl bg-white p-10 shadow-sm">
              <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
                Recepção
              </p>

              <h3 className="mb-6 text-4xl">
                Jantar
              </h3>

              <p className="mb-2 text-zinc-700">
                Logo após a cerimônia
              </p>

              <p className="mb-8 text-zinc-700">
                {recepcaoNome}
                <br />
                {recepcaoEndereco}
              </p>

              <a
                href={recepcaoMapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full border border-zinc-300 px-8 py-4 text-zinc-900 transition hover:bg-zinc-100"
              >
                Abrir no mapa
              </a>
            </div>
          ) : null}

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
      </section>"""

evento_new = """      {/* EVENTO */}
      <section
        id="evento"
        className="bg-[#FCFAF8] py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className={`grid gap-10 md:grid-cols-2 ${showReception ? "lg:grid-cols-3" : ""}`}>
            <div className="rounded-[2rem] bg-white p-12 shadow-xl shadow-[#D4A373]/10 border border-[#F4EAE6] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#A3B19B]"></div>
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#D4A373]">
                Cerimônia
              </p>

              <h3 className="mb-6 text-4xl text-[#4A443E]">
                {formattedDate}
              </h3>

              <p className="mb-2 text-[#6E6862]">
                Início às {formattedTime}
              </p>

              <p className="text-[#6E6862]">
                {venue}
                <br />
                {address}
              </p>
            </div>

            {showReception ? (
              <div className="rounded-[2rem] bg-white p-12 shadow-xl shadow-[#D4A373]/10 border border-[#F4EAE6] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#D4A373]"></div>
                <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#D4A373]">
                  Recepção
                </p>

                <h3 className="mb-6 text-4xl text-[#4A443E]">
                  Jantar
                </h3>

                <p className="mb-2 text-[#6E6862]">
                  Logo após a cerimônia
                </p>

                <p className="mb-10 text-[#6E6862]">
                  {recepcaoNome}
                  <br />
                  {recepcaoEndereco}
                </p>

                <a
                  href={recepcaoMapsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border border-[#D4A373] px-8 py-3 text-[#D4A373] transition hover:bg-[#D4A373] hover:text-white uppercase tracking-widest text-xs"
                >
                  Abrir no mapa
                </a>
              </div>
            ) : null}

            <div className="rounded-[2rem] bg-[#A3B19B] p-12 text-white text-center shadow-xl shadow-[#A3B19B]/20">
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/80">
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
                className="inline-block rounded-full bg-white px-8 py-3 text-[#A3B19B] hover:bg-stone-50 transition uppercase tracking-widest text-xs"
              >
                Abrir no mapa
              </a>
            </div>
          </div>
        </div>
      </section>"""

content = content.replace(evento_old, evento_new)

# Update CTA Section colors
cta_old = """      {/* CTA */}
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
      </section>"""

cta_new = """      {/* CTA */}
      <section className="bg-[#4A443E] px-6 py-32 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#D4A373]">
            Confirmação
          </p>

          <h2 className="mb-8 text-5xl md:text-6xl">
            Esperamos por você
          </h2>

          <p className="mb-12 text-stone-300 text-lg">
            Sua presença tornará nosso dia ainda mais especial.
          </p>

          <Link
            href="/rsvp"
            className="inline-block rounded-full bg-[#D4A373] px-12 py-5 text-white transition hover:bg-[#c29262] uppercase tracking-widest text-sm shadow-xl"
          >
            Confirmar Presença
          </Link>
        </div>
      </section>"""

content = content.replace(cta_old, cta_new)

# Replace the text-zinc-500 in Contagem with the new color scheme
content = content.replace('text-zinc-500">\\n          Falta pouco', 'text-[#D4A373]">\\n          Falta pouco')
content = content.replace('text-5xl">\\n          Contagem Regressiva', 'text-5xl text-[#4A443E]">\\n          Contagem Regressiva')


with open('apps/web/src/app/page.tsx', 'w') as f:
    f.write(content)
