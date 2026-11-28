import { categoriaDo, ehConfianca, ehTipo, TIPOS, type Categoria, type Confianca, type EventoTipo, type Origem } from "./tipos";
import type { LatLng } from "./geo";

export type { Categoria, Confianca, EventoTipo, Origem } from "./tipos";

/** Formato único da ocorrência, igual à tabela `events` do Supabase (docs/PLANO-APP.md, seção 8.1). */
export interface Evento {
  id: string;
  tipo: EventoTipo;
  categoria: Categoria;
  titulo: string;
  descricao?: string;
  bairro: string;
  lat: number;
  lng: number;
  /** Hora do ocorrido (ISO 8601). */
  inicio: string;
  /** Depois disso a ocorrência some do mapa e do feed (ISO 8601). */
  expira_em: string;
  fonte: string;
  url?: string;
  origem: Origem;
  confianca: Confianca;
  severidade: 1 | 2 | 3;
  /** Quantos reportes independentes confirmam. */
  confirmacoes: number;
  /** Dado fictício da demo: sempre rotulado como exemplo na tela. */
  exemplo: boolean;
}

export function posicao(evento: Pick<Evento, "lat" | "lng">): LatLng {
  return [evento.lat, evento.lng];
}

/** A ocorrência ainda vale? Expirada não aparece nem no mapa nem no feed. */
export function estaAtivo(evento: Evento, agora: Date): boolean {
  const expira = Date.parse(evento.expira_em);
  return Number.isFinite(expira) && expira > agora.getTime();
}

const FORMATO_HORA = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Sao_Paulo",
});

/** "06h35", sempre no horário do Rio (America/Sao_Paulo). */
export function horaDoRio(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "--h--";
  const partes = FORMATO_HORA.formatToParts(data);
  const h = partes.find((x) => x.type === "hour")?.value ?? "--";
  const m = partes.find((x) => x.type === "minute")?.value ?? "--";
  return `${h}h${m}`;
}

/** "há 5 min", "há 2 h", "há 3 dias". Datas no futuro ou inválidas viram "agora há pouco". */
export function haQuanto(iso: string, agora: Date): string {
  const ms = agora.getTime() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 60_000) return "agora há pouco";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}

type Molde = Pick<Evento, "tipo" | "titulo" | "bairro" | "lat" | "lng" | "fonte" | "confianca" | "severidade" | "origem"> & {
  /** Há quantos minutos aconteceu. */
  haMin: number;
  confirmacoes?: number;
};

/** Plano B da demo: ocorrências fictícias (docs/EVENTOS-EXEMPLO.md, ampliadas com os tipos novos). */
const MOLDES: readonly Molde[] = [
  { tipo: "chuva", titulo: "Chuva forte, 30 mm na última hora", bairro: "Copacabana", lat: -22.97, lng: -43.19, fonte: "Alerta Rio", confianca: "oficial", severidade: 2, origem: "oficial", haMin: 25 },
  { tipo: "alagamento", titulo: "Ponto de alagamento sentido Centro", bairro: "Bonsucesso", lat: -22.86, lng: -43.25, fonte: "G1 Rio", confianca: "confirmado", severidade: 2, origem: "noticia", haMin: 40 },
  { tipo: "transito", titulo: "Lentidão na Linha Amarela sentido Barra", bairro: "Linha Amarela", lat: -22.91, lng: -43.26, fonte: "G1 Rio", confianca: "confirmado", severidade: 1, origem: "noticia", haMin: 20 },
  { tipo: "tiroteio", titulo: "Disparos registrados perto da Av. Brasil", bairro: "Maré", lat: -22.86, lng: -43.24, fonte: "Fogo Cruzado", confianca: "confirmado", severidade: 3, origem: "noticia", haMin: 45 },
  { tipo: "transporte", titulo: "Operação parcial na Linha 1 do metrô", bairro: "Centro", lat: -22.91, lng: -43.18, fonte: "MetrôRio", confianca: "oficial", severidade: 2, origem: "oficial", haMin: 30 },
  { tipo: "transito", titulo: "Interdição para obra na Av. Presidente Vargas", bairro: "Centro", lat: -22.9, lng: -43.18, fonte: "Usuários", confianca: "relato", severidade: 1, origem: "usuario", haMin: 90 },
  { tipo: "chuva", titulo: "Chuva moderada, risco de bolsões", bairro: "Tijuca", lat: -22.92, lng: -43.23, fonte: "Alerta Rio", confianca: "oficial", severidade: 2, origem: "oficial", haMin: 35 },
  { tipo: "transporte", titulo: "Desvio de ônibus na Av. Maracanã", bairro: "Tijuca", lat: -22.92, lng: -43.23, fonte: "Usuários", confianca: "relato", severidade: 1, origem: "usuario", haMin: 60 },
  { tipo: "alagamento", titulo: "Bolsão d'água na Estrada dos Bandeirantes", bairro: "Jacarepaguá", lat: -22.96, lng: -43.37, fonte: "Usuários", confianca: "confirmado", severidade: 2, origem: "usuario", haMin: 50, confirmacoes: 2 },
  { tipo: "acidente", titulo: "Acidente com faixa interditada na Av. Cesário de Melo", bairro: "Campo Grande", lat: -22.9, lng: -43.56, fonte: "G1 Rio", confianca: "confirmado", severidade: 2, origem: "noticia", haMin: 15 },
  { tipo: "chuva", titulo: "Chuva forte prevista para as 6h50", bairro: "Campo Grande", lat: -22.9, lng: -43.56, fonte: "Alerta Rio", confianca: "oficial", severidade: 2, origem: "oficial", haMin: 10 },
  { tipo: "transporte", titulo: "Trens com intervalo maior no ramal Santa Cruz", bairro: "Deodoro", lat: -22.85, lng: -43.38, fonte: "SuperVia", confianca: "oficial", severidade: 1, origem: "oficial", haMin: 55 },
  { tipo: "transito", titulo: "Evento fecha faixas na Av. Lúcio Costa", bairro: "Barra da Tijuca", lat: -23.0, lng: -43.36, fonte: "G1 Rio", confianca: "confirmado", severidade: 1, origem: "noticia", haMin: 120 },
  { tipo: "tiroteio", titulo: "Disparos registrados, relato isolado", bairro: "Cidade de Deus", lat: -22.95, lng: -43.36, fonte: "Fogo Cruzado", confianca: "relato", severidade: 2, origem: "noticia", haMin: 70 },
  { tipo: "chuva", titulo: "Chuva fraca", bairro: "Grajaú", lat: -22.92, lng: -43.26, fonte: "Alerta Rio", confianca: "oficial", severidade: 1, origem: "oficial", haMin: 5 },
  { tipo: "arvore_caida", titulo: "Árvore caída bloqueando uma faixa", bairro: "Tijuca", lat: -22.925, lng: -43.235, fonte: "Usuários", confianca: "relato", severidade: 2, origem: "usuario", haMin: 12 },
  { tipo: "luz_queimada", titulo: "Poste sem iluminação na calçada", bairro: "Lapa", lat: -22.913, lng: -43.18, fonte: "Usuários", confianca: "confirmado", severidade: 1, origem: "usuario", haMin: 300, confirmacoes: 3 },
  { tipo: "buraco", titulo: "Buraco grande na pista", bairro: "Botafogo", lat: -22.951, lng: -43.183, fonte: "Usuários", confianca: "relato", severidade: 1, origem: "usuario", haMin: 180 },
  { tipo: "assalto", titulo: "Assalto relatado perto da estação", bairro: "Madureira", lat: -22.873, lng: -43.338, fonte: "Usuários", confianca: "relato", severidade: 2, origem: "usuario", haMin: 35 },
];

