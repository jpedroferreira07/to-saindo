/**
 * Sons dos meios de transporte (docs/design/DIRECAO-VISUAL.md):
 * - só toca por ação da pessoa (nunca sozinho ao abrir a página);
 * - trocar de meio corta o som atual e começa o novo na hora; um som por vez;
 * - botão de mudo, com o estado lembrado;
 * - arquivos carregados só no primeiro clique.
 * Sem som, o destaque visual acontece igual.
 */

export const CHAVE_MUDO = "to-saindo:mudo";

export interface AudioLike {
  src: string;
  currentTime: number;
  preload: string;
  play(): Promise<void>;
  pause(): void;
  addEventListener(tipo: "ended", fn: () => void, opcoes?: { once?: boolean }): void;
  removeEventListener(tipo: "ended", fn: () => void): void;
}

export interface ArmazenamentoLike {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

export class GerenteDeSom {
  private atual: AudioLike | null = null;
  private fim: (() => void) | null = null;
  /** Cada chamada a `tocar` ou `parar` invalida a anterior. */
  private geracao = 0;
  private mudo: boolean;

  constructor(
    private readonly criarAudio: (src: string) => AudioLike = (src) => {
      const a = new Audio(src);
      return a as unknown as AudioLike;
    },
    private readonly armazenamento: ArmazenamentoLike | null = null,
  ) {
    this.mudo = lerMudo(armazenamento);
  }

  estaMudo(): boolean {
    return this.mudo;
  }

  definirMudo(valor: boolean): void {
    this.mudo = valor;
    try {
      this.armazenamento?.setItem(CHAVE_MUDO, valor ? "1" : "0");
    } catch {
      // Armazenamento bloqueado (modo privado): o mudo vale só nesta visita.
    }
    if (valor) this.parar();
  }

  /** Toca a lista de arquivos em sequência, cortando o que estiver tocando. Devolve se começou a tocar. */
  async tocar(arquivos: readonly string[]): Promise<boolean> {
    this.parar();
    if (this.mudo || arquivos.length === 0) return false;
    const minhaGeracao = this.geracao;
    return this.tocarDaLista(arquivos, 0, minhaGeracao);
  }

  parar(): void {
    this.geracao += 1;
    if (this.atual) {
      if (this.fim) this.atual.removeEventListener("ended", this.fim);
      this.atual.pause();
      this.atual.currentTime = 0;
    }
    this.atual = null;
    this.fim = null;
  }

  private async tocarDaLista(arquivos: readonly string[], i: number, geracao: number): Promise<boolean> {
    if (geracao !== this.geracao || i >= arquivos.length) return false;
    const audio = this.criarAudio(arquivos[i]);
    audio.preload = "auto";
    this.atual = audio;
    const proximo = () => {
      void this.tocarDaLista(arquivos, i + 1, geracao);
    };
    this.fim = proximo;
    audio.addEventListener("ended", proximo, { once: true });
    try {
      await audio.play();
      return true;
    } catch {
      // O navegador pode recusar (sem gesto do usuário) ou o arquivo pode faltar: segue sem som.
      if (geracao === this.geracao) this.parar();
      return false;
    }
  }
}

function lerMudo(armazenamento: ArmazenamentoLike | null): boolean {
  try {
    return armazenamento?.getItem(CHAVE_MUDO) === "1";
  } catch {
    return false;
  }
}
