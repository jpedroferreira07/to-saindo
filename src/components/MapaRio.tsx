"use client";

import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, LngLatBoundsLike, Map as MapaGL, Marker, MapMouseEvent, MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// O bundler reescreve o caminho do worker; aponta para a cópia estática em public/maplibre (versão 6.20.0).
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { RIO_BOUNDS, RIO_CENTRO, type LatLng } from "@/lib/geo";
import { svgDoIcone } from "@/lib/icones-dados";
import { caminhoParaLinha, eventosParaColunas, eventosParaPontos, pontoNoCaminho, rumoEntre } from "@/lib/mapa-dados";
import type { Evento } from "@/lib/eventos";
import type { ModoId } from "@/lib/modos";
import type { Rota } from "@/lib/api";
import { COR_CATEGORIA, LISTA_TIPOS, categoriaDo, type EventoTipo } from "@/lib/tipos";

const ESTILO = "https://tiles.openfreemap.org/styles/dark";
const LED = "#ffb000";
const FUNDO = "#101215";
const PITCH_3D = 58;
const BEARING_3D = -17;
/** Tempo de uma volta do veículo pela rota, por meio. */
const VOLTA_MS: Record<ModoId, number> = { carro: 7000, moto: 6000, bike: 12000, onibus: 9000, metro: 6000, vlt: 10000, trem: 8000, barca: 11000 };

export interface MapaHandle {
  /** Centro do mapa agora (o alfinete do reporte fica nele). */
  centro: () => { lat: number; lng: number } | null;
}
export interface VooPara {
  lat: number;
  lng: number;
  zoom?: number;
  /** Muda a cada pedido, para voar de novo mesmo para o mesmo lugar. */
  chave: number;
}

interface Props {
  eventos: readonly Evento[];
  selecionadoId: string | null;
  onSelecionar: (id: string | null) => void;
  voarPara: VooPara | null;
  rota: Rota | null;
  modo: ModoId;
  escolhendoLocal: boolean;
  vista3d: boolean;
  visivel: boolean;
  usuario: LatLng | null;
  onErro: () => void;
  ref?: Ref<MapaHandle>;
}

const vazio = { type: "FeatureCollection" as const, features: [] };

