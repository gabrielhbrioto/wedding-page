import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gabriel & Débora - Casamento",
  description: "Convite para o casamento de Gabriel e Débora",
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
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
