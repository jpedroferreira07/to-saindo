"use client";

import { useState } from "react";
import type { OrigemDosDados } from "@/lib/api";
import type { Evento } from "@/lib/eventos";
import { bairroPorSlug, filtrarEventos, maisNovosPrimeiro, type Filtros } from "@/lib/filtros";
import { COR_CATEGORIA, LISTA_TIPOS, TIPOS, type EventoTipo } from "@/lib/tipos";
import { CartaoOcorrencia } from "./CartaoOcorrencia";
import { Icone } from "./icones";
import { SeletorBairro } from "./SeletorBairro";

interface Props {
  eventos: readonly Evento[];
  agora: Date | null;
  filtros: Pick<Filtros, "bairro" | "tipos">;
  onFiltros: (f: Partial<Pick<Filtros, "bairro" | "tipos">>) => void;
  origem: OrigemDosDados | null;
  carregando: boolean;
  tempoReal: boolean;
  onTentarDeNovo: () => void;
  onVerNoMapa: (e: Evento) => void;
}

/** Feed de alertas em texto: o mais novo primeiro. É também a alternativa acessível ao mapa. */
export function Feed({ eventos, agora, filtros, onFiltros, origem, carregando, tempoReal, onTentarDeNovo, onVerNoMapa }: Props) {
  const filtrados = maisNovosPrimeiro(filtrarEventos(eventos, filtros));

  // "N novos alertas": a lista que a pessoa está lendo não pula quando chegam itens; ela decide quando atualizar.
  const chave = `${filtros.bairro ?? ""}|${filtros.tipos.join(",")}`;
  const [lida, setLida] = useState<{ chave: string; ids: Set<string> } | null>(null);
  let base = lida;
  if ((!base || base.chave !== chave) && !carregando) {
    base = { chave, ids: new Set(filtrados.map((e) => e.id)) };
    setLida(base);
  }
  const ids = base?.ids ?? new Set<string>();
  const novos = filtrados.filter((e) => !ids.has(e.id));
  const visiveis = filtrados.filter((e) => ids.has(e.id));
  const bairro = bairroPorSlug(filtros.bairro);

  function alternarTipo(tipo: EventoTipo) {
    const tem = filtros.tipos.includes(tipo);
    onFiltros({ tipos: tem ? filtros.tipos.filter((t) => t !== tipo) : [...filtros.tipos, tipo] });
  }

  return (
    <div className="feed">
      <div className="feed__filtros">
        <SeletorBairro valor={filtros.bairro} onMudar={(b) => onFiltros({ bairro: b })} />
        <fieldset className="chips-tipo">
          <legend>Tipo de ocorrência</legend>
          <div className="chips-tipo__lista">
            {LISTA_TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                className="filtro"
                aria-pressed={filtros.tipos.includes(t)}
                style={{ ["--cor" as string]: COR_CATEGORIA[TIPOS[t].categoria] }}
                onClick={() => alternarTipo(t)}
              >
                <Icone id={t} />
                {TIPOS[t].rotulo}
              </button>
            ))}
            {filtros.tipos.length > 0 && (
              <button type="button" className="filtro filtro--limpar" onClick={() => onFiltros({ tipos: [] })}>
                Limpar tipos
              </button>
            )}
          </div>
        </fieldset>
      </div>

      <p className="feed__estado" role="status">
        {origem === "exemplo" && !carregando && (
          <span>
            Sem conexão com o servidor: mostrando <strong>avisos de exemplo</strong>.{" "}
            <button type="button" className="link-botao" onClick={onTentarDeNovo}>
              Tentar de novo
            </button>
          </span>
        )}
        {origem === "servidor" && <span>{tempoReal ? "Atualizando em tempo real." : "Atualiza a cada 30 segundos."}</span>}
      </p>

      {novos.length > 0 && (
        <button type="button" className="botao botao--led feed__novos" onClick={() => setLida({ chave, ids: new Set(filtrados.map((e) => e.id)) })}>
          {novos.length === 1 ? "1 novo alerta" : `${novos.length} novos alertas`}
        </button>
      )}

      <h2 className="so-leitor">
        {visiveis.length} {visiveis.length === 1 ? "ocorrência ativa" : "ocorrências ativas"}
        {bairro ? ` em ${bairro.nome}` : " no Rio"}
      </h2>

      {carregando && eventos.length === 0 ? (
        <p className="apoio">Carregando as ocorrências…</p>
      ) : visiveis.length === 0 ? (
        <p className="apoio feed__vazio">
          Nenhuma ocorrência ativa{bairro ? ` em ${bairro.nome}` : ""} agora. Sem dados, a gente não inventa.
        </p>
      ) : (
        <ul className="lista-cartoes">
          {visiveis.map((e) => (
            <li key={e.id}>
              <CartaoOcorrencia
                evento={e}
                agora={agora}
                acoes={
                  <button type="button" className="botao botao--contorno botao--pequeno" onClick={() => onVerNoMapa(e)}>
                    <Icone id="mapa" />
                    Ver no mapa
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