/** Balão do mapa: gota escura com contorno da cor da categoria (tracejado quando é relato) e o ícone do tipo. */
async function criarBalao(tipo: EventoTipo, relato: boolean): Promise<ImageData> {
  const cor = COR_CATEGORIA[categoriaDo(tipo)];
  const escala = 2;
  const L = 48;
  const A = 60;
  const c = document.createElement("canvas");
  c.width = L * escala;
  c.height = A * escala;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.scale(escala, escala);
  ctx.beginPath();
  ctx.moveTo(24, 58);
  ctx.lineTo(13.7, 38);
  ctx.arc(24, 22, 19, 2.14, 1.0 + Math.PI * 2, false);
  ctx.closePath();
  ctx.fillStyle = FUNDO;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = cor;
  ctx.setLineDash(relato ? [5, 4] : []);
  ctx.stroke();
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoIcone(tipo, cor, 48))}`;
  await img.decode();
  ctx.drawImage(img, 12, 10, 24, 24);
  return ctx.getImageData(0, 0, c.width, c.height);
}

function elementoDoVeiculo(modo: ModoId): HTMLElement {
  const el = document.createElement("div");
  el.className = "veiculo-mapa";
  el.innerHTML = svgDoIcone(modo, FUNDO, 28); // constante do código, nunca entrada do usuário
  return el;
}

function elementoDoPonto(letra: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "ponto-rota";
  el.textContent = letra;
  return el;
}

/** Mapa do Rio (MapLibre + OpenFreeMap), limitado à cidade, com prédios e colunas de luz em 3D. */
export function MapaRio({ eventos, selecionadoId, onSelecionar, voarPara, rota, modo, escolhendoLocal, vista3d, visivel, usuario, onErro, ref }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaGL | null>(null);
  const [pronto, setPronto] = useState(false);
  // Valores que os ouvintes do mapa precisam ler sempre atualizados, sem recriar o mapa.
  const aoSelecionar = useRef(onSelecionar);
  const aoErro = useRef(onErro);
  const em3d = useRef(vista3d);
  const escolhendo = useRef(escolhendoLocal);
  const rumoDaRota = useRef(0);
  useEffect(() => {
    aoSelecionar.current = onSelecionar;
    aoErro.current = onErro;
    em3d.current = vista3d;
    escolhendo.current = escolhendoLocal;
  });

  useImperativeHandle(ref, () => ({
    centro: () => {
      const c = mapa.current?.getCenter();
      return c ? { lat: c.lat, lng: c.lng } : null;
    },
  }));

  /* Criação do mapa (uma vez). */
  useEffect(() => {
    if (!caixa.current) return;
    let vivo = true;
    const m = new maplibregl.Map({
      container: caixa.current,
      style: ESTILO,
      center: [RIO_CENTRO[1], RIO_CENTRO[0]],
      zoom: 11.2,
      minZoom: 9.5,
      maxZoom: 18,
      pitch: em3d.current ? PITCH_3D : 0,
      bearing: em3d.current ? BEARING_3D : 0,
      maxBounds: RIO_BOUNDS as unknown as LngLatBoundsLike,
      attributionControl: { compact: true },
    });
    mapa.current = m;
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    m.on("error", () => {
      if (vivo && !m.loaded()) aoErro.current();
    });

    m.on("load", async () => {
      try {
        // Ícones dos balões: um por tipo, firme ou tracejado (relato).
        await Promise.all(
          LISTA_TIPOS.flatMap((tipo) =>
            [false, true].map(async (relato) => {
              const dados = await criarBalao(tipo, relato);
              if (vivo && !m.hasImage(`pin-${tipo}-${relato ? "r" : "f"}`)) m.addImage(`pin-${tipo}-${relato ? "r" : "f"}`, dados, { pixelRatio: 2 });
            }),
          ),
        );
        if (!vivo) return;

        const primeiroTexto = m.getStyle().layers.find((l: { type: string }) => l.type === "symbol")?.id;

        // Prédios em 3D (camada `building` do OpenMapTiles).
        m.addLayer(
          {
            id: "predios-3d",
            type: "fill-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 12,
            paint: {
              "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 8], 0, "#2a2f3a", 60, "#3b4150", 200, "#4f5666"],
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": 0.88,
            },
          },
          primeiroTexto,
        );

        m.addSource("colunas", { type: "geojson", data: vazio });
        m.addLayer(
          {
            id: "colunas-3d",
            type: "fill-extrusion",
            source: "colunas",
            paint: { "fill-extrusion-color": ["get", "cor"], "fill-extrusion-height": ["get", "altura"], "fill-extrusion-base": 0, "fill-extrusion-opacity": 0.72 },
          },
          primeiroTexto,
        );

        m.addSource("rota", { type: "geojson", data: vazio });
        m.addLayer({ id: "rota-borda", type: "line", source: "rota", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": FUNDO, "line-width": 10 } });
        m.addLayer({ id: "rota-linha", type: "line", source: "rota", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": LED, "line-width": 5 } });

        m.addSource("ocorrencias", { type: "geojson", data: vazio, cluster: true, clusterRadius: 46, clusterMaxZoom: 14 });
        m.addLayer({
          id: "grupos",
          type: "circle",
          source: "ocorrencias",
          filter: ["has", "point_count"],
          paint: { "circle-color": LED, "circle-radius": ["step", ["get", "point_count"], 17, 5, 21, 15, 26], "circle-stroke-width": 3, "circle-stroke-color": FUNDO },
        });
        m.addLayer({
          id: "grupos-numero",
          type: "symbol",
          source: "ocorrencias",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Regular"], "text-size": 14, "text-allow-overlap": true },
          paint: { "text-color": FUNDO },
        });
        m.addLayer({
          id: "pontos",
          type: "symbol",
          source: "ocorrencias",
          filter: ["!", ["has", "point_count"]],
          layout: { "icon-image": ["get", "icone"], "icon-anchor": "bottom", "icon-allow-overlap": true },
        });
        m.addLayer({
          id: "selecionado",
          type: "circle",
          source: "ocorrencias",
          filter: ["==", ["get", "id"], ""],
          paint: { "circle-radius": 27, "circle-color": "rgba(255,176,0,0.12)", "circle-stroke-color": LED, "circle-stroke-width": 3, "circle-translate": [0, -36], "circle-translate-anchor": "viewport" },
        });

        const camadas3d = em3d.current ? "visible" : "none";
        m.setLayoutProperty("predios-3d", "visibility", camadas3d);
        m.setLayoutProperty("colunas-3d", "visibility", camadas3d);

        m.on("click", "grupos", async (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
          const f = e.features?.[0];
          const id = f?.properties?.cluster_id;
          if (f && typeof id === "number" && f.geometry.type === "Point") {
            const fonte = m.getSource("ocorrencias") as GeoJSONSource;
            const zoom = await fonte.getClusterExpansionZoom(id);
            m.easeTo({ center: f.geometry.coordinates as [number, number], zoom: zoom + 0.3 });
          }
        });
        m.on("click", "pontos", (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
          const id = e.features?.[0]?.properties?.id;
          if (typeof id === "string") aoSelecionar.current(id);
        });
        m.on("click", (e: MapMouseEvent) => {
          if (escolhendo.current) return;
          const tocou = m.queryRenderedFeatures(e.point, { layers: ["pontos", "grupos"] });
          if (tocou.length === 0) aoSelecionar.current(null);
        });
        for (const camada of ["grupos", "pontos"]) {
          m.on("mouseenter", camada, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", camada, () => (m.getCanvas().style.cursor = ""));
        }
        setPronto(true);
      } catch {
        if (vivo) aoErro.current();
      }
    });

    return () => {
      vivo = false;
      setPronto(false);
      m.remove();
      mapa.current = null;
    };
  }, []);

  /* Dados: balões e colunas 3D. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    (m.getSource("ocorrencias") as GeoJSONSource | undefined)?.setData(eventosParaPontos(eventos) as never);
    (m.getSource("colunas") as GeoJSONSource | undefined)?.setData(eventosParaColunas(eventos) as never);
  }, [eventos, pronto]);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    m.setFilter("selecionado", ["==", ["get", "id"], selecionadoId ?? ""]);
  }, [selecionadoId, pronto]);

  /* Voar até um lugar. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto || !voarPara) return;
    m.flyTo({ center: [voarPara.lng, voarPara.lat], zoom: voarPara.zoom ?? 14, speed: 1.2, essential: true });
  }, [voarPara, pronto]);

  /* Vista 3D ligada e desligada. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    const v = vista3d ? "visible" : "none";
    m.setLayoutProperty("predios-3d", "visibility", v);
    m.setLayoutProperty("colunas-3d", "visibility", v);
    if (!escolhendoLocal) m.easeTo({ pitch: vista3d ? PITCH_3D : 0, bearing: vista3d ? BEARING_3D : 0, duration: 900 });
  }, [vista3d, pronto, escolhendoLocal]);

  /* Escolher o local do reporte: mapa de cima, sem inclinação, para o alfinete ser preciso. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    if (escolhendoLocal) m.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    else m.easeTo({ pitch: em3d.current ? PITCH_3D : 0, bearing: em3d.current ? BEARING_3D : 0, duration: 700 });
  }, [escolhendoLocal, pronto]);

  /* Mapa escondido (aba Feed) volta com o tamanho certo. */
  useEffect(() => {
    if (visivel) mapa.current?.resize();
  }, [visivel]);

  /* Rota desenhada, com A e B. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    const fonte = m.getSource("rota") as GeoJSONSource | undefined;
    if (!rota) {
      fonte?.setData(vazio as never);
      return;
    }
    fonte?.setData({ type: "Feature", properties: {}, geometry: caminhoParaLinha(rota.caminho) } as never);
    const a = rota.caminho[0];
    const b = rota.caminho[rota.caminho.length - 1];
    rumoDaRota.current = rumoEntre(a, b);
    const limites = new maplibregl.LngLatBounds();
    rota.caminho.forEach(([lat, lng]) => limites.extend([lng, lat]));
    m.fitBounds(limites, {
      padding: { top: 150, bottom: 300, left: 50, right: 50 },
      maxZoom: 15,
      pitch: em3d.current ? PITCH_3D : 0,
      bearing: em3d.current ? rumoDaRota.current : 0,
      duration: 1800,
    });
    const marcas: Marker[] = [
      new maplibregl.Marker({ element: elementoDoPonto("A") }).setLngLat([a[1], a[0]]).addTo(m),
      new maplibregl.Marker({ element: elementoDoPonto("B") }).setLngLat([b[1], b[0]]).addTo(m),
    ];
    return () => marcas.forEach((x) => x.remove());
  }, [rota, pronto]);

  /* O veículo do meio escolhido anda pela rota, em loop. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto || !rota) return;
    const marca = new maplibregl.Marker({ element: elementoDoVeiculo(modo), pitchAlignment: "viewport" });
    const inicio = performance.now();
    const volta = VOLTA_MS[modo];
    let quadro = 0;
    const passo = (t: number) => {
      const { ponto } = pontoNoCaminho(rota.caminho, ((t - inicio) % volta) / volta);
      marca.setLngLat([ponto[1], ponto[0]]);
      if (!marca.getElement().isConnected) marca.addTo(m);
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      marca.remove();
    };
  }, [rota, modo, pronto]);

  /* Minha localização. */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto || !usuario) return;
    const el = document.createElement("div");
    el.className = "ponto-usuario";
    const marca = new maplibregl.Marker({ element: el }).setLngLat([usuario[1], usuario[0]]).addTo(m);
    return () => {
      marca.remove();
    };
  }, [usuario, pronto]);

  return (
    <div className="mapa" role="region" aria-label="Mapa do Rio de Janeiro com as ocorrências. A lista completa e acessível está na aba Feed.">
      <div ref={caixa} className="mapa__tela" />
      {escolhendoLocal && (
        <div className="mapa__alfinete" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44" fill={FUNDO} stroke={LED} strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
            <circle cx="12" cy="10" r="2.4" fill={LED} />
          </svg>
        </div>
      )}
    </div>
  );
}
