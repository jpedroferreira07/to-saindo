/** Tipos de ocorrência, categorias e confiança (docs/PLANO-APP.md, seção 6). */

export type Categoria = "seguranca" | "mobilidade" | "clima" | "zeladoria" | "geral";

export type EventoTipo =
  | "tiroteio"
  | "assalto"
  | "transito"
  | "acidente"
  | "transporte"
  | "chuva"
  | "alagamento"
  | "arvore_caida"
  | "luz_queimada"
  | "buraco"
  | "outro";

export type Confianca = "oficial" | "confirmado" | "relato";
export type Origem = "oficial" | "noticia" | "usuario";

export interface InfoTipo {
  rotulo: string;
  categoria: Categoria;
  /** Validade em horas, contada da hora do ocorrido. */
  validadeH: number;
}

export const TIPOS: Record<EventoTipo, InfoTipo> = {
  tiroteio: { rotulo: "Tiroteio registrado", categoria: "seguranca", validadeH: 3 },
  assalto: { rotulo: "Assalto", categoria: "seguranca", validadeH: 3 },
  transito: { rotulo: "Trânsito", categoria: "mobilidade", validadeH: 2 },
  acidente: { rotulo: "Acidente", categoria: "mobilidade", validadeH: 2 },
  transporte: { rotulo: "Transporte", categoria: "mobilidade", validadeH: 3 },
  chuva: { rotulo: "Chuva", categoria: "clima", validadeH: 6 },
  alagamento: { rotulo: "Alagamento", categoria: "clima", validadeH: 6 },
  arvore_caida: { rotulo: "Árvore caída", categoria: "zeladoria", validadeH: 24 },
  luz_queimada: { rotulo: "Luz queimada", categoria: "zeladoria", validadeH: 72 },
  buraco: { rotulo: "Buraco na pista", categoria: "zeladoria", validadeH: 72 },
  outro: { rotulo: "Outra ocorrência", categoria: "geral", validadeH: 6 },
};

export const LISTA_TIPOS = Object.keys(TIPOS) as EventoTipo[];

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  seguranca: "Segurança",
  mobilidade: "Mobilidade",
  clima: "Clima",
  zeladoria: "Zeladoria",
  geral: "Geral",
};

/** Cor de cada categoria (direção visual, opção B). Nunca é o único sinal: sempre vem com ícone e rótulo. */
export const COR_CATEGORIA: Record<Categoria, string> = {
  seguranca: "#ff5a4f",
  mobilidade: "#3dbe63",
  clima: "#4d9bff",
  zeladoria: "#ffb000",
  geral: "#c3c8d0",
};

export const CONFIANCA_ROTULO: Record<Confianca, string> = {
  oficial: "oficial",
  confirmado: "confirmado",
  relato: "não confirmado",
};

export function ehTipo(valor: unknown): valor is EventoTipo {
  return typeof valor === "string" && valor in TIPOS;
}

export function ehConfianca(valor: unknown): valor is Confianca {
  return valor === "oficial" || valor === "confirmado" || valor === "relato";
}

export function categoriaDo(tipo: EventoTipo): Categoria {
  return TIPOS[tipo].categoria;
}
