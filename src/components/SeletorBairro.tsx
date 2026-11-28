"use client";

import { useId } from "react";
import { BAIRROS } from "@/lib/bairros";
import { slugDoBairro } from "@/lib/filtros";

const ORDENADOS = [...BAIRROS].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

/** Bairro escolhido, o mesmo nas duas abas. Valor vazio = cidade toda. */
export function SeletorBairro({ valor, onMudar, oculto = false }: { valor: string | null; onMudar: (slug: string | null) => void; oculto?: boolean }) {
  const id = useId();
  return (
    <div className="campo campo--bairro">
      <label htmlFor={id} className={oculto ? "so-leitor" : undefined}>
        Bairro
      </label>
      <select id={id} value={valor ?? ""} onChange={(e) => onMudar(e.target.value || null)}>
        <option value="">Cidade toda</option>
        {ORDENADOS.map((b) => (
          <option key={b.nome} value={slugDoBairro(b.nome)}>
            {b.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
