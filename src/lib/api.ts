import { z } from "zod";
import { resolverBairro } from "./bairros";
import { estaAtivo, eventosExemplo, lerLinhaDoBanco, type Evento } from "./eventos";
import { comprimentoKm, dentroDoRio, type LatLng } from "./geo";
import { categoriaDo, ehTipo, TIPOS, type EventoTipo } from "./tipos";
import { ocorrenciasNoCaminho } from "./trajeto";

/**
 * Cliente das rotas de API (contratos em docs/PLANO-APP.md, seção 9).
 * As rotas são dos colegas: enquanto não respondem, cada função cai num plano B local com o mesmo formato
 * e devolve `origem: "exemplo"`, para a tela avisar. Toda resposta é validada antes de usar.
 */
export type OrigemDosDados = "servidor" | "exemplo";
export interface Resposta<T> {
  dados: T;
  origem: OrigemDosDados;
}

const TEMPO_MS = 8000;

async function pedir(url: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(TEMPO_MS), headers: { Accept: "application/json", ...init?.headers } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/* ---------- Ocorrências ---------- */

export async function listarOcorrencias(agora: Date = new Date()): Promise<Resposta<Evento[]>> {
  try {
    const bruto = await pedir("/api/ocorrencias");
    const linhas = z.array(z.unknown()).parse(bruto);
    const eventos = linhas.map(lerLinhaDoBanco).filter((e): e is Evento => e !== null && estaAtivo(e, agora));
    return { dados: eventos, origem: "servidor" };
  } catch {
    return { dados: eventosExemplo(agora).filter((e) => estaAtivo(e, agora)), origem: "exemplo" };
  }
}

/** Junta uma ocorrência nova (ou atualizada) à lista, sem duplicar o id. */
export function mesclar(lista: readonly Evento[], novo: Evento): Evento[] {
  const i = lista.findIndex((e) => e.id === novo.id);
  if (i === -1) return [novo, ...lista];
  const copia = [...lista];
  copia[i] = novo;
  return copia;
}

/**
 * Assina o Supabase Realtime (INSERT e UPDATE na tabela `events`).
 * Sem URL/chave configuradas ou se a conexão cair, avisa por `aoStatus("falhou")` e o hook volta a recarregar a cada 30 s.
 */
export async function assinarTempoReal(
  aoEvento: (e: Evento) => void,
  aoStatus: (s: "ligado" | "falhou") => void,
): Promise<() => void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    aoStatus("falhou");
    return () => {};
  }
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const cliente = createClient(url, chave);
    const canal = cliente
      .channel("ocorrencias-ao-vivo")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (p) => {
        const e = lerLinhaDoBanco(p.new);
        if (e) aoEvento(e);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") aoStatus("ligado");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") aoStatus("falhou");
      });
    return () => {
      void cliente.removeChannel(canal);
    };
  } catch {
    aoStatus("falhou");
    return () => {};
  }
}

/* ---------- Busca de lugares ---------- */

export interface Lugar {
  nome: string;
  lat: number;
  lng: number;
  bairro?: string;
}

const esquemaLugares = z.array(
  z.object({ nome: z.string().min(1).max(200), lat: z.number(), lng: z.number(), bairro: z.string().max(80).optional() }),
);

/** Procura primeiro na lista local de bairros e depois no geocodificador do servidor. Só devolve lugares dentro do Rio. */
export async function buscarLugares(texto: string): Promise<Lugar[]> {
  const q = texto.trim().slice(0, 120);
  if (q.length < 2) return [];
  const resultado: Lugar[] = [];
  const local = resolverBairro(q);
  if (local) resultado.push({ nome: local.nome, lat: local.lat, lng: local.lng, bairro: local.nome });
  if (q.length >= 3) {
    try {
      const remoto = esquemaLugares.parse(await pedir(`/api/geocodificar?q=${encodeURIComponent(q)}`));
      for (const l of remoto) {
        if (dentroDoRio(l.lat, l.lng) && !resultado.some((r) => r.nome === l.nome)) resultado.push(l);
      }
    } catch {
      // Sem geocodificador: a busca segue só com a lista local.
    }
  }
  return resultado.slice(0, 6);
}

/* ---------- Rota A → B ---------- */

export interface Rota {
  /** Pontos da rota em [lat, lng]. */
  caminho: LatLng[];
  distanciaM: number;
  duracaoS: number;
  ocorrencias: Evento[];
  /** Verdadeiro quando é só uma linha reta (servidor de rotas fora do ar). */
  aproximada: boolean;
}

const esquemaRota = z.object({
  geometria: z.object({ type: z.literal("LineString"), coordinates: z.array(z.tuple([z.number(), z.number()])).min(2) }),
  distancia_m: z.number().nonnegative(),
  duracao_s: z.number().nonnegative(),
  ocorrencias: z.array(z.unknown()).default([]),
});

const VELOCIDADE_APROXIMADA_KMH = 30;

