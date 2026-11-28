import type { LatLng } from "./geo";

export interface Bairro {
  nome: string;
  lat: number;
  lng: number;
}

/** Bairros e pontos de referência do Rio (centro aproximado de cada um). */
export const BAIRROS: readonly Bairro[] = [
  { nome: "Centro", lat: -22.9068, lng: -43.1823 },
  { nome: "Lapa", lat: -22.9133, lng: -43.1800 },
  { nome: "Glória", lat: -22.9213, lng: -43.1745 },
  { nome: "Flamengo", lat: -22.9322, lng: -43.1756 },
  { nome: "Botafogo", lat: -22.9519, lng: -43.1832 },
  { nome: "Urca", lat: -22.9530, lng: -43.1650 },
  { nome: "Copacabana", lat: -22.9711, lng: -43.1863 },
  { nome: "Ipanema", lat: -22.9838, lng: -43.2096 },
  { nome: "Leblon", lat: -22.9847, lng: -43.2230 },
  { nome: "Gávea", lat: -22.9780, lng: -43.2330 },
  { nome: "São Conrado", lat: -22.9990, lng: -43.2740 },
  { nome: "Barra da Tijuca", lat: -23.0004, lng: -43.3659 },
  { nome: "Recreio", lat: -23.0270, lng: -43.4600 },
  { nome: "Jacarepaguá", lat: -22.9600, lng: -43.3700 },
  { nome: "Cidade de Deus", lat: -22.9490, lng: -43.3620 },
  { nome: "Tijuca", lat: -22.9250, lng: -43.2320 },
  { nome: "Maracanã", lat: -22.9122, lng: -43.2302 },
  { nome: "Grajaú", lat: -22.9220, lng: -43.2600 },
  { nome: "Méier", lat: -22.9020, lng: -43.2780 },
  { nome: "Madureira", lat: -22.8730, lng: -43.3380 },
  { nome: "Penha", lat: -22.8410, lng: -43.2790 },
  { nome: "Bonsucesso", lat: -22.8650, lng: -43.2550 },
  { nome: "Maré", lat: -22.8600, lng: -43.2400 },
  { nome: "Ilha do Governador", lat: -22.8110, lng: -43.2100 },
  { nome: "Deodoro", lat: -22.8550, lng: -43.3830 },
  { nome: "Realengo", lat: -22.8790, lng: -43.4310 },
  { nome: "Bangu", lat: -22.8790, lng: -43.4650 },
  { nome: "Campo Grande", lat: -22.9050, lng: -43.5620 },
  { nome: "Santa Cruz", lat: -22.9190, lng: -43.6830 },
  { nome: "Pavuna", lat: -22.8070, lng: -43.3500 },
  { nome: "Linha Amarela", lat: -22.9100, lng: -43.2600 },
  { nome: "Avenida Brasil", lat: -22.8600, lng: -43.2600 },
  { nome: "Aeroporto Santos Dumont", lat: -22.9105, lng: -43.1631 },
  { nome: "Galeão", lat: -22.8100, lng: -43.2506 },
  { nome: "Rodoviária", lat: -22.8996, lng: -43.2090 },
  { nome: "IBMEC", lat: -22.9094, lng: -43.1769 },
  { nome: "Cristo Redentor", lat: -22.9519, lng: -43.2105 },
];

/** Minúsculas, sem acento, sem pontuação e sem espaços repetidos. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INDICE = BAIRROS.map((b) => ({ bairro: b, chave: normalizar(b.nome) }));

/**
 * Acha o bairro pelo texto digitado: primeiro nome igual, depois começo do nome,
 * depois nome contido no texto ("Av. Brasil, Bonsucesso"). Texto vazio ou curto demais não casa.
 */
export function resolverBairro(texto: string): Bairro | null {
  const alvo = normalizar(texto);
  if (alvo.length < 3) return null;
  const exato = INDICE.find((i) => i.chave === alvo);
  if (exato) return exato.bairro;
  const comeco = INDICE.find((i) => i.chave.startsWith(alvo));
  if (comeco) return comeco.bairro;
  // O mais longo primeiro, para "Ilha do Governador" ganhar de "Ilha".
  const contido = [...INDICE].sort((a, b) => b.chave.length - a.chave.length).find((i) => alvo.includes(i.chave));
  return contido ? contido.bairro : null;
}

export function posicaoDoBairro(b: Bairro): LatLng {
  return [b.lat, b.lng];
}
