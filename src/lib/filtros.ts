import { BAIRROS, normalizar, type Bairro } from "./bairros";
import type { Evento } from "./eventos";
import { ehTipo, type EventoTipo } from "./tipos";

export type Aba = "mapa" | "feed";

/** Estado compartilhado entre as abas. Vive na URL (`?aba=feed&bairro=tijuca&tipos=chuva,buraco`) para dar para compartilhar. */
export interface Filtros {
  aba: Aba;
  /** Slug do bairro (`tijuca`, `campo-grande`) ou null para a cidade toda. */
  bairro: string | null;
  tipos: EventoTipo[];
}

export const FILTROS_PADRAO: Filtros = { aba: "mapa", bairro: null, tipos: [] };

export function slugDoBairro(nome: string): string {
  return normalizar(nome).replace(/ /g, "-");
}

export function bairroPorSlug(slug: string | null): Bairro | null {
  if (!slug) return null;
  return BAIRROS.find((b) => slugDoBairro(b.nome) === slug) ?? null;
}

interface FonteDeParametros {
  get(nome: string): string | null;
}

/** Lê os filtros da URL. Qualquer valor estranho cai no padrão (a URL é entrada não confiável). */
export function lerFiltros(params: FonteDeParametros): Filtros {
  const aba: Aba = params.get("aba") === "feed" ? "feed" : "mapa";
  const slug = params.get("bairro");
  const bairro = slug && /^[a-z0-9-]{2,60}$/.test(slug) ? slug : null;
  const tipos = (params.get("tipos") ?? "")
    .split(",")
    .filter(ehTipo)
    .filter((t, i, todos) => todos.indexOf(t) === i);
  return { aba, bairro, tipos };
}

/** Monta a query string só com o que foge do padrão (sem o `?`). */
export function paraQuery(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.aba === "feed") p.set("aba", "feed");
  if (f.bairro) p.set("bairro", f.bairro);
  if (f.tipos.length > 0) p.set("tipos", f.tipos.join(","));
  return p.toString();
}

/** Aplica bairro e tipos. Lista de tipos vazia = todos os tipos. */
export function filtrarEventos(eventos: readonly Evento[], f: Pick<Filtros, "bairro" | "tipos">): Evento[] {
  return eventos.filter(
    (e) =>
      (!f.bairro || slugDoBairro(e.bairro) === f.bairro) && (f.tipos.length === 0 || f.tipos.includes(e.tipo)),
  );
}

/** Do mais novo para o mais antigo, pela hora do ocorrido. */
export function maisNovosPrimeiro(eventos: readonly Evento[]): Evento[] {
  return [...eventos].sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));
}
