"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Lugar, Rota } from "@/lib/api";
import { resolverBairroMaisPerto } from "@/lib/api";
import { apagarDadosLocais } from "@/lib/dispositivo";
import type { Evento } from "@/lib/eventos";
import { bairroPorSlug, filtrarEventos, lerFiltros, paraQuery, slugDoBairro, type Aba, type Filtros } from "@/lib/filtros";
import { dentroDoRio, type LatLng } from "@/lib/geo";
import { modoPorId, type ModoId } from "@/lib/modos";
import { GerenteDeSom } from "@/lib/som";
import { useOcorrencias } from "@/lib/useOcorrencias";
import { BAIRROS } from "@/lib/bairros";
import { BuscaLocal } from "./BuscaLocal";
import { CartaoOcorrencia } from "./CartaoOcorrencia";
import { Feed } from "./Feed";
import { Icone } from "./icones";
import type { MapaHandle, VooPara } from "./MapaRio";
import { PainelRota } from "./PainelRota";
import { Reportar, type LocalDoReporte } from "./Reportar";
import { SeletorBairro } from "./SeletorBairro";

// O mapa carrega depois do resto da tela: o primeiro desenho não espera o MapLibre.
const MapaRio = dynamic(() => import("./MapaRio").then((m) => m.MapaRio), {
  ssr: false,
  loading: () => <div className="mapa mapa--carregando" role="status">Carregando o mapa…</div>,
});

const ABAS: ReadonlyArray<{ id: Aba; rotulo: string }> = [
  { id: "mapa", rotulo: "Mapa" },
  { id: "feed", rotulo: "Feed" },
];