/** Plano B da demo: ocorrências fictícias relativas a `agora`, todas com `exemplo: true`. */
export function eventosExemplo(agora: Date = new Date()): Evento[] {
  return MOLDES.map(({ haMin, confirmacoes, ...m }, i) => {
    const inicio = new Date(agora.getTime() - haMin * 60_000);
    return {
      ...m,
      id: `exemplo-${i + 1}`,
      categoria: categoriaDo(m.tipo),
      inicio: inicio.toISOString(),
      expira_em: new Date(inicio.getTime() + TIPOS[m.tipo].validadeH * 3_600_000).toISOString(),
      confirmacoes: confirmacoes ?? 1,
      exemplo: true,
    };
  });
}

const ORIGENS: readonly Origem[] = ["oficial", "noticia", "usuario"];

/**
 * Valida uma linha vinda do banco ou de uma rota de API (entrada não confiável).
 * Devolve null se algo estiver fora do formato. Tipos antigos (`noticia`) viram `outro`.
 */
export function lerLinhaDoBanco(linha: unknown): Evento | null {
  if (typeof linha !== "object" || linha === null) return null;
  const l = linha as Record<string, unknown>;
  const tipo = l.tipo === "noticia" ? "outro" : l.tipo;
  const severidade = Number(l.severidade);
  const lat = Number(l.lat);
  const lng = Number(l.lng);
  if (
    (typeof l.id !== "string" && typeof l.id !== "number") ||
    !ehTipo(tipo) ||
    !ehConfianca(l.confianca) ||
    typeof l.titulo !== "string" ||
    typeof l.fonte !== "string" ||
    typeof l.inicio !== "string" ||
    typeof l.expira_em !== "string" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    ![1, 2, 3].includes(severidade)
  ) {
    return null;
  }
  const confirmacoes = Number(l.confirmacoes);
  return {
    id: String(l.id),
    tipo,
    categoria: categoriaDo(tipo),
    titulo: l.titulo.slice(0, 160),
    descricao: typeof l.descricao === "string" ? l.descricao.slice(0, 400) : undefined,
    bairro: typeof l.bairro === "string" && l.bairro ? l.bairro.slice(0, 80) : "Rio de Janeiro",
    lat,
    lng,
    inicio: l.inicio,
    expira_em: l.expira_em,
    fonte: l.fonte.slice(0, 80),
    url: typeof l.url === "string" && /^https?:\/\//.test(l.url) ? l.url : undefined,
    origem: ORIGENS.find((o) => o === l.origem) ?? "usuario",
    confianca: l.confianca,
    severidade: severidade as 1 | 2 | 3,
    confirmacoes: Number.isFinite(confirmacoes) && confirmacoes >= 1 ? Math.floor(confirmacoes) : 1,
    exemplo: l.exemplo === true,
  };
}
