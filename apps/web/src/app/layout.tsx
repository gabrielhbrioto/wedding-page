import type { Metadata } from "next";
import { Playfair_Display, Montserrat, Great_Vibes } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  title: "Debora & Gabriel - Casamento",
  description: "Nosso site de casamento - Bem-vindos!",
  icons: {
    icon: "/logo-casamento-com-fundo.jpg",
    apple: "/logo-casamento-com-fundo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${montserrat.variable} ${greatVibes.variable}`}>
      <body className="font-sans text-stone-700 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
