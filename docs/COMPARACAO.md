# Comparação: resumo-projeto-hackathon.md (conversa anterior) × plano atual

## O que o resumo tem e o plano não tinha (incorporar)
1. **Fontes do Rio com endereço real** (testado em 2026-11-26 na busca do Data.Rio):
   - Estações Alerta Rio: `pgeo3.rio.rj.gov.br/arcgis/rest/services/Geotecnia/Estacoes_AlertaRio/FeatureServer/0`
   - Zonas pluviométricas: `.../Estacoes_AlertaRio/FeatureServer/1`
   - Limite de bairros: `pgeo3.rio.rj.gov.br/arcgis/rest/services/Cartografia/Limites_administrativos/MapServer/4`
   - Subprefeituras: `.../Cartografia/Subprefeituras/MapServer/0`
   - São serviços ArcGIS (consulta com `/query?where=1=1&f=geojson`). Ainda não consultei os dados de chuva em tempo real nem as ocorrências do COR; falta achar o conjunto.
2. **Mobilidade do COR** (GPS de ônibus, faixas exclusivas, ocorrências) via Datalake/Data.Rio. Não estava no plano.
3. **Cruzar tudo por bairro** (ponto dentro do polígono). Útil também para nós: resumo por bairro.
4. **Fallback com dado histórico, rotulado como tal.** Melhor que o meu "arquivo de exemplos": usar histórico real.
5. **Notícias:** resumo por IA em palavras próprias, com atribuição e link; cuidado com imagens (direitos autorais): usar ícone por categoria.
6. **Hospedagem gratuita "dorme":** aquecer o backend antes da demo.
7. **Pitch de 30 segundos** e a frase-modelo ("Hoje na Tijuca: chuva forte e desvio de ônibus na Av. Maracanã").
8. **Perguntar à organização se testar APIs e cadastros antes do dia é permitido.** Faz sentido, e eu já adiantei preparo sem código; vale confirmar por escrito.
9. Tema da inscrição: "cidade e dia a dia"; o mural da Networking Night pode virar desafio oficial.

## Conflitos entre os dois (decidir)
| Tema | Resumo antigo | Plano atual | Minha sugestão |
|---|---|---|---|
| Alcance | Só Rio, por bairro | Brasil inteiro | Rio completo primeiro (mais fontes), com a arquitetura aceitando outras cidades |
| Interação | Só consulta, sem alertas | Alertas automáticos + bot Telegram | Consulta no painel é o núcleo; alertas e Telegram são camada extra, cortada às 15h se faltar tempo |
| Eixo | Bairro | Lugar e trajeto | Bairro como padrão simples; trajeto como diferencial |
| Stack | Python/FastAPI + React | TypeScript em tudo | Decidir com o time; TS em tudo evita dois ambientes em 6h30 |
| IA | Só resumos e extração de bairro | Agente com ferramentas e confiança | Manter o agente; o resumo por bairro vira uma ferramenta dele |
| Perfis | Qualquer carioca | 3 perfis | Perfis só mudam o tom e a prioridade |

## Pendente
- Confirmar que a inscrição foi aprovada e o endereço do evento.
- Consultar chuva em tempo real e as ocorrências do COR (ver FONTES.md).
