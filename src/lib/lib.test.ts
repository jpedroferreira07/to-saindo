import { describe, expect, it, vi } from "vitest";
import { resolverBairro, normalizar } from "./bairros";
import { carregarEventos, estaAtivo, eventosExemplo, horaDoRio, lerLinhaDoBanco } from "./eventos";
import { distanciaAoSegmentoKm, distanciaKm } from "./geo";
import { MODOS } from "./modos";
import { CHAVE_MUDO, GerenteDeSom, type AudioLike } from "./som";
import { avisosDoTrajeto, resolverTrajeto, textoDoLetreiro } from "./trajeto";

const AGORA = new Date("2026-11-28T09:30:00Z");

describe("eventos", () => {
  it("marca todos os exemplos como fictícios e ativos", () => {
    const lista = eventosExemplo(AGORA);
    expect(lista).toHaveLength(15);
    expect(lista.every((e) => e.exemplo && estaAtivo(e, AGORA))).toBe(true);
  });

  it("evento expirado não está ativo", () => {
    const [e] = eventosExemplo(AGORA);
    const depois = new Date(Date.parse(e.expira_em) + 1);
    expect(estaAtivo(e, depois)).toBe(false);
  });

  it("formata a hora no fuso do Rio", () => {
    expect(horaDoRio("2026-11-28T09:35:00Z")).toBe("06h35");
    expect(horaDoRio("lixo")).toBe("--h--");
  });

  it("rejeita linha do banco fora do formato", () => {
    const boa = {
      id: 1, tipo: "chuva", titulo: "Chuva forte", fonte: "Alerta Rio", confianca: "oficial",
      inicio: "2026-11-28T09:00:00Z", expira_em: "2026-11-28T15:00:00Z", lat: -22.9, lng: -43.2, severidade: 2,
      bairro: "Centro", url: "javascript:alert(1)",
    };
    const lida = lerLinhaDoBanco(boa);
    expect(lida?.exemplo).toBe(false);
    expect(lida?.url).toBeUndefined(); // só http(s) passa
    expect(lerLinhaDoBanco({ ...boa, tipo: "invasao" })).toBeNull();
    expect(lerLinhaDoBanco({ ...boa, severidade: 9 })).toBeNull();
    expect(lerLinhaDoBanco({ ...boa, lat: "x" })).toBeNull();
    expect(lerLinhaDoBanco(null)).toBeNull();
  });

  it("cai no plano B quando o banco falha", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chave-de-teste");
    const falha = vi.fn().mockRejectedValue(new Error("sem rede")) as unknown as typeof fetch;
    const r = await carregarEventos(AGORA, falha);
    expect(r.origem).toBe("exemplo");
    expect(r.eventos.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });

  it("usa o banco quando ele responde com eventos válidos", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chave-de-teste");
    const linha = {
      id: "a1", tipo: "chuva", titulo: "Chuva", fonte: "Alerta Rio", confianca: "oficial",
      inicio: "2026-11-28T09:00:00Z", expira_em: "2026-11-28T15:00:00Z", lat: -22.9, lng: -43.2, severidade: 1,
    };
    const ok = vi.fn().mockResolvedValue({ ok: true, json: async () => [linha, { lixo: true }] }) as unknown as typeof fetch;
    const r = await carregarEventos(AGORA, ok);
    expect(r.origem).toBe("ao-vivo");
    expect(r.eventos).toHaveLength(1);
    vi.unstubAllEnvs();
  });
});

describe("bairros", () => {
  it("ignora acento, caixa e pontuação", () => {
    expect(normalizar("  Glória!! ")).toBe("gloria");
    expect(resolverBairro("CAMPO GRANDE")?.nome).toBe("Campo Grande");
    expect(resolverBairro("tijuca")?.nome).toBe("Tijuca");
  });
  it("acha pelo começo e por nome contido", () => {
    expect(resolverBairro("copa")?.nome).toBe("Copacabana");
    expect(resolverBairro("Av. Brasil, Bonsucesso")?.nome).toBe("Bonsucesso");
  });
  it("não casa texto curto ou desconhecido", () => {
    expect(resolverBairro("ab")).toBeNull();
    expect(resolverBairro("")).toBeNull();
    expect(resolverBairro("Atlantis")).toBeNull();
  });
});

describe("geo", () => {
  it("mede distâncias plausíveis", () => {
    // Centro → Copacabana: cerca de 7 km.
    const d = distanciaKm([-22.9068, -43.1823], [-22.9711, -43.1863]);
    expect(d).toBeGreaterThan(6);
    expect(d).toBeLessThan(8.5);
  });
  it("distância ao segmento usa o ponto mais próximo, não a reta infinita", () => {
    const a: [number, number] = [-22.9, -43.2];
    const b: [number, number] = [-22.9, -43.1];
    const longe: [number, number] = [-22.9, -43.4];
    expect(distanciaAoSegmentoKm([-22.88, -43.15], a, b)).toBeLessThan(2.5);
    expect(distanciaAoSegmentoKm(longe, a, b)).toBeGreaterThan(15);
    expect(distanciaAoSegmentoKm([-22.9, -43.15], a, a)).toBeGreaterThan(0);
  });
});