export async function calcularRota(
  origem: LatLng,
  destino: LatLng,
  eventos: readonly Evento[],
  agora: Date = new Date(),
): Promise<Resposta<Rota>> {
  try {
    const bruto = await pedir("/api/rota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem: [origem[1], origem[0]], destino: [destino[1], destino[0]] }),
    });
    const r = esquemaRota.parse(bruto);
    const caminho: LatLng[] = r.geometria.coordinates.map(([lng, lat]) => [lat, lng]);
    const doServidor = r.ocorrencias.map(lerLinhaDoBanco).filter((e): e is Evento => e !== null);
    const ocorrencias = doServidor.length > 0 ? doServidor : ocorrenciasNoCaminho(caminho, eventos, agora).map((x) => x.evento);
    return { dados: { caminho, distanciaM: r.distancia_m, duracaoS: r.duracao_s, ocorrencias, aproximada: false }, origem: "servidor" };
  } catch {
    const caminho: LatLng[] = [origem, destino];
    const km = comprimentoKm(caminho);
    return {
      dados: {
        caminho,
        distanciaM: Math.round(km * 1000),
        duracaoS: Math.round((km / VELOCIDADE_APROXIMADA_KMH) * 3600),
        ocorrencias: ocorrenciasNoCaminho(caminho, eventos, agora).map((x) => x.evento),
        aproximada: true,
      },
      origem: "exemplo",
    };
  }
}

/* ---------- Reportes ---------- */

export interface NovoReporte {
  texto: string;
  tipo?: EventoTipo;
  lat: number;
  lng: number;
  dispositivo: string;
}

export const LIMITE_TEXTO = 280;
export const MIN_TEXTO = 5;

const esquemaReporte = z.object({
  decisao: z.enum(["publicar", "juntar", "recusar"]),
  evento: z.unknown().optional(),
  motivo: z.string().max(300).optional(),
});

export interface ResultadoReporte {
  decisao: "publicar" | "juntar" | "recusar";
  evento?: Evento;
  motivo?: string;
}

/** Erro de validação que a tela mostra como está (texto já escrito para a pessoa). */
export function validarReporte(r: Pick<NovoReporte, "texto" | "lat" | "lng">): string | null {
  const n = r.texto.trim().length;
  if (n < MIN_TEXTO) return `Conte um pouco mais: escreva pelo menos ${MIN_TEXTO} caracteres.`;
  if (n > LIMITE_TEXTO) return `O texto passou de ${LIMITE_TEXTO} caracteres.`;
  if (!dentroDoRio(r.lat, r.lng)) return "O ponto está fora do Rio de Janeiro. Mova o alfinete para dentro da cidade.";
  return null;
}

export async function enviarReporte(r: NovoReporte, agora: Date = new Date()): Promise<Resposta<ResultadoReporte>> {
  const erro = validarReporte(r);
  if (erro) throw new Error(erro);
  try {
    const bruto = await pedir("/api/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, texto: r.texto.trim() }),
    });
    const resp = esquemaReporte.parse(bruto);
    return {
      dados: { decisao: resp.decisao, evento: resp.evento ? (lerLinhaDoBanco(resp.evento) ?? undefined) : undefined, motivo: resp.motivo },
      origem: "servidor",
    };
  } catch (e) {
    if (e instanceof Error && /^HTTP 4\d\d$/.test(e.message) && e.message !== "HTTP 404") {
      throw new Error("Não conseguimos enviar o reporte agora. Confira os dados e tente de novo.");
    }
    // Plano B (servidor ainda sem a rota): o reporte aparece só neste aparelho, marcado como exemplo.
    const tipo: EventoTipo = r.tipo && ehTipo(r.tipo) ? r.tipo : "outro";
    const inicio = agora.toISOString();
    const evento: Evento = {
      id: `local-${agora.getTime()}`,
      tipo,
      categoria: categoriaDo(tipo),
      titulo: TIPOS[tipo].rotulo,
      bairro: resolverBairroMaisPerto(r.lat, r.lng),
      lat: r.lat,
      lng: r.lng,
      inicio,
      expira_em: new Date(agora.getTime() + TIPOS[tipo].validadeH * 3_600_000).toISOString(),
      fonte: "Usuários",
      origem: "usuario",
      confianca: "relato",
      severidade: 1,
      confirmacoes: 1,
      exemplo: true,
    };
    return { dados: { decisao: "publicar", evento }, origem: "exemplo" };
  }
}

import { BAIRROS } from "./bairros";
import { distanciaKm } from "./geo";

/** Bairro da lista local mais perto do ponto (a triagem do servidor usa os polígonos reais). */
export function resolverBairroMaisPerto(lat: number, lng: number): string {
  let melhor = "Rio de Janeiro";
  let menor = Number.POSITIVE_INFINITY;
  for (const b of BAIRROS) {
    const d = distanciaKm([lat, lng], [b.lat, b.lng]);
    if (d < menor) {
      menor = d;
      melhor = b.nome;
    }
  }
  return melhor;
}
