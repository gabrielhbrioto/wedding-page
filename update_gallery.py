import re

with open('apps/web/src/app/page.tsx', 'r') as f:
    content = f.read()

# Add Image import at the top
if 'import Image from "next/image";' not in content:
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Image from "next/image";')

# Define the new gallery section
gallery_section = """
      {/* GALERIA */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-[#D4A373]">
            Nossos Momentos
          </p>

          <h2 className="mb-12 text-5xl md:text-6xl text-[#4A443E]">
            Galeria de Fotos
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {/* 
              Instruções para adicionar fotos:
              1. Coloque as suas fotos na pasta `apps/web/public/fotos/`
              2. Substitua o `src` abaixo pelo nome do arquivo (ex: "/fotos/1.jpg")
              3. Você pode duplicar ou remover essas divs de imagem conforme precisar!
            */}
            
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg border border-stone-100 group">
              <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center text-[#A3B19B] p-6 text-center transition group-hover:scale-105 duration-500">
                <span className="text-sm font-medium mb-2 uppercase tracking-widest">Foto 1</span>
                <span className="text-xs">Coloque "/fotos/1.jpg" em public</span>
              </div>
              {/* Descomente o código abaixo e apague a div acima quando tiver a foto */}
              {/* <Image src="/fotos/1.jpg" alt="Foto casal 1" fill className="object-cover transition duration-700 hover:scale-105" /> */}
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg border border-stone-100 group">
              <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center text-[#A3B19B] p-6 text-center transition group-hover:scale-105 duration-500">
                <span className="text-sm font-medium mb-2 uppercase tracking-widest">Foto 2</span>
                <span className="text-xs">Coloque "/fotos/2.jpg" em public</span>
              </div>
              {/* Descomente o código abaixo e apague a div acima quando tiver a foto */}
              {/* <Image src="/fotos/2.jpg" alt="Foto casal 2" fill className="object-cover transition duration-700 hover:scale-105" /> */}
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg border border-stone-100 group sm:col-span-2 md:col-span-1">
              <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center text-[#A3B19B] p-6 text-center transition group-hover:scale-105 duration-500">
                <span className="text-sm font-medium mb-2 uppercase tracking-widest">Foto 3</span>
                <span className="text-xs">Coloque "/fotos/3.jpg" em public</span>
              </div>
              {/* Descomente o código abaixo e apague a div acima quando tiver a foto */}
              {/* <Image src="/fotos/3.jpg" alt="Foto casal 3" fill className="object-cover transition duration-700 hover:scale-105" /> */}
            </div>
          </div>
        </div>
      </section>
"""

# Insert gallery before EVENTO
evento_marker = "      {/* EVENTO */}"
content = content.replace(evento_marker, gallery_section + "\n" + evento_marker)

# Replace the hero background with an image container and instructions
hero_old_bg = """        {/* Subtle floral/elegant background patterns can go here. We use soft blur circles for a delicate touch */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50" />"""

hero_new_bg = """        {/* Imagem de Fundo (Para usar uma foto, descomente o componente Image abaixo e comente o padrão floral) */}
        {/* <Image src="/fotos/fundo.jpg" alt="Fundo" fill className="object-cover opacity-60" priority /> */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50" />"""

content = content.replace(hero_old_bg, hero_new_bg)

with open('apps/web/src/app/page.tsx', 'w') as f:
    f.write(content)