describe("trajeto", () => {
  it("explica qual ponta não foi encontrada", () => {
    expect(resolverTrajeto("Atlantis", "Centro")).toEqual({ erro: expect.stringContaining("ponto de saída") });
    expect(resolverTrajeto("Centro", "Atlantis")).toEqual({ erro: expect.stringContaining("destino") });
    expect(resolverTrajeto("x", "y")).toEqual({ erro: expect.stringContaining("nenhum dos dois") });
  });

  it("Campo Grande → Centro traz chuva, trânsito e outros avisos do caminho, graves primeiro", () => {
    const r = resolverTrajeto("Campo Grande", "Centro");
    if (!("trajeto" in r)) throw new Error("trajeto não resolvido");
    const avisos = avisosDoTrajeto(r.trajeto, eventosExemplo(AGORA), AGORA);
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos.length).toBeLessThanOrEqual(3);
    const sev = avisos.map((a) => a.evento.severidade);
    expect([...sev].sort((x, y) => y - x)).toEqual(sev);
    expect(avisos.some((a) => a.evento.bairro === "Maré" || a.evento.bairro === "Campo Grande")).toBe(true);
  });

  it("não avisa de evento expirado", () => {
    const r = resolverTrajeto("Campo Grande", "Centro");
    if (!("trajeto" in r)) throw new Error("trajeto não resolvido");
    const muitoDepois = new Date(AGORA.getTime() + 48 * 3_600_000);
    expect(avisosDoTrajeto(r.trajeto, eventosExemplo(AGORA), muitoDepois)).toEqual([]);
  });

  it("monta o letreiro em maiúsculas, sem lixo e com limite de tamanho", () => {
    expect(textoDoLetreiro("campo grande", "centro", "carro")).toBe("CAMPO GRANDE >> CENTRO · DE CARRO");
    expect(textoDoLetreiro("<script>x</script>", "", "metro")).toBe("SCRIPTXSCRIPT >> PARA ONDE VAI · DE METRÔ");
    expect(textoDoLetreiro("a".repeat(200), "b", "bike").length).toBeLessThanOrEqual(64);
  });
});

describe("som", () => {
  function falsoAudio() {
    const criados: Array<AudioLike & { tocando: boolean; terminar: () => void }> = [];
    const criar = (src: string) => {
      let fim: (() => void) | null = null;
      const a = {
        src,
        currentTime: 0,
        preload: "",
        tocando: false,
        play: vi.fn(async () => { a.tocando = true; }),
        pause: vi.fn(() => { a.tocando = false; }),
        addEventListener: (_t: "ended", fn: () => void) => { fim = fn; },
        removeEventListener: () => { fim = null; },
        terminar: () => { a.tocando = false; fim?.(); },
      };
      criados.push(a);
      return a;
    };
    return { criar, criados };
  }
  const memoria = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
  };

  it("trocar de meio corta o som atual", async () => {
    const { criar, criados } = falsoAudio();
    const g = new GerenteDeSom(criar, memoria());
    await g.tocar(["/sons/carro.mp3"]);
    await g.tocar(["/sons/trem.mp3"]);
    expect(criados[0].tocando).toBe(false);
    expect(criados[1].tocando).toBe(true);
  });

  it("toca a lista em sequência (sinal e depois a voz)", async () => {
    const { criar, criados } = falsoAudio();
    const g = new GerenteDeSom(criar, memoria());
    await g.tocar(["/sons/sinal.mp3", "/sons/voz-metro.mp3"]);
    criados[0].terminar();
    await Promise.resolve();
    expect(criados).toHaveLength(2);
    expect(criados[1].src).toBe("/sons/voz-metro.mp3");
  });

  it("trocar de meio no meio do sinal cancela a voz antiga", async () => {
    const { criar, criados } = falsoAudio();
    const g = new GerenteDeSom(criar, memoria());
    await g.tocar(["/sons/sinal.mp3", "/sons/voz-metro.mp3"]);
    await g.tocar(["/sons/barca.mp3"]);
    criados[0].terminar();
    await Promise.resolve();
    expect(criados.map((c) => c.src)).toEqual(["/sons/sinal.mp3", "/sons/barca.mp3"]);
  });

  it("mudo lembra o estado e não toca", async () => {
    const { criar, criados } = falsoAudio();
    const arm = memoria();
    const g = new GerenteDeSom(criar, arm);
    g.definirMudo(true);
    expect(arm.m.get(CHAVE_MUDO)).toBe("1");
    expect(await g.tocar(["/sons/carro.mp3"])).toBe(false);
    expect(criados).toHaveLength(0);
    expect(new GerenteDeSom(criar, arm).estaMudo()).toBe(true);
  });

  it("segue sem som se o navegador recusar ou a lista for vazia", async () => {
    const recusa = () => ({
      src: "", currentTime: 0, preload: "", play: async () => { throw new Error("NotAllowedError"); },
      pause() {}, addEventListener() {}, removeEventListener() {},
    });
    const g = new GerenteDeSom(recusa, memoria());
    expect(await g.tocar(["/sons/carro.mp3"])).toBe(false);
    expect(await g.tocar([])).toBe(false);
  });

  it("todo meio tem rótulo e letreiro; só o ônibus em aberto não deveria faltar som", () => {
    expect(MODOS).toHaveLength(8);
    expect(MODOS.every((m) => m.rotulo && m.letreiro)).toBe(true);
  });
});
