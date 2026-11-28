const CHAVE = "to-saindo:dispositivo";
const CHAVE_ENVIOS = "to-saindo:envios";

/** Janela e limite de reportes por aparelho (espelha a proteção do servidor, só para avisar cedo). */
export const MAX_REPORTES = 5;
export const JANELA_REPORTES_MS = 10 * 60_000;

function guardar(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // modo privado ou bloqueado
  }
}

function aleatorio(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Identificador aleatório deste aparelho (não identifica a pessoa). O servidor guarda só o hash. */
export function obterDispositivo(): string {
  const s = guardar();
  if (!s) return aleatorio();
  let id = s.getItem(CHAVE);
  if (!id || id.length < 8 || id.length > 80) {
    id = aleatorio();
    try {
      s.setItem(CHAVE, id);
    } catch {
      // sem armazenamento: o id vale só nesta visita
    }
  }
  return id;
}

function lerEnvios(s: Storage | null, agora: number): number[] {
  try {
    const lista: unknown = JSON.parse(s?.getItem(CHAVE_ENVIOS) ?? "[]");
    return Array.isArray(lista) ? lista.filter((t): t is number => typeof t === "number" && agora - t < JANELA_REPORTES_MS) : [];
  } catch {
    return [];
  }
}

/** Quantos minutos faltam para poder reportar de novo, ou 0 se já pode. */
export function esperaParaReportar(agora: number = Date.now()): number {
  const envios = lerEnvios(guardar(), agora);
  if (envios.length < MAX_REPORTES) return 0;
  return Math.max(1, Math.ceil((envios[0] + JANELA_REPORTES_MS - agora) / 60_000));
}

export function registrarEnvio(agora: number = Date.now()): void {
  const s = guardar();
  if (!s) return;
  try {
    s.setItem(CHAVE_ENVIOS, JSON.stringify([...lerEnvios(s, agora), agora]));
  } catch {
    // sem armazenamento: o servidor continua limitando
  }
}

/** Apaga tudo que o site guardou neste navegador (comando "apagar meus dados"). */
export function apagarDadosLocais(): number {
  const s = guardar();
  if (!s) return 0;
  const chaves: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.key(i);
    if (c?.startsWith("to-saindo:")) chaves.push(c);
  }
  chaves.forEach((c) => s.removeItem(c));
  return chaves.length;
}
