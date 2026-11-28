export type LatLng = readonly [lat: number, lng: number];

/** Limites aproximados da cidade do Rio: [[oeste, sul], [leste, norte]] em [lng, lat] (formato do MapLibre). */
export const RIO_BOUNDS = [
  [-43.8, -23.09],
  [-43.09, -22.74],
] as const;

export const RIO_CENTRO: LatLng = [-22.92, -43.2];

export function dentroDoRio(lat: number, lng: number): boolean {
  const [[oeste, sul], [leste, norte]] = RIO_BOUNDS;
  return lat >= sul && lat <= norte && lng >= oeste && lng <= leste;
}

const KM_POR_GRAU_LAT = 111;
const KM_POR_GRAU_LNG = 102.5; // 111,32 * cos(22,9°): suficiente para o Rio

/** Plano local em km (x leste, y norte) em torno do centro do Rio. */
function plano(p: LatLng): [number, number] {
  return [(p[1] - RIO_CENTRO[1]) * KM_POR_GRAU_LNG, (p[0] - RIO_CENTRO[0]) * KM_POR_GRAU_LAT];
}

/** Distância aproximada, em km, entre dois pontos. */
export function distanciaKm(a: LatLng, b: LatLng): number {
  const [ax, ay] = plano(a);
  const [bx, by] = plano(b);
  return Math.hypot(ax - bx, ay - by);
}

/** Distância, em km, de um ponto ao segmento a→b. */
export function distanciaAoSegmentoKm(p: LatLng, a: LatLng, b: LatLng): number {
  const [px, py] = plano(p);
  const [ax, ay] = plano(a);
  const [bx, by] = plano(b);
  const dx = bx - ax;
  const dy = by - ay;
  const tamanho2 = dx * dx + dy * dy;
  if (tamanho2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / tamanho2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distância, em km, de um ponto à linha (várias pontas). Linha vazia = infinito. */
export function distanciaAoCaminhoKm(p: LatLng, caminho: readonly LatLng[]): number {
  if (caminho.length === 0) return Number.POSITIVE_INFINITY;
  if (caminho.length === 1) return distanciaKm(p, caminho[0]);
  let menor = Number.POSITIVE_INFINITY;
  for (let i = 0; i < caminho.length - 1; i++) {
    menor = Math.min(menor, distanciaAoSegmentoKm(p, caminho[i], caminho[i + 1]));
  }
  return menor;
}

/** Comprimento da linha, em km. */
export function comprimentoKm(caminho: readonly LatLng[]): number {
  let total = 0;
  for (let i = 0; i < caminho.length - 1; i++) total += distanciaKm(caminho[i], caminho[i + 1]);
  return total;
}
