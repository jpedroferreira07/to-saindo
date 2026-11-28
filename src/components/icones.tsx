import type { SVGProps } from "react";
import { TRACOS, type IconeId } from "@/lib/icones-dados";
import type { Confianca } from "@/lib/tipos";

type Props = Omit<SVGProps<SVGSVGElement>, "id" | "children" | "dangerouslySetInnerHTML"> & { id: IconeId };

/**
 * Ícone de traço que herda a cor do texto. Fica fora da árvore de acessibilidade:
 * o significado sempre vem do texto ao lado (rótulo), nunca só do ícone.
 * O markup vem de constantes do código (`TRACOS`), nunca de entrada do usuário.
 */
export function Icone({ id, ...resto }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
      dangerouslySetInnerHTML={{ __html: TRACOS[id] }}
    />
  );
}

/** Confiança por forma, além da cor: círculo com visto (oficial), losango (confirmado), círculo tracejado (não confirmado). */
export function IconeConfianca({ confianca, ...resto }: Omit<Props, "id"> & { confianca: Confianca }) {
  return <Icone id={`conf-${confianca}`} {...resto} />;
}
