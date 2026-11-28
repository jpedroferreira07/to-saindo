/**
 * Desenho de cada ícone (24×24, só traço). Os mesmos dados servem ao React (componente `Icone`)
 * e ao canvas do mapa (balões das ocorrências), para o ícone ser idêntico nos dois lugares.
 */
export const TRACOS = {
  // Tipos de ocorrência
  tiroteio: '<path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4.5M12 17.4v.2"/>',
  assalto: '<path d="M6 9h12l1 11H5L6 9Z"/><path d="M9 9a3 3 0 0 1 6 0M9.5 13.5h5"/>',
  transito:
    '<path d="M2.5 16v-3l1.7-3.6A1.7 1.7 0 0 1 5.8 8.3h5.4a1.7 1.7 0 0 1 1.6 1.1L14.5 13v3M2 16h13M5 16v1.8M12 16v1.8"/><path d="M18 8.5v9M21 11v6.5"/>',
  acidente:
    '<path d="M3 17v-3l1.7-3.6A1.7 1.7 0 0 1 6.3 9.3H11M2.5 17h12M5.5 17v1.8M11.5 17v1.8"/><path d="M15.5 4.5l5.5 5.5M21 4.5l-5.5 5.5"/>',
  transporte:
    '<rect x="4" y="4.5" width="16" height="12.5" rx="2.2"/><path d="M4 11h16M7 20v-3M17 20v-3"/><circle cx="8" cy="14" r="0.8"/><circle cx="16" cy="14" r="0.8"/>',
  chuva: '<path d="M7 15a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 8a3.6 3.6 0 0 1 .5 7Z"/><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>',
  alagamento:
    '<path d="M12 3.5s-4 4.4-4 7a4 4 0 0 0 8 0c0-2.6-4-7-4-7Z"/><path d="M3 16c2 0 2-1.6 4.5-1.6S10 16 12 16s2.5-1.6 4.5-1.6S19 16 21 16M3 20c2 0 2-1.6 4.5-1.6S10 20 12 20s2.5-1.6 4.5-1.6S19 20 21 20"/>',
  arvore_caida:
    '<g transform="rotate(72 12 12)"><path d="M12 21v-6M7 15h10l-3.5-4.5H16L12 4.5 8 10.5h2.5L7 15Z"/></g><path d="M3 20.5h18"/>',
  luz_queimada:
    '<path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.7V17h5.4v-1.5c0-.6.3-1.2.9-1.7A6 6 0 0 0 12 3Z"/><path d="M9.8 20.2h4.4M4.5 4.5l15 15"/>',
  buraco: '<path d="M3 16.5h18"/><ellipse cx="12" cy="16.5" rx="5.5" ry="2.3"/><path d="M8 12.5 6 10.5M16 12.5l2-2M12 11.5v-3"/>',
  outro:
    '<path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M12 8.5v3.5M12 14.2v.1"/>',

  // Meios de transporte
  carro:
    '<path d="M5 16V12l1.7-4.4A2 2 0 0 1 8.6 6h6.8a2 2 0 0 1 1.9 1.6L19 12v4"/><path d="M3.5 16h17M7 16v2M17 16v2"/><circle cx="8" cy="12.5" r="0.8"/><circle cx="16" cy="12.5" r="0.8"/>',
  moto: '<circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path d="M6 16l3-6h5l2 6M14 10l-1-3h-2"/>',
  bike: '<circle cx="6" cy="16" r="3.2"/><circle cx="18" cy="16" r="3.2"/><path d="M6 16l3.5-7h5L18 16M9.5 9L12 16M8.5 7h2.5M14.5 9l-.7-2H16"/>',
  onibus:
    '<rect x="4" y="4.5" width="16" height="12.5" rx="2.2"/><path d="M4 11h16M7 20v-3M17 20v-3"/><circle cx="8" cy="14" r="0.8"/><circle cx="16" cy="14" r="0.8"/>',
  metro: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M7.5 16.5v-7l4.5 5 4.5-5v7"/>',
  vlt: '<path d="M8 3h8M12 3v3"/><rect x="5" y="6" width="14" height="11" rx="2.5"/><path d="M5 12h14M8 20l1.5-3M16 20l-1.5-3"/>',
  trem: '<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M5 10.5h14M8 20l2-3.5M16 20l-2-3.5"/><circle cx="9" cy="13.5" r="0.8"/><circle cx="15" cy="13.5" r="0.8"/>',
  barca: '<path d="M3 14h18l-2.4 5H5.4L3 14Z"/><path d="M6 14v-4h12v4M10 10V6h4v4"/>',

  // Confiança: forma, além da cor
  "conf-oficial": '<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/>',
  "conf-confirmado": '<path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z"/>',
  "conf-relato": '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/>',

  // Interface
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  busca: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
  local: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3.3M12 18.2v3.3M2.5 12h3.3M18.2 12h3.3"/><circle cx="12" cy="12" r="7.2"/>',
  rota: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  fechar: '<path d="m6 6 12 12M18 6 6 18"/>',
  mapa: '<path d="m3.5 6.5 5-2 7 2.5 5-2v12.5l-5 2-7-2.5-5 2V6.5Z"/><path d="M8.5 4.5v12.5M15.5 7v12.5"/>',
  feed: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  predios: '<path d="M4 20V9l6-3v14M10 20V4l6 2.5V20M16 20v-8l4-1.5V20M3 20h18"/>',
  som: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  "som-off": '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/>',
} as const;

export type IconeId = keyof typeof TRACOS;

/** SVG completo como texto, para virar imagem no canvas do mapa. */
export function svgDoIcone(id: IconeId, cor: string, largura = 24): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${largura}" height="${largura}" fill="none" stroke="${cor}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${TRACOS[id]}</svg>`;
}
