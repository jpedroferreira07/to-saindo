import { describe, expect, it, vi } from "vitest";
import { normalizar, resolverBairro } from "./bairros";
import { estaAtivo, eventosExemplo, horaDoRio, lerLinhaDoBanco } from "./eventos";
import { FILTROS_PADRAO, filtrarEventos, lerFiltros, maisNovosPrimeiro, paraQuery, slugDoBairro } from "./filtros";
import { dentroDoRio, distanciaAoSegmentoKm, distanciaKm } from "./geo";
import { caminhoParaLinha, circuloPoligono, eventosParaColunas, eventosParaPontos, nomeDoBalao, pontoNoCaminho, rumoEntre } from "./mapa-dados";
import { MODOS } from "./modos";
import { CHAVE_MUDO, GerenteDeSom, type AudioLike } from "./som";
import { TIPOS } from "./tipos";
import { ocorrenciasNoCaminho } from "./trajeto";

const AGORA = new Date("2026-11-28T09:30:00Z");

describe("eventos", () => {
  it("marca todos os exemplos como fictícios e ativos", () => {
    const lista = eventosExemplo(AGORA);
    expect(lista.length).toBeGreaterThan(10);
    expect(lista.every((e) => e.exemplo && estaAtivo(e, AGORA))).toBe(true);
  });

  it("evento expirado não está ativo", () => {
    const [e] = eventosExemplo(AGORA);
    expect(estaAtivo(e, new Date(Date.parse(e.expira_em) + 1))).toBe(false);
  });

  it("validade por tipo: tiroteio dura menos que buraco", () => {
    expect(TIPOS.tiroteio.validadeH).toBeLessThan(TIPOS.buraco.validadeH);
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
});

describe("filtros na URL", () => {
  const params = (q: string) => new URLSearchParams(q);

  it("lê aba, bairro e tipos; valor estranho cai no padrão", () => {
    expect(lerFiltros(params("aba=feed&bairro=tijuca&tipos=chuva,buraco"))).toEqual({
      aba: "feed", bairro: "tijuca", tipos: ["chuva", "buraco"],
    });
    expect(lerFiltros(params("aba=x&bairro=<script>&tipos=hack,chuva,chuva"))).toEqual({
      aba: "mapa", bairro: null, tipos: ["chuva"],
    });
  });

  it("ida e volta da query e padrão vazio", () => {
    expect(paraQuery(FILTROS_PADRAO)).toBe("");
    const f = { aba: "feed" as const, bairro: "tijuca", tipos: ["chuva" as const] };
    expect(lerFiltros(params(paraQuery(f)))).toEqual(f);
  });

  it("filtra por bairro e tipo, e ordena do mais novo", () => {
    const todos = eventosExemplo(AGORA);
    const chuva = filtrarEventos(todos, { bairro: null, tipos: ["chuva"] });
    expect(chuva.length).toBeGreaterThan(0);
    expect(chuva.every((e) => e.tipo === "chuva")).toBe(true);
    const b = todos[0].bairro;
    expect(filtrarEventos(todos, { bairro: slugDoBairro(b), tipos: [] }).every((e) => e.bairro === b)).toBe(true);
    const ord = maisNovosPrimeiro(todos).map((e) => Date.parse(e.inicio));
    expect([...ord].sort((x, y) => y - x)).toEqual(ord);
  });
});

describe("ocorrências no caminho", () => {
  const caminho: Array<[number, number]> = [[-22.9, -43.2], [-22.9, -43.1]];
  const base = eventosExemplo(AGORA)[0];
  const ev = (id: string, lat: number, sev: 1 | 2 | 3) => ({ ...base, id, lat, lng: -43.15, severidade: sev });

  it("pega só o que está a até 500 m, graves primeiro", () => {
    const lista = [ev("perto", -22.9015, 1), ev("grave", -22.9, 3), ev("longe", -22.91, 3)];
    expect(ocorrenciasNoCaminho(caminho, lista, AGORA).map((x) => x.evento.id)).toEqual(["grave", "perto"]);
  });

  it("expirada nunca entra", () => {
    const depois = new Date(Date.parse(base.expira_em) + 1);
    expect(ocorrenciasNoCaminho(caminho, [ev("x", -22.9, 3)], depois)).toEqual([]);
  });
});

describe("dados do mapa", () => {
  it("pontos e colunas têm uma feição por evento, com [lng, lat]", () => {
    const lista = eventosExemplo(AGORA);
    const pontos = eventosParaPontos(lista);
    expect(pontos.features).toHaveLength(lista.length);
    expect(pontos.features[0].geometry.coordinates).toEqual([lista[0].lng, lista[0].lat]);
    expect(eventosParaColunas(lista).features.length).toBe(lista.length);
  });

  it("balão tracejado só para relato", () => {
    const [e] = eventosExemplo(AGORA);
    expect(nomeDoBalao({ ...e, confianca: "relato" })).not.toBe(nomeDoBalao({ ...e, confianca: "oficial" }));
  });

  it("círculo fecha o polígono", () => {
    const c = circuloPoligono(-22.9, -43.2, 50);
    expect(c[0]).toEqual(c[c.length - 1]);
  });

  it("ponto no caminho nas pontas e no meio, rumo para leste", () => {
    const cam: Array<[number, number]> = [[-22.9, -43.2], [-22.9, -43.1]];
    expect(pontoNoCaminho(cam, 0).ponto).toEqual(cam[0]);
    expect(pontoNoCaminho(cam, 1).ponto[1]).toBeCloseTo(-43.1, 5);
    expect(pontoNoCaminho(cam, 0.5).ponto[1]).toBeCloseTo(-43.15, 3);
    expect(rumoEntre(cam[0], cam[1])).toBeCloseTo(90, 0);
    expect(caminhoParaLinha(cam).coordinates[0]).toEqual([-43.2, -22.9]);
  });
});

describe("limite do Rio", () => {
  it("aceita o Centro e recusa São Paulo", () => {
    expect(dentroDoRio(-22.9, -43.2)).toBe(true);
    expect(dentroDoRio(-23.55, -46.63)).toBe(false);
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

  it("todo meio tem rótulo e letreiro", () => {
    expect(MODOS).toHaveLength(8);
    expect(MODOS.every((m) => m.rotulo && m.letreiro)).toBe(true);
  });
});
