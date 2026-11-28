"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { enviarReporte, LIMITE_TEXTO, MIN_TEXTO, validarReporte, type ResultadoReporte } from "@/lib/api";
import { esperaParaReportar, obterDispositivo, registrarEnvio } from "@/lib/dispositivo";
import type { Evento } from "@/lib/eventos";
import { COR_CATEGORIA, LISTA_TIPOS, TIPOS, type EventoTipo } from "@/lib/tipos";
import { Icone } from "./icones";

export interface LocalDoReporte {
  lat: number;
  lng: number;
  /** Texto para a pessoa conferir ("Perto de Tijuca"). */
  descricao: string;
}

interface Props {
  aberto: boolean;
  local: LocalDoReporte | null;
  onFechar: () => void;
  onEscolherNoMapa: () => void;
  /** O reporte foi aceito: a ocorrência vai para o mapa e o feed. */
  onPublicado: (evento: Evento, origem: "servidor" | "exemplo") => void;
  onVerNoMapa: (evento: Evento) => void;
}

/**
 * Formulário de reporte em um diálogo nativo (foco preso e Esc de graça):
 * tipo (opcional), descrição curta e local no mapa. Mostra a decisão do agente: publicar, juntar ou recusar.
 */
export function Reportar({ aberto, local, onFechar, onEscolherNoMapa, onPublicado, onVerNoMapa }: Props) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [tipo, setTipo] = useState<EventoTipo | undefined>(undefined);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ r: ResultadoReporte; origem: "servidor" | "exemplo" } | null>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  function reiniciar() {
    setTipo(undefined);
    setTexto("");
    setErro("");
    setResultado(null);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!local) {
      setErro("Escolha o local no mapa antes de enviar.");
      return;
    }
    const invalido = validarReporte({ texto, lat: local.lat, lng: local.lng });
    if (invalido) {
      setErro(invalido);
      return;
    }
    const espera = esperaParaReportar();
    if (espera > 0) {
      setErro(`Você já enviou ${5} reportes há pouco. Tente de novo em ${espera} min.`);
      return;
    }
    setEnviando(true);
    try {
      const resp = await enviarReporte({ texto, tipo, lat: local.lat, lng: local.lng, dispositivo: obterDispositivo() });
      registrarEnvio();
      setResultado({ r: resp.dados, origem: resp.origem });
      if (resp.dados.decisao !== "recusar" && resp.dados.evento) onPublicado(resp.dados.evento, resp.origem);
    } catch (e2) {
      setErro(e2 instanceof Error ? e2.message : "Não conseguimos enviar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function fechar() {
    onFechar();
    if (resultado) reiniciar();
  }

  const restantes = LIMITE_TEXTO - texto.length;
  return (
    <dialog ref={dialogo} className="dialogo" aria-labelledby={`${id}-t`} onClose={fechar} onCancel={fechar}>
      <div className="folha__topo">
        <h2 id={`${id}-t`}>Reportar uma ocorrência</h2>
        <button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar">
          <Icone id="fechar" />
        </button>
      </div>

      {resultado ? (
        <div className="reporte__resultado" role="status">
          <p className="reporte__mensagem">
            {resultado.r.decisao === "publicar" && "Publicado como não confirmado. Obrigado!"}
            {resultado.r.decisao === "juntar" && "Já tinha um reporte disso aqui perto. Contamos o seu como confirmação."}
            {resultado.r.decisao === "recusar" && `Não publicamos: ${resultado.r.motivo ?? "o reporte não se encaixa nas regras do mapa."}`}
          </p>
          {resultado.origem === "exemplo" && (
            <p className="nota">Modo de exemplo: o servidor ainda não respondeu, então este reporte aparece só neste aparelho.</p>
          )}
          <div className="botoes">
            {resultado.r.evento && (
              <button
                type="button"
                className="botao botao--led"
                onClick={() => {
                  onVerNoMapa(resultado.r.evento as Evento);
                  fechar();
                }}
              >
                Ver no mapa
              </button>
            )}
            <button type="button" className="botao botao--contorno" onClick={fechar}>
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <fieldset className="caixa">
            <legend>O que você viu? (opcional)</legend>
            <div role="radiogroup" aria-label="Tipo de ocorrência" className="grade-tipos">
              <button type="button" role="radio" aria-checked={tipo === undefined} className="tipo-opcao" onClick={() => setTipo(undefined)}>
                <Icone id="outro" />
                <span>O agente decide</span>
              </button>
              {LISTA_TIPOS.filter((t) => t !== "outro").map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tipo === t}
                  className="tipo-opcao"
                  style={{ ["--cor" as string]: COR_CATEGORIA[TIPOS[t].categoria] }}
                  onClick={() => setTipo(t)}
                >
                  <Icone id={t} />
                  <span>{TIPOS[t].rotulo}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="campo">
            <label htmlFor={`${id}-texto`}>Descreva em poucas palavras</label>
            <textarea
              id={`${id}-texto`}
              rows={4}
              maxLength={LIMITE_TEXTO}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              aria-describedby={`${id}-dica ${id}-conta`}
              aria-invalid={erro !== "" && texto.trim().length < MIN_TEXTO}
              placeholder="Ex.: árvore caída na Rua Conde de Bonfim, bloqueando uma faixa"
            />
            <p id={`${id}-dica`} className="nota">
              O que você viu e onde? Não escreva nomes, placas ou descrição de pessoas.
            </p>
            <p id={`${id}-conta`} className="nota" aria-live="polite">
              {restantes} {restantes === 1 ? "caractere restante" : "caracteres restantes"}
            </p>
          </div>

          <div className="reporte__local">
            <p>
              <Icone id="pin" /> {local ? <strong>{local.descricao}</strong> : "Local ainda não escolhido"}
            </p>
            <button type="button" className="botao botao--contorno botao--pequeno" onClick={onEscolherNoMapa}>
              {local ? "Mudar no mapa" : "Escolher no mapa"}
            </button>
          </div>

          <p className="retorno retorno--erro" role="alert">
            {erro}
          </p>
          <div className="botoes">
            <button type="submit" className="botao botao--led" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar reporte"}
            </button>
            <button type="button" className="botao botao--contorno" onClick={fechar}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
