"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assinarTempoReal, listarOcorrencias, mesclar, type OrigemDosDados } from "./api";
import { estaAtivo, type Evento } from "./eventos";

const RECARGA_SEM_TEMPO_REAL_MS = 30_000;
const RECARGA_COM_TEMPO_REAL_MS = 120_000;
const RELOGIO_MS = 30_000;

export interface EstadoOcorrencias {
  /** Só as ativas (as expiradas saem sozinhas a cada 30 s). */
  eventos: Evento[];
  origem: OrigemDosDados | null;
  carregando: boolean;
  /** O Supabase Realtime está ligado? Se não, a lista é recarregada a cada 30 s. */
  tempoReal: boolean;
  agora: Date | null;
  recarregar: () => Promise<void>;
  /** Plano B: guarda um reporte que só existe neste aparelho. */
  adicionarLocal: (e: Evento) => void;
}

/** Ocorrências de agora: carga inicial, tempo real (Supabase) e recarga periódica como plano B. */
export function useOcorrencias(): EstadoOcorrencias {
  const [lista, setLista] = useState<Evento[]>([]);
  const [origem, setOrigem] = useState<OrigemDosDados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tempoReal, setTempoReal] = useState(false);
  const [agora, setAgora] = useState<Date | null>(null);
  const vivo = useRef(true);

  // Carga silenciosa: não liga o "carregando" de forma síncrona (usada pelos efeitos).
  const carregar = useCallback(async () => {
    const r = await listarOcorrencias();
    if (!vivo.current) return;
    // Reportes locais (plano B) sobrevivem à recarga.
    setLista((anterior) => [...anterior.filter((e) => e.id.startsWith("local-")), ...r.dados]);
    setOrigem(r.origem);
    setAgora(new Date());
    setCarregando(false);
  }, []);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    await carregar();
  }, [carregar]);

  useEffect(() => {
    vivo.current = true;
    void carregar();
    let cancelar: (() => void) | null = null;
    void assinarTempoReal(
      (e) => {
        if (!vivo.current) return;
        setLista((l) => mesclar(l, e));
        setOrigem("servidor");
      },
      (s) => {
        if (vivo.current) setTempoReal(s === "ligado");
      },
    ).then((fn) => {
      if (vivo.current) cancelar = fn;
      else fn();
    });
    return () => {
      vivo.current = false;
      cancelar?.();
    };
  }, [carregar]);

  useEffect(() => {
    const t = setInterval(() => void carregar(), tempoReal ? RECARGA_COM_TEMPO_REAL_MS : RECARGA_SEM_TEMPO_REAL_MS);
    return () => clearInterval(t);
  }, [tempoReal, carregar]);

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), RELOGIO_MS);
    return () => clearInterval(t);
  }, []);

  const adicionarLocal = useCallback((e: Evento) => setLista((l) => mesclar(l, e)), []);
  const eventos = useMemo(() => (agora ? lista.filter((e) => estaAtivo(e, agora)) : []), [lista, agora]);

  return { eventos, origem, carregando, tempoReal, agora, recarregar, adicionarLocal };
}
