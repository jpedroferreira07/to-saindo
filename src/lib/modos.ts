export type ModoId = "carro" | "moto" | "bike" | "onibus" | "metro" | "vlt" | "trem" | "barca";

export interface Modo {
  id: ModoId;
  /** Texto do chip e da etiqueta na cena. */
  rotulo: string;
  /** Texto do letreiro: "DE CARRO". */
  letreiro: string;
  /** Sons em ordem (tocam um depois do outro). Vazio = sem som (ônibus, em aberto). */
  sons: readonly string[];
}

/** Os 8 meios. Nenhum é o herói: o produto vale para todos (PRODUCT.md). */
export const MODOS: readonly Modo[] = [
  { id: "carro", rotulo: "carro", letreiro: "DE CARRO", sons: ["/sons/carro.mp3"] },
  { id: "moto", rotulo: "moto", letreiro: "DE MOTO", sons: ["/sons/moto.mp3"] },
  { id: "bike", rotulo: "bike", letreiro: "DE BIKE", sons: ["/sons/bike.mp3"] },
  { id: "onibus", rotulo: "ônibus / BRT", letreiro: "DE ÔNIBUS", sons: ["/sons/sinal.mp3", "/sons/voz-brt.mp3"] },
  { id: "metro", rotulo: "metrô", letreiro: "DE METRÔ", sons: ["/sons/sinal.mp3", "/sons/voz-metro.mp3"] },
  { id: "vlt", rotulo: "VLT", letreiro: "DE VLT", sons: ["/sons/vlt.mp3"] },
  { id: "trem", rotulo: "trem", letreiro: "DE TREM", sons: ["/sons/trem.mp3"] },
  { id: "barca", rotulo: "barca", letreiro: "DE BARCA", sons: ["/sons/barca.mp3"] },
];

export function modoPorId(id: string): Modo | undefined {
  return MODOS.find((m) => m.id === id);
}
