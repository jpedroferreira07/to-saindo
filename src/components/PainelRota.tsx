"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { calcularRota, type Lugar, type Rota } from "@/lib/api";
import type { Evento } from "@/lib/eventos";
import { MODOS, type ModoId } from "@/lib/modos";
import { BuscaLocal } from "./BuscaLocal";
import { CartaoOcorrencia } from "./CartaoOcorrencia";
import { Icone } from "./icones";

interface Props {
  eventos: readonly Evento[];
  agora: Date | null;
  modo: ModoId;
  /** Escolher o meio toca o som dele (decisão no App, que guarda o gerente de som). */
  onModo: (modo: ModoId) => void;
  onRota: (rota: Rota | null) => void;
  onVerNoMapa: (evento: Evento) => void;
  onUsarLocalizacao: () => Promise<Lugar | null>;
  onFechar: () => void;
}

/** Meios sem rota própria no servidor de rotas: o mapa mostra a linha direta entre os pontos. */
const SEM_ROTA_PROPRIA: readonly ModoId[] = ["metro", "vlt", "trem", "barca"];

function formatarDuracao(s: number): string {
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
}

/** "Como chegar": origem, destino, meio de transporte, rota no mapa e as ocorrências do caminho. */
export function PainelRota({ eventos, agora, modo, onModo, onRota, onVerNoMapa, onUsarLocalizacao, onFechar }: Props) {
  const [origem, setOrigem] = useState<Lugar | null>(null);
  const [destino, setDestino] = useState<Lugar | null>(null);
  const [origemExterna, setOrigemExterna] = useState<Lugar | null>(null);
  const [rota, setRota] = useState<Rota | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [aviso, setAviso] = useState("");
  const chips = useRef<Array<HTMLButtonElement | null>>([]);

  async function tracar() {
    if (!origem || !destino) {
      setAviso("Escolha a origem e o destino na lista de sugestões.");
      return;
    }
    setCalculando(true);
    setAviso("");
    const r = await calcularRota([origem.lat, origem.lng], [destino.lat, destino.lng], eventos, agora ?? new Date());
    setRota(r.dados);
    onRota(r.dados);
    setCalculando(false);
  }

  async function usarMinhaLocalizacao() {
    setAviso("");
    const l = await onUsarLocalizacao();
    if (l) {
      setOrigem(l);
      setOrigemExterna(l);
    } else {
      setAviso("Não consegui usar a sua localização. Digite o ponto de partida.");
    }
  }

  function limparRota() {
    setRota(null);
    onRota(null);
  }

  function teclas(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = MODOS.length;
    let alvo = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") alvo = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") alvo = (i - 1 + n) % n;
    else if (e.key === "Home") alvo = 0;
    else if (e.key === "End") alvo = n - 1;
    if (alvo < 0) return;
    e.preventDefault();
    onModo(MODOS[alvo].id);
    chips.current[alvo]?.focus();
  }

  return (
    <section className="folha folha--rota" aria-labelledby="rota-titulo">
      <div className="folha__topo">
        <h2 id="rota-titulo">Como chegar</h2>
        <button type="button" className="botao-icone" onClick={onFechar} aria-label="Fechar o painel de rota">
          <Icone id="fechar" />
        </button>
      </div>

      <div className="rota__campos">
        <BuscaLocal rotulo="De onde" placeholder="Ex.: Campo Grande" onEscolher={setOrigem} onLimpar={() => { setOrigem(null); limparRota(); }} valorExterno={origemExterna} />
        <button type="button" className="botao botao--contorno botao--pequeno" onClick={usarMinhaLocalizacao}>
          <Icone id="local" />
          Usar minha localização
        </button>
        <BuscaLocal rotulo="Para onde" placeholder="Ex.: Centro" onEscolher={setDestino} onLimpar={() => { setDestino(null); limparRota(); }} />
      </div>

      <div role="radiogroup" aria-label="Como você vai" className="meios">
        {MODOS.map((m, i) => (
          <button
            key={m.id}
            ref={(el) => {
              chips.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={modo === m.id}
            tabIndex={modo === m.id ? 0 : -1}
            className="meio"
            onClick={() => onModo(m.id)}
            onKeyDown={(e) => teclas(e, i)}
          >
            <Icone id={m.id} />
            <span>{m.rotulo}</span>
          </button>
        ))}
      </div>

      <div className="botoes">
        <button type="button" className="botao botao--led" onClick={tracar} disabled={calculando}>
          <Icone id="rota" />
          {calculando ? "Calculando…" : "Traçar rota"}
        </button>
      </div>
      <p className="retorno" role="status">
        {aviso}
      </p>

      {rota && (
        <div className="rota__resultado">
          <p className="rota__resumo">
            <strong>{(rota.distanciaM / 1000).toFixed(1).replace(".", ",")} km</strong> · cerca de{" "}
            <strong>{formatarDuracao(rota.duracaoS)}</strong>
          </p>
          <p className="nota">
            Tempo estimado, sem trânsito em tempo real.
            {rota.aproximada && " Servidor de rotas indisponível: mostramos a linha direta entre os dois pontos."}
            {!rota.aproximada && SEM_ROTA_PROPRIA.includes(modo) && " Para este meio mostramos o trajeto de carro como referência."}
          </p>
          <h3 className="rota__subtitulo">
            No caminho: {rota.ocorrencias.length} {rota.ocorrencias.length === 1 ? "ocorrência" : "ocorrências"}
          </h3>
          {rota.ocorrencias.length === 0 ? (
            <p className="apoio">Nenhuma ocorrência ativa a menos de 500 m da rota. Sem dados, a gente não inventa.</p>
          ) : (
            <ul className="lista-cartoes">
              {rota.ocorrencias.map((e) => (
                <li key={e.id}>
                  <CartaoOcorrencia
                    evento={e}
                    agora={agora}
                    compacto
                    acoes={
                      <button type="button" className="botao botao--contorno botao--pequeno" onClick={() => onVerNoMapa(e)}>
                        Ver no mapa
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