export function App() {
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const filtros = useMemo(() => lerFiltros(params), [params]);
  const dados = useOcorrencias();

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [voarPara, setVoarPara] = useState<VooPara | null>(null);
  const [rota, setRota] = useState<Rota | null>(null);
  const [painelRota, setPainelRota] = useState(false);
  const [modo, setModo] = useState<ModoId>("carro");
  const [vista3d, setVista3d] = useState(true);
  const [usuario, setUsuario] = useState<LatLng | null>(null);
  const [mapaFalhou, setMapaFalhou] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [aviso, setAviso] = useState("");
  const [reportar, setReportar] = useState({ aberto: false, escolhendoLocal: false });
  const [localReporte, setLocalReporte] = useState<LocalDoReporte | null>(null);
  const [apagados, setApagados] = useState<number | null>(null);

  const mapa = useRef<MapaHandle>(null);
  const som = useRef<GerenteDeSom | null>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const vooSeq = useRef(0);

  useEffect(() => {
    let armazenamento: Storage | null = null;
    try {
      armazenamento = window.localStorage;
    } catch {
      armazenamento = null;
    }
    som.current = new GerenteDeSom(undefined, armazenamento);
    setMudo(som.current.estaMudo());
    return () => som.current?.parar();
  }, []);

  const mudarFiltros = useCallback(
    (parcial: Partial<Filtros>) => {
      const q = paraQuery({ ...filtros, ...parcial });
      router.replace(q ? `${caminho}?${q}` : caminho, { scroll: false });
    },
    [filtros, router, caminho],
  );

  const voar = useCallback((lat: number, lng: number, zoom?: number) => {
    setVoarPara({ lat, lng, zoom, chave: ++vooSeq.current });
  }, []);

  const eventosFiltrados = useMemo(() => filtrarEventos(dados.eventos, filtros), [dados.eventos, filtros]);
  const selecionado = dados.eventos.find((e) => e.id === selecionadoId) ?? null;
  const bairroAtual = bairroPorSlug(filtros.bairro);

  function trocarAba(aba: Aba) {
    mudarFiltros({ aba });
  }

  function teclasAbas(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let alvo = -1;
    if (e.key === "ArrowRight") alvo = (i + 1) % ABAS.length;
    else if (e.key === "ArrowLeft") alvo = (i - 1 + ABAS.length) % ABAS.length;
    else if (e.key === "Home") alvo = 0;
    else if (e.key === "End") alvo = ABAS.length - 1;
    if (alvo < 0) return;
    e.preventDefault();
    trocarAba(ABAS[alvo].id);
    tabs.current[alvo]?.focus();
  }

  function escolherBairro(slug: string | null) {
    mudarFiltros({ bairro: slug });
    setSelecionadoId(null);
    const b = bairroPorSlug(slug);
    if (b) voar(b.lat, b.lng, 13.6);
  }

  function escolherLugar(l: Lugar) {
    const local = BAIRROS.find((b) => b.nome === l.bairro && b.nome === l.nome);
    if (local) mudarFiltros({ bairro: slugDoBairro(local.nome) });
    voar(l.lat, l.lng, local ? 13.6 : 15.5);
  }

  function verNoMapa(e: Evento) {
    mudarFiltros({ aba: "mapa" });
    setSelecionadoId(e.id);
    voar(e.lat, e.lng, 16);
  }

  /** Escolher o meio de transporte toca o som dele (só por ação da pessoa, nunca sozinho). */
  function escolherModo(id: ModoId) {
    setModo(id);
    const m = modoPorId(id);
    if (m) void som.current?.tocar(m.sons);
  }

  function alternarSom() {
    const g = som.current;
    if (!g) return;
    g.definirMudo(!g.estaMudo());
    setMudo(g.estaMudo());
  }

  const pegarLocalizacao = useCallback((): Promise<LatLng | null> => {
    return new Promise((resolver) => {
      if (!("geolocation" in navigator)) {
        setAviso("Este aparelho não informa a localização.");
        resolver(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const ponto: LatLng = [p.coords.latitude, p.coords.longitude];
          if (!dentroDoRio(ponto[0], ponto[1])) {
            setAviso("Você parece estar fora do Rio de Janeiro. O app cobre só a cidade.");
            resolver(null);
            return;
          }
          setUsuario(ponto);
          resolver(ponto);
        },
        () => {
          setAviso("Sem permissão de localização. Tudo segue funcionando: escolha o bairro ou busque um lugar.");
          resolver(null);
        },
        { timeout: 8000, maximumAge: 60_000 },
      );
    });
  }, []);

  async function usarMinhaLocalizacaoNoMapa() {
    setAviso("");
    const p = await pegarLocalizacao();
    if (p) {
      voar(p[0], p[1], 15);
      setAviso("");
    }
  }

  async function localizacaoComoLugar(): Promise<Lugar | null> {
    const p = await pegarLocalizacao();
    return p ? { nome: "Minha localização", lat: p[0], lng: p[1] } : null;
  }

  /* ---- Reportar ---- */
  function abrirReporte() {
    setReportar({ aberto: true, escolhendoLocal: false });
    setLocalReporte((atual) => {
      if (atual) return atual;
      const ponto = bairroAtual ? ([bairroAtual.lat, bairroAtual.lng] as LatLng) : usuario;
      return ponto ? { lat: ponto[0], lng: ponto[1], descricao: `Perto de ${resolverBairroMaisPerto(ponto[0], ponto[1])}` } : null;
    });
  }

  function escolherLocalNoMapa() {
    mudarFiltros({ aba: "mapa" });
    setPainelRota(false);
    setReportar({ aberto: false, escolhendoLocal: true });
  }

  function confirmarLocal() {
    const c = mapa.current?.centro();
    if (!c) return;
    if (!dentroDoRio(c.lat, c.lng)) {
      setAviso("Esse ponto está fora do Rio de Janeiro. Arraste o mapa para dentro da cidade.");
      return;
    }
    setAviso("");
    setLocalReporte({ lat: c.lat, lng: c.lng, descricao: `Perto de ${resolverBairroMaisPerto(c.lat, c.lng)}` });
    setReportar({ aberto: true, escolhendoLocal: false });
  }

  function reportePublicado(e: Evento, origem: "servidor" | "exemplo") {
    if (origem === "exemplo") dados.adicionarLocal(e);
    else void dados.recarregar();
    setLocalReporte(null);
  }

  const resumo = bairroAtual
    ? `${eventosFiltrados.length} ${eventosFiltrados.length === 1 ? "ocorrência ativa" : "ocorrências ativas"} em ${bairroAtual.nome}`
    : `${eventosFiltrados.length} ${eventosFiltrados.length === 1 ? "ocorrência ativa" : "ocorrências ativas"} no Rio`;

  return (
    <div className="app">
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="cab">
        <span className="marca">
          <Icone id="pin" />
          TÔ SAINDO
        </span>
        <div role="tablist" aria-label="Seções do app" className="abas">
          {ABAS.map((a, i) => (
            <button
              key={a.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`aba-${a.id}`}
              aria-selected={filtros.aba === a.id}
              aria-controls={`painel-${a.id}`}
              tabIndex={filtros.aba === a.id ? 0 : -1}
              className="aba"
              onClick={() => trocarAba(a.id)}
              onKeyDown={(e) => teclasAbas(e, i)}
            >
              <Icone id={a.id} />
              {a.rotulo}
            </button>
          ))}
        </div>
        <button type="button" className="botao-icone" aria-pressed={!mudo} onClick={alternarSom} aria-label={mudo ? "Ligar os sons dos meios de transporte" : "Desligar os sons dos meios de transporte"}>
          <Icone id={mudo ? "som-off" : "som"} />
        </button>
      </header>

      <main id="conteudo" className="principal">
        <section id="painel-mapa" role="tabpanel" aria-labelledby="aba-mapa" hidden={filtros.aba !== "mapa"} className="painel-mapa">
          {mapaFalhou ? (
            <div className="mapa mapa--erro">
              <p>O mapa não carregou neste aparelho ou rede. As mesmas ocorrências estão na aba Feed.</p>
              <button type="button" className="botao botao--led" onClick={() => trocarAba("feed")}>
                Abrir o Feed
              </button>
            </div>
          ) : (
            <MapaRio
              ref={mapa}
              eventos={eventosFiltrados}
              selecionadoId={selecionadoId}
              onSelecionar={setSelecionadoId}
              voarPara={voarPara}
              rota={rota}
              modo={modo}
              escolhendoLocal={reportar.escolhendoLocal}
              vista3d={vista3d}
              visivel={filtros.aba === "mapa"}
              usuario={usuario}
              onErro={() => setMapaFalhou(true)}
            />
          )}

          <div className="mapa-cima">
          <div className="mapa-topo">
            <BuscaLocal rotulo="Buscar bairro, endereço ou lugar" rotuloOculto placeholder="Buscar bairro, endereço ou lugar" onEscolher={escolherLugar} />
            <SeletorBairro valor={filtros.bairro} onMudar={escolherBairro} oculto />
          </div>
          <div className="mapa-acoes">
            <button type="button" className="botao botao--escuro botao--pequeno" aria-expanded={painelRota} onClick={() => setPainelRota((v) => !v)}>
              <Icone id="rota" />
              Como chegar
            </button>
            <button type="button" className="botao botao--escuro botao--pequeno" onClick={usarMinhaLocalizacaoNoMapa}>
              <Icone id="local" />
              Minha localização
            </button>
            <button type="button" className="botao botao--escuro botao--pequeno" aria-pressed={vista3d} onClick={() => setVista3d((v) => !v)}>
              <Icone id="predios" />
              Vista 3D
            </button>
          </div>
          <p className="mapa-resumo" role="status">
            {dados.carregando && dados.eventos.length === 0 ? "Carregando as ocorrências…" : resumo}
            {dados.origem === "exemplo" && !dados.carregando ? " · avisos de exemplo" : ""}
          </p>
          {aviso && (
            <p className="mapa-aviso" role="alert">
              {aviso}
            </p>
          )}
          </div>

          {reportar.escolhendoLocal && (
            <div className="barra-alfinete" role="region" aria-label="Escolher o local do reporte">
              <p>Arraste o mapa para posicionar o alfinete no local.</p>
              <div className="botoes">
                <button type="button" className="botao botao--led botao--pequeno" onClick={confirmarLocal}>
                  Usar este local
                </button>
                <button type="button" className="botao botao--contorno botao--pequeno" onClick={() => setReportar({ aberto: true, escolhendoLocal: false })}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!reportar.escolhendoLocal && painelRota && (
            <PainelRota
              eventos={dados.eventos}
              agora={dados.agora}
              modo={modo}
              onModo={escolherModo}
              onRota={setRota}
              onVerNoMapa={(e) => {
                setSelecionadoId(e.id);
                voar(e.lat, e.lng, 16);
              }}
              onUsarLocalizacao={localizacaoComoLugar}
              onFechar={() => {
                setPainelRota(false);
                setRota(null);
              }}
            />
          )}
          {!reportar.escolhendoLocal && !painelRota && selecionado && (
            <section className="folha" aria-label="Ocorrência selecionada">
              <button type="button" className="botao-icone folha__fechar" onClick={() => setSelecionadoId(null)} aria-label="Fechar o cartão">
                <Icone id="fechar" />
              </button>
              <CartaoOcorrencia evento={selecionado} agora={dados.agora} titulo="h2" />
            </section>
          )}
        </section>

        <section id="painel-feed" role="tabpanel" aria-labelledby="aba-feed" hidden={filtros.aba !== "feed"} className="painel-feed">
          <Feed
            eventos={dados.eventos}
            agora={dados.agora}
            filtros={filtros}
            onFiltros={mudarFiltros}
            origem={dados.origem}
            carregando={dados.carregando}
            tempoReal={dados.tempoReal}
            onTentarDeNovo={() => void dados.recarregar()}
            onVerNoMapa={verNoMapa}
          />
          <footer className="rodape">
            <p>
              Fontes: Alerta Rio, Fogo Cruzado, notícias com link e reportes de usuários, sempre com horário e confiança. Avisos
              marcados como “exemplo” são fictícios. Mapa: © colaboradores do OpenStreetMap, OpenFreeMap e OpenMapTiles. Rotas:
              OpenRouteService. Em risco real, ligue 190 (polícia) ou 193 (bombeiros).
            </p>
            <p>
              <button type="button" className="link-botao" onClick={() => setApagados(apagarDadosLocais())}>
                Apagar meus dados deste navegador
              </button>
              <span role="status">{apagados !== null && ` Pronto: ${apagados} ${apagados === 1 ? "item apagado" : "itens apagados"}.`}</span>
            </p>
          </footer>
        </section>
      </main>

      <button type="button" className="fab" onClick={abrirReporte}>
        <Icone id="mais" />
        Reportar
      </button>

      <Reportar
        aberto={reportar.aberto}
        local={localReporte}
        onFechar={() => setReportar((r) => (r.escolhendoLocal ? r : { aberto: false, escolhendoLocal: false }))}
        onEscolherNoMapa={escolherLocalNoMapa}
        onPublicado={reportePublicado}
        onVerNoMapa={verNoMapa}
      />
    </div>
  );
}
