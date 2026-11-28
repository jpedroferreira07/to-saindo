"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { buscarLugares, type Lugar } from "@/lib/api";
import { Icone } from "./icones";

interface Props {
  rotulo: string;
  placeholder: string;
  /** Mostra o rótulo só para leitores de tela (a busca do topo do mapa). */
  rotuloOculto?: boolean;
  onEscolher: (lugar: Lugar) => void;
  /** Chamado quando a pessoa volta a editar depois de escolher. */
  onLimpar?: () => void;
  /** Lugar definido de fora (ex.: "Minha localização"): preenche o campo. */
  valorExterno?: Lugar | null;
}

const ESPERA_MS = 350;

/**
 * Campo único de busca: bairro, endereço ou ponto conhecido. Primeiro a lista local de bairros,
 * depois o geocodificador do servidor (sempre dentro do Rio). Padrão "combobox" com teclado.
 */
export function BuscaLocal({ rotulo, placeholder, rotuloOculto = false, onEscolher, onLimpar, valorExterno }: Props) {
  const id = useId();
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState<Lugar[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const [escolhido, setEscolhido] = useState(false);
  const pedido = useRef(0);

  // Lugar vindo de fora: mostra o nome e marca como escolhido.
  const [ultimoExterno, setUltimoExterno] = useState<Lugar | null>(null);
  if (valorExterno && valorExterno !== ultimoExterno) {
    setUltimoExterno(valorExterno);
    setTexto(valorExterno.nome);
    setEscolhido(true);
    setAberto(false);
  }

  useEffect(() => {
    if (escolhido || texto.trim().length < 2) return;
    const numero = ++pedido.current;
    const t = setTimeout(async () => {
      setBuscando(true);
      const r = await buscarLugares(texto);
      if (numero !== pedido.current) return; // chegou uma busca mais nova
      setSugestoes(r);
      setAtivo(r.length > 0 ? 0 : -1);
      setAberto(true);
      setBuscando(false);
    }, ESPERA_MS);
    return () => clearTimeout(t);
  }, [texto, escolhido]);

  function escolher(l: Lugar) {
    pedido.current++;
    setTexto(l.nome);
    setEscolhido(true);
    setAberto(false);
    setBuscando(false);
    onEscolher(l);
  }

  function editar(valor: string) {
    setTexto(valor);
    if (escolhido) {
      setEscolhido(false);
      onLimpar?.();
    }
    if (valor.trim().length < 2) {
      pedido.current++;
      setSugestoes([]);
      setAberto(false);
      setBuscando(false);
    }
  }

  async function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && sugestoes.length > 0) {
      e.preventDefault();
      setAberto(true);
      setAtivo((a) => (a + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp" && sugestoes.length > 0) {
      e.preventDefault();
      setAtivo((a) => (a - 1 + sugestoes.length) % sugestoes.length);
    } else if (e.key === "Escape") {
      setAberto(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (aberto && ativo >= 0 && sugestoes[ativo]) escolher(sugestoes[ativo]);
      else if (!escolhido && texto.trim().length >= 2) {
        const r = await buscarLugares(texto);
        if (r[0]) escolher(r[0]);
        else setSugestoes([]);
      }
    }
  }

  const lista = `${id}-lista`;
  return (
    <div className="busca">
      <label htmlFor={`${id}-campo`} className={rotuloOculto ? "so-leitor" : "busca__rotulo"}>
        {rotulo}
      </label>
      <div className="busca__campo">
        <Icone id="busca" className="busca__icone" />
        <input
          id={`${id}-campo`}
          type="search"
          role="combobox"
          aria-expanded={aberto && sugestoes.length > 0}
          aria-controls={lista}
          aria-autocomplete="list"
          aria-activedescendant={aberto && ativo >= 0 ? `${id}-op-${ativo}` : undefined}
          autoComplete="off"
          maxLength={120}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => editar(e.target.value)}
          onKeyDown={teclas}
          onBlur={() => setTimeout(() => setAberto(false), 120)}
          onFocus={() => sugestoes.length > 0 && !escolhido && setAberto(true)}
        />
      </div>
      <ul id={lista} role="listbox" aria-label={`Sugestões para ${rotulo}`} className="busca__lista" hidden={!aberto || sugestoes.length === 0}>
        {sugestoes.map((s, i) => (
          <li
            key={`${s.nome}-${s.lat}`}
            id={`${id}-op-${i}`}
            role="option"
            aria-selected={i === ativo}
            className="busca__opcao"
            onMouseDown={(e) => {
              e.preventDefault();
              escolher(s);
            }}
          >
            <Icone id="pin" />
            <span>
              {s.nome}
              {s.bairro && s.bairro !== s.nome ? <small>{s.bairro}</small> : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="so-leitor" role="status">
        {buscando ? "Buscando…" : aberto ? `${sugestoes.length} ${sugestoes.length === 1 ? "sugestão" : "sugestões"}` : ""}
        {!buscando && !aberto && texto.trim().length >= 3 && !escolhido && sugestoes.length === 0 ? "Nenhum lugar encontrado no Rio." : ""}
      </p>
    </div>
  );
}
