import { estaAtivo, posicao, type Evento } from "./eventos";
import { distanciaAoCaminhoKm, type LatLng } from "./geo";

/** Distância máxima entre a ocorrência e a rota para ela contar como "no caminho" (docs/PLANO-APP.md, 4.2). */
export const RAIO_ROTA_KM = 0.5;

export interface NoCaminho {
  evento: Evento;
  /** Distância até a rota, em km. */
  distanciaKm: number;
}

/**
 * Ocorrências ativas a até `raioKm` da rota, as mais graves primeiro (empate: a mais perto).
 * Expirada nunca entra.
 */
export function ocorrenciasNoCaminho(
  caminho: readonly LatLng[],
  eventos: readonly Evento[],
  agora: Date,
  raioKm: number = RAIO_ROTA_KM,
): NoCaminho[] {
  return eventos
    .filter((e) => estaAtivo(e, agora))
    .map((e) => ({ evento: e, distanciaKm: distanciaAoCaminhoKm(posicao(e), caminho) }))
    .filter((x) => x.distanciaKm <= raioKm)
    .sort((a, b) => b.evento.severidade - a.evento.severidade || a.distanciaKm - b.distanciaKm);
}
