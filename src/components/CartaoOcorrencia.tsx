import type { ReactNode } from "react";
import { horaDoRio, haQuanto, type Evento } from "@/lib/eventos";
import { COR_CATEGORIA, CONFIANCA_ROTULO, ROTULO_CATEGORIA, TIPOS } from "@/lib/tipos";
import { Icone, IconeConfianca } from "./icones";

interface Props {
  evento: Evento;
  agora: Date | null;
  /** Texto curto para pins e listas pequenas. */
  compacto?: boolean;
  /** Botões do cartão (ex.: "Ver no mapa"). */
  acoes?: ReactNode;
  titulo?: "h2" | "h3" | "p";
}

/**
 * Uma ocorrência com tipo (ícone + rótulo), bairro, horário, fonte e confiança (forma + rótulo).
 * Cor nunca é o único sinal.
 */
export function CartaoOcorrencia({ evento, agora, compacto = false, acoes, titulo: Titulo = "h3" }: Props) {
  const info = TIPOS[evento.tipo];
  const cor = COR_CATEGORIA[evento.categoria];
  return (
    <article className="cartao" style={{ ["--cor" as string]: cor }}>
      <Icone id={evento.tipo} className="cartao__icone" />
      <div className="cartao__corpo">
        <span className="cartao__tipo">
          {ROTULO_CATEGORIA[evento.categoria]} · {info.rotulo}
        </span>
        <Titulo className="cartao__titulo">{evento.titulo}</Titulo>
        <p className="cartao__meta">
          <span>{evento.bairro}</span>
          <span>
            {agora ? `${haQuanto(evento.inicio, agora)} · ` : ""}registrado às {horaDoRio(evento.inicio)}
          </span>
          {!compacto && (
            <span>
              Fonte:{" "}
              {evento.url ? (
                <a href={evento.url} target="_blank" rel="noopener noreferrer">
                  {evento.fonte}
                  <span className="so-leitor"> (abre em nova aba)</span>
                </a>
              ) : (
                evento.fonte
              )}
            </span>
          )}
          <span className="confianca">
            <IconeConfianca confianca={evento.confianca} />
            {CONFIANCA_ROTULO[evento.confianca]}
          </span>
          {evento.confirmacoes > 1 && <span>{evento.confirmacoes} confirmações</span>}
          {evento.exemplo && <span className="selo-exemplo">exemplo</span>}
        </p>
        {acoes && <div className="cartao__acoes">{acoes}</div>}
      </div>
    </article>
  );
}
