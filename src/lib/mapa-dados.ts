import type { Evento } from "./eventos";
import { distanciaKm, type LatLng } from "./geo";
import { COR_CATEGORIA } from "./tipos";

/** Subconjunto do GeoJSON que o mapa usa (evita depender dos tipos do pacote `geojson`). */
export interface Colecao<G extends { type: string }, P> {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; geometry: G; properties: P }>;
}
export type Ponto = { type: "Point"; coordinates: [number, number] };
export type Poligono = { type: "Polygon"; coordinates: Array<Array<[number, number]>> };
export type Linha = { type: "LineString"; coordinates: Array<[number, number]> };

export interface PropsPonto {
  id: string;
  tipo: string;
  cor: string;
  /** Nome da imagem do balão (ícone do tipo; tracejado quando é relato). */
  icone: string;
  severidade: number;
}

export function nomeDoBalao(evento: Pick<Evento, "tipo" | "confianca">): string {
  return `pin-${evento.tipo}-${evento.confianca === "relato" ? "r" : "f"}`;
}

export function eventosParaPontos(eventos: readonly Evento[]): Colecao<Ponto, PropsPonto> {
  return {
    type: "FeatureCollection",
    features: eventos.map((e) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [e.lng, e.lat] },
      properties: { id: e.id, tipo: e.tipo, cor: COR_CATEGORIA[e.categoria], icone: nomeDoBalao(e), severidade: e.severidade },
    })),
  };
}

const KM_POR_GRAU_LAT = 111;

/** Polígono de ~círculo em volta do ponto (raio em metros), para virar uma coluna 3D. */
export function circuloPoligono(lat: number, lng: number, raioM: number, passos = 10): Array<[number, number]> {
  const dLat = raioM / 1000 / KM_POR_GRAU_LAT;
  const dLng = raioM / 1000 / (KM_POR_GRAU_LAT * Math.cos((lat * Math.PI) / 180));
  const anel: Array<[number, number]> = [];
  for (let i = 0; i < passos; i++) {
    const a = (i / passos) * Math.PI * 2;
    anel.push([lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat]);
  }
  anel.push(anel[0]);
  return anel;
}

export interface PropsColuna {
  id: string;
  cor: string;
  /** Altura em metros: quanto mais grave, mais alta. */
  altura: number;
}

/** Colunas de luz em 3D sobre cada ocorrência (altura pela gravidade, mais alta se há confirmações). */
export function eventosParaColunas(eventos: readonly Evento[]): Colecao<Poligono, PropsColuna> {
  return {
    type: "FeatureCollection",
    features: eventos.map((e) => ({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [circuloPoligono(e.lat, e.lng, 55 + e.severidade * 10)] },
      properties: { id: e.id, cor: COR_CATEGORIA[e.categoria], altura: 140 + e.severidade * 140 + Math.min(e.confirmacoes - 1, 3) * 60 },
    })),
  };
}

export function caminhoParaLinha(caminho: readonly LatLng[]): Linha {
  return { type: "LineString", coordinates: caminho.map(([lat, lng]) => [lng, lat]) };
}

/** Ponto a `fracao` (0 a 1) do comprimento do caminho, mais o rumo (graus, 0 = norte) naquele trecho. */
export function pontoNoCaminho(caminho: readonly LatLng[], fracao: number): { ponto: LatLng; rumo: number } {
  if (caminho.length === 0) throw new Error("Caminho vazio");
  if (caminho.length === 1) return { ponto: caminho[0], rumo: 0 };
  const f = Math.min(1, Math.max(0, fracao));
  const trechos = caminho.slice(1).map((p, i) => distanciaKm(caminho[i], p));
  const total = trechos.reduce((s, d) => s + d, 0);
  let alvo = f * total;
  for (let i = 0; i < trechos.length; i++) {
    if (alvo <= trechos[i] || i === trechos.length - 1) {
      const t = trechos[i] === 0 ? 0 : Math.min(1, alvo / trechos[i]);
      const a = caminho[i];
      const b = caminho[i + 1];
      return { ponto: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], rumo: rumoEntre(a, b) };
    }
    alvo -= trechos[i];
  }
  return { ponto: caminho[caminho.length - 1], rumo: 0 };
}

/** Rumo de a para b, em graus (0 = norte, 90 = leste), no plano local do Rio. */
export function rumoEntre(a: LatLng, b: LatLng): number {
  const dx = (b[1] - a[1]) * Math.cos((((a[0] + b[0]) / 2) * Math.PI) / 180);
  const dy = b[0] - a[0];
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}
