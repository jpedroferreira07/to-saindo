import type { Metadata, Viewport } from "next";
import { Doto, Sora } from "next/font/google";
import "./globals.css";

// Doto: letreiro de LED (marca e trajeto). Sora: títulos, textos e botões.
const doto = Doto({ subsets: ["latin", "latin-ext"], weight: "900", variable: "--fonte-led", display: "swap" });
const sora = Sora({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "800"], variable: "--fonte-texto", display: "swap" });

const TITULO = "Tô saindo: o que está acontecendo no Rio agora, no mapa e no feed";
const DESCRICAO =
  "Mapa colaborativo do Rio de Janeiro: trânsito, chuva, tiroteio, assalto, árvore caída, luz queimada e mais, com rota de A até B e reportes conferidos por um agente de IA. Toda ocorrência vem com fonte, horário e confiança.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  applicationName: "Tô saindo",
  openGraph: {
    title: "Tô saindo: o que está acontecendo no Rio agora",
    description: DESCRICAO,
    locale: "pt_BR",
    type: "website",
    siteName: "Tô saindo",
  },
  twitter: { card: "summary_large_image", title: "Tô saindo: o que está acontecendo no Rio agora", description: DESCRICAO },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#101215",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${doto.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
