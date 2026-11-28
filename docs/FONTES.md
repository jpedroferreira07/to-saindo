# Fontes de dados (Rio de Janeiro)

Atualizado em 2026-11-26. Testes feitos com `curl` e PowerShell em endpoints públicos; nada disso é código do app.
Escopo: **só Rio de Janeiro** (decisão do time). Chaves e senhas ficam só no `.env` de cada um.

## Em uso
| Camada | Fonte | Situação | Chave? |
|---|---|---|---|
| Chuva em tempo real | Alerta Rio: `https://alertario.rio.rj.gov.br/upload/xml/Chuvas.xml` | **Funciona.** XML com 33 estações, lat/lon, bacia e chuva acumulada em 5/10/15 min e 1/4/24/96 h. Atualiza a cada ~15 min | Não |
| Bairros (polígonos) | Data.Rio: `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Cartografia/Limites_administrativos/MapServer/4` | **Existe** (serviço ArcGIS; baixar com `/query?where=1=1&outFields=*&f=geojson`). Download do GeoJSON completo ainda não testado | Não |
| Estações Alerta Rio (cadastro) | Data.Rio: `.../Geotecnia/Estacoes_AlertaRio/FeatureServer/0` | **Funciona**, mas em coordenadas SIRGAS 2000 / UTM 23S (EPSG 31983). Pedir `outSR=4326` na consulta ou usar o lat/lon do `Chuvas.xml` | Não |
| Previsão | Open-Meteo: `https://api.open-meteo.com/v1/forecast` | **Funciona** | Não |
| Tiroteio | Fogo Cruzado v2: `https://api-service.fogocruzado.org.br/api/v2` | **Login testado.** ~8 ocorrências/dia no RJ, 21 cidades da região metropolitana. Detalhes e pendências em `FOGOCRUZADO.md` | Sim (e-mail e senha) |
| Notícias | G1 Rio `https://g1.globo.com/rss/g1/rio-de-janeiro/` e Google News RSS (`news.google.com/rss/search?q=<termo>&hl=pt-BR&gl=BR&ceid=BR:pt-419`) | **Funciona** | Não |
| Endereços | Nominatim (OSM) | **Funciona.** Máx. 1 req/s, User-Agent próprio, guardar em cache. Limitar ao Rio (parâmetros `viewbox` + `bounded=1`) | Não |
| Rotas carro/moto | OpenRouteService, **endereço novo** `https://api.heigit.org/openrouteservice/v2/directions/driving-car` | **Funciona com chave.** Campo Grande → Centro: 53,4 km/51 min; evitando trecho da Av. Brasil (`avoid_polygons`): 55,2 km/61 min. Tempo sem trânsito. O endereço antigo `api.openrouteservice.org` foi desligado em 2026-11-24 | Sim (grátis) |

## Fora do ar ou descartado
| Fonte | Situação | O que fazer |
|---|---|---|
| Datalake da Prefeitura `api.dados.rio` (ocorrências do COR, GPS de ônibus) | 503 em todos os caminhos testados | Retestar na sexta e no dia. Enquanto isso, mobilidade entra pelas notícias |
| `websempre.rio.rj.gov.br/json/chuvas` | Bloqueado por firewall | Não usar (o `Chuvas.xml` cobre) |
| `Previsao.xml` do Alerta Rio | Responde, conteúdo não lido | Opcional; Open-Meteo cobre |
| OSRM público, INMET | Falharam daqui | Não são mais necessários (ORS cobre rotas; foco no Rio) |

## Atribuição obrigatória (mostrar no site e no README)
- Mapas e endereços: "© colaboradores do OpenStreetMap".
- Rotas: openrouteservice / HeiGIT.
- Tiroteios: Instituto Fogo Cruzado (conferir a exigência exata nos termos de uso).
- Chuva: Alerta Rio / Prefeitura do Rio. Notícias: nome do portal + link em cada item.
