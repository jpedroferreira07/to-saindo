# Tô saindo · Plano do app (versão 3, Builders Day 28/11/2026)

> **Leia este arquivo inteiro antes de escrever qualquer código.** Ele substitui o plano anterior (avisos por WhatsApp/Telegram e cena 3D). Quando este arquivo e outro documento de `docs/` discordarem, **este vale**. `docs/FONTES.md` continua valendo para as URLs e os testes das fontes.

---

## 1. O que mudou (depois da conversa com o mentor)

| Antes | Agora |
|---|---|
| A conversa no WhatsApp/Telegram era o produto | **O app web é o produto.** Sem bot, sem WhatsApp, sem Telegram |
| Site de entrada com cena 3D | **App com 2 abas: Mapa e Feed**, visão de cima como Google Maps ou Waze |
| Só fontes oficiais e notícias | Fontes oficiais + notícias + **reportes dos usuários**, com triagem por agente de IA |
| Zeladoria fora do escopo | **Zeladoria entra**: árvore caída, luz queimada |
| Rota alternativa por link | **Navegação de A até B dentro do app**, com as ocorrências do caminho |

Continua igual: **só a cidade do Rio de Janeiro**, toda ocorrência com **fonte, horário e confiança**, e **nunca rotular bairro ou comunidade como perigoso** (falamos de eventos datados que expiram).

---

## 2. O produto em uma frase

Um mapa colaborativo do Rio que mostra, em tempo real, o que está acontecendo em cada bairro (árvore caída, luz queimada, trânsito, assalto, tiroteio, chuva) e deixa qualquer pessoa reportar o que viu, com um agente de IA que confere, classifica e junta os reportes antes de publicar.

**Para quem:** quem mora ou circula no Rio e quer saber como está o bairro ou o caminho antes de sair.
**Próximo passo (só no pitch, não construir hoje):** visão agregada para a Secretaria de Segurança e a Prefeitura (onde há mais ocorrências por tipo e período). Ver seção 12.

---

## 3. Escopo de hoje

### Mínimo funcional (pronto até 15:00, senão corta)
1. **Aba Mapa**: mapa do Rio (limitado à cidade), busca no topo, escolha de bairro, balões de ocorrência com ícone por tipo, atualização em tempo real.
2. **Navegação A → B**: duas buscas (origem e destino), rota desenhada no mapa e lista das ocorrências perto da rota.
3. **Aba Feed**: lista de alertas em texto, mais novos primeiro, com filtro por tipo e por bairro.
4. **Reportar**: botão fixo que abre o formulário (tipo, ponto no mapa, descrição curta); o agente faz a triagem e o reporte aparece no mapa e no feed.
5. **Dados reais** de pelo menos 2 fontes (Alerta Rio e Fogo Cruzado) + reportes. Plano B: eventos de exemplo rotulados como exemplo.

### Extras (só se sobrar tempo, nesta ordem)
1. "Eu também vi" num reporte (confirmação por outros usuários).
2. Notícias do G1 classificadas e geolocalizadas pelo agente.
3. Resumo do bairro gerado pelo agente no topo do feed ("Agora na Tijuca: 2 ocorrências de trânsito, chuva moderada").
4. Modo de transporte na navegação (carro, bike, a pé).

### Fora de hoje (decidido)
Login e cadastro, foto no reporte, WhatsApp e Telegram, app nativo, mapa de calor, painel da Secretaria, notificação push.

---

## 4. Telas e fluxos

### 4.1 Estrutura geral (mobile first)
- Barra de abas embaixo no celular (no topo no desktop): **Mapa** | **Feed**.
- Botão flutuante **"Reportar"** visível nas duas abas.
- Seletor de bairro compartilhado entre as abas: escolher Tijuca no mapa já filtra o feed por Tijuca (estado global, guardado na URL `?bairro=tijuca` para dar para compartilhar).

### 4.2 Aba Mapa
- **Mapa**: visão de cima, ruas legíveis, centralizado no Rio. **Limitado à cidade**: `maxBounds` aproximado `[[-43.80, -23.09], [-43.09, -22.74]]` (lng, lat) e zoom mínimo ~10.
- **Busca no topo**: campo único que aceita bairro, endereço ou ponto conhecido ("Maracanã"). Primeiro procura na lista local de bairros (`src/lib/bairros.ts`), depois no geocodificador (rota `/api/geocodificar`), sempre restrito ao Rio. Resultado: o mapa voa até o lugar.
- **Escolha de bairro**: pela busca, por uma lista de bairros ou pelo botão "Usar minha localização" (só com permissão; se negar, segue sem). Com bairro escolhido, o mapa mostra os balões daquele bairro e um resumo curto ("5 ocorrências ativas").
- **Balões**: um por ocorrência ativa, com o ícone do tipo (seção 6). Clique abre um cartão: título, tipo, bairro, "registrado às 14h05", fonte, confiança, link da fonte quando houver. Muitos balões juntos viram um grupo com o número (cluster).
- **Tempo real**: ocorrência nova aparece sem recarregar (seção 8.3), com uma animação curta; some sozinha quando expira.
- **Navegação A → B**: botão "Como chegar" abre a segunda busca (origem e destino; origem pode ser "minha localização"). Mostra a rota desenhada, distância e tempo estimado (sem trânsito em tempo real, dizer isso na tela) e a lista "No caminho: 2 ocorrências" com as que estão a até ~500 m da rota. Sem rota alternativa automática hoje.

### 4.3 Aba Feed
- Lista de cartões em forma de alerta, mais novos primeiro. Cada cartão: ícone, título, bairro, há quanto tempo e a hora exata, fonte, selo de confiança, botão "Ver no mapa".
- **Filtros**: chips por tipo (seleção múltipla) e seletor de bairro. Filtros também ficam na URL.
- Item novo em tempo real: aviso "3 novos alertas" no topo, sem pular a lista enquanto a pessoa lê.
- Estado vazio honesto: "Nenhuma ocorrência ativa na Tijuca agora." Erro de rede: mensagem e botão "Tentar de novo".

### 4.4 Reportar
1. **Tipo**: grade de ícones (seção 6). Opcional: dá para pular e o agente deduz pelo texto.
2. **Local**: alfinete no centro do mapa que a pessoa arrasta; começa na localização dela ou no bairro escolhido. Fora do Rio, o botão de enviar fica bloqueado com a explicação.
3. **Descrição**: até 280 caracteres. Dica no campo: "O que você viu e onde? Não escreva nomes, placas ou descrição de pessoas."
4. **Enviar** → `POST /api/reportes` → o agente faz a triagem (seção 7) → resposta na tela:
   - "Publicado como não confirmado. Obrigado!"
   - "Já tinha um reporte disso aqui perto. Contamos o seu como confirmação."
   - "Não publicamos: <motivo curto>." (sem expor regra interna)

---

## 5. Stack e o que já existe no repositório

- **Next.js 16 (App Router) + React 19 + TypeScript**, deploy na Vercel. Já instalado.
- **Mapa: MapLibre GL JS** com estilo vetorial gratuito do **OpenFreeMap** (sem chave). Leaflet é o plano B se o MapLibre travar. Mostrar "© OpenStreetMap contributors" e "OpenFreeMap".
- **Banco e tempo real: Supabase** (Postgres + Realtime), região São Paulo, plano grátis.
- **Agente: Claude API** (`@anthropic-ai/sdk`). `claude-haiku-5-5` para triagem e classificação (rápido e barato); `claude-sonnet-5-5` só para o resumo do bairro, se entrar.
- **Rotas: OpenRouteService** (`https://api.heigit.org/openrouteservice/v2/directions/...`, chave já existe). **Endereços: Nominatim** com `viewbox` + `bounded=1`, máximo 1 requisição por segundo, cache, chamado só pelo servidor.
- **Geometria: turf.js** (ponto no bairro, distância até a rota).
- **Validação: zod** em toda entrada de rota de API e em toda saída do agente.
- **Testes: vitest** (já configurado; `npm test`).

Bibliotecas a instalar: `maplibre-gl`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `@turf/turf`, `zod`. **Ler a documentação atual de cada uma antes de usar** (as APIs mudam entre versões).

### Reaproveitar (não reescrever)
- `src/lib/eventos.ts`: tipo `Evento`, `estaAtivo`, `horaDoRio`, `eventosExemplo` (plano B), `lerLinhaDoBanco` (validação). **Estender** com os tipos novos da seção 6.
- `src/lib/bairros.ts`: `BAIRROS`, `normalizar`, `resolverBairro`, `posicaoDoBairro`.
- `src/lib/trajeto.ts` e `src/lib/geo.ts`: lógica de "evento perto do trajeto" (adaptar para a linha da rota real do ORS).
- `src/components/icones.tsx`: `IconeCategoria`, `IconeConfianca`, `IconePin` (adicionar os ícones novos no mesmo estilo).
- `docs/design/DIRECAO-VISUAL.md`: cores e fontes continuam (cores B, Doto + Sora). A cena 3D, os sons e o `Letreiro` saem do caminho principal.

---

## 6. Tipos de ocorrência e ícones

Cada tipo tem **ícone próprio + cor da categoria + rótulo em texto**. Nunca indicar tipo ou confiança só pela cor.

| Categoria (cor) | Tipo (`tipo`) | Ícone sugerido | Expira em | Fontes |
|---|---|---|---|---|
| Segurança | `tiroteio` | alvo / disparo | 3 h | Fogo Cruzado, usuário |
| Segurança | `assalto` | bolsa / mão | 3 h | usuário |
| Mobilidade | `transito` | carro com fila | 2 h | notícia, usuário |
| Mobilidade | `acidente` | carro batido / triângulo | 2 h | notícia, usuário |
| Mobilidade | `transporte` | ônibus / trem | 3 h | operadoras, notícia, usuário |
| Clima | `chuva` | nuvem com gotas | 6 h | Alerta Rio |
| Clima | `alagamento` | ondas | 6 h | notícia, usuário |
| Zeladoria | `arvore_caida` | árvore tombada | 24 h | usuário |
| Zeladoria | `luz_queimada` | poste / lâmpada apagada | 72 h | usuário |
| Zeladoria | `buraco` | buraco na pista | 72 h | usuário |
| Geral | `outro` | balão com "!" | 6 h | usuário |

A validade conta a partir da **hora do ocorrido**. Evento expirado some do mapa e do feed.

**Confiança** (selo com ícone + texto):
- `oficial`: veio de fonte oficial (Alerta Rio, operadora).
- `confirmado`: fonte jornalística ou de dados reconhecida (Fogo Cruzado, G1) ou **2+ reportes independentes** do mesmo evento.
- `relato`: um reporte isolado. Rótulo na tela: **"não confirmado"**.

---

## 7. O agente de IA (fluxo agêntico, 20% da nota)

O agente é o que torna o mapa colaborativo confiável. Ele roda **no servidor**, nunca no navegador.

### 7.1 Triagem de reporte (obrigatório)
Entrada: texto do usuário, tipo escolhido (ou vazio), lat/lng, horário.
Ferramentas (tool use) que o agente pode chamar:
- `bairro_do_ponto(lat, lng)` → nome do bairro (turf + polígonos do Data.Rio, ou bairro mais próximo da lista local).
- `ocorrencias_proximas(lat, lng, raio_m, tipo, desde)` → eventos ativos parecidos, para detectar duplicata.

Saída **estruturada e validada com zod**:
```json
{
  "decisao": "publicar | juntar | recusar",
  "tipo": "arvore_caida",
  "titulo": "Árvore caída bloqueando uma faixa",
  "severidade": 1,
  "evento_existente_id": null,
  "motivo": "texto curto para o usuário, só quando recusar"
}
```
Regras do prompt:
1. `recusar` quando: ofensa, spam, piada, fora do Rio, sem relação com a cidade, ou acusação a pessoa identificável.
2. **Remover dados pessoais** do título: nomes, placas, telefones, e **nenhuma descrição física de suspeito** (cor de pele, roupa, idade) em assalto ou tiroteio. Isso evita estigma e perfilamento.
3. Título neutro, curto, sem sensacionalismo, sem dizer "área perigosa".
4. `juntar` quando há ocorrência ativa do mesmo tipo a até ~300 m nas últimas 2 h: soma uma confirmação; com 2+ reportes vira `confirmado`.
5. Na dúvida entre publicar e recusar, publica como `relato` (não confirmado).
6. Se a API do Claude falhar ou passar de ~8 s: salvar o reporte como `pendente`, publicar como `relato` com o tipo escolhido pelo usuário e título genérico do tipo (sem o texto livre), e registrar o erro. O app não pode travar por causa do agente.

### 7.2 Classificação de notícias (extra 2)
Coletor lê o RSS do G1 Rio a cada 10 min → o agente decide se é ocorrência na cidade, extrai tipo, bairro ou via, e devolve lat/lng aproximado (via geocodificador) → evento `confirmado` com link da notícia. Notícia que não é ocorrência é descartada.

### 7.3 Resumo do bairro (extra 3)
Sonnet recebe as ocorrências ativas de um bairro e escreve 1 ou 2 frases factuais, citando fonte e horário. Cache de 5 min por bairro para não gastar.

### Custos
Limite de gasto configurado no console da API para o dia. Triagem com Haiku, `max_tokens` baixo, sem histórico de conversa.

---

## 8. Dados

### 8.1 Tabelas (Supabase)
**events** (o que aparece no mapa e no feed):
`id uuid`, `tipo text`, `categoria text`, `titulo text`, `descricao text null`, `lat float8`, `lng float8`, `bairro text`, `inicio timestamptz` (hora do ocorrido), `expira_em timestamptz`, `fonte text` ("Alerta Rio", "Fogo Cruzado", "G1 Rio", "Usuários"), `url text null`, `origem text` (`oficial` | `noticia` | `usuario`), `confianca text` (`oficial` | `confirmado` | `relato`), `severidade int` (1 a 3), `confirmacoes int default 1`, `id_externo text null` (id na fonte, para não duplicar), `exemplo bool default false`, `criado_em timestamptz default now()`.
Índices: `(expira_em)`, `(bairro, expira_em)`, único em `(fonte, id_externo)`.

**reports** (entrada bruta dos usuários, nunca lida pelo navegador):
`id uuid`, `texto text`, `tipo_sugerido text null`, `lat`, `lng`, `dispositivo_hash text` (hash de um id aleatório guardado no localStorage), `status text` (`pendente` | `publicado` | `juntado` | `recusado`), `event_id uuid null`, `motivo text null`, `criado_em`.

### 8.2 Segurança (RLS)
- RLS ligado nas duas tabelas.
- `events`: leitura pública só de linhas com `expira_em > now()`. Nenhuma escrita pelo navegador.
- `reports`: nenhum acesso pelo navegador. Só o servidor, com a chave de serviço.
- Chave de serviço do Supabase, chave da Claude API, chave do ORS e senha do Fogo Cruzado: **só em variáveis de ambiente do servidor**. No navegador, só a URL do Supabase e a chave pública (anon). Atualizar o `.env.example` com os nomes (sem valores).

### 8.3 Tempo real
O navegador assina **Supabase Realtime** (`postgres_changes` na tabela `events`, eventos INSERT e UPDATE). Plano B se o Realtime falhar: recarregar `/api/ocorrencias` a cada 30 s.

### 8.4 Coletores
Rota `/api/coletar` (protegida por um segredo no cabeçalho) que busca as fontes e grava em `events` sem duplicar (`fonte` + `id_externo`). Chamada a cada 5 a 10 min pelo Vercel Cron ou, na demo, por um notebook. Alerta Rio: só estações com chuva acima de "fraca" viram evento. Fogo Cruzado: só a cidade do Rio. Detalhes e URLs em `docs/FONTES.md` e `docs/FOGOCRUZADO.md`.

---

## 9. Contratos das rotas de API

Todas validam a entrada com zod e respondem JSON. Erro: `{ "erro": "mensagem curta" }` com o status HTTP certo.

| Rota | Entrada | Saída |
|---|---|---|
| `GET /api/ocorrencias?bairro=&tipos=a,b&bbox=` | filtros opcionais | `Evento[]` ativos, mais novos primeiro (máx. 300) |
| `POST /api/reportes` | `{ texto, tipo?, lat, lng, dispositivo }` | `{ decisao, evento?, motivo? }` |
| `POST /api/reportes/:id/confirmar` (extra) | `{ dispositivo }` | `{ confirmacoes, confianca }` |
| `GET /api/geocodificar?q=` | texto (2 a 120 caracteres) | `[{ nome, lat, lng, bairro? }]` só dentro do Rio |
| `POST /api/rota` | `{ origem: [lng,lat], destino: [lng,lat], modo? }` | `{ geometria (GeoJSON LineString), distancia_m, duracao_s, ocorrencias: Evento[] }` |
| `POST /api/coletar` | cabeçalho `x-segredo` | `{ inseridos, ignorados, erros }` |
| `GET /api/bairros/:nome/resumo` (extra) | nome do bairro | `{ texto, gerado_em }` |

**Proteção contra abuso** em `/api/reportes`: máximo 5 reportes por dispositivo a cada 10 min e por IP; texto de 5 a 280 caracteres; lat/lng dentro do Rio; o mesmo dispositivo não confirma o próprio reporte nem confirma duas vezes.

---

## 10. Divisão do time e horário

São 3 pessoas, cada uma com seu assistente de IA. Cada pessoa só mexe nas pastas dela; o que for compartilhado (tipos em `src/lib/eventos.ts`) muda só com aviso no grupo.

| Pessoa | Responsável por | Pastas |
|---|---|---|
| **1. Dados** | Supabase (tabelas, RLS, Realtime), coletores (Alerta Rio, Fogo Cruzado, G1), `/api/ocorrencias`, `/api/coletar`, cron | `src/app/api/ocorrencias`, `src/app/api/coletar`, `src/lib/coletores/`, `supabase/` |
| **2. Agente e rotas** | Triagem de reportes, classificação de notícias, `/api/reportes`, `/api/geocodificar`, `/api/rota`, testes do agente | `src/app/api/reportes`, `src/app/api/geocodificar`, `src/app/api/rota`, `src/lib/agente/` |
| **3. Front (Bernardo)** | Abas, mapa, busca, balões, navegação, feed, formulário de reporte, acessibilidade, deploy | `src/app/(app)/`, `src/components/` |

**Enquanto a API não existir, o front usa `eventosExemplo()`** e respostas falsas com o mesmo formato dos contratos da seção 9. Ninguém espera ninguém.

| Horário | Marco |
|---|---|
| até 11:30 | Ler este plano; instalar bibliotecas; criar o projeto no Supabase e as tabelas; `.env.example` atualizado |
| 11:30 a 12:30 | Cada um no seu bloco, com dados de exemplo |
| **12:30** | **Integração 1**: front lendo `/api/ocorrencias` real; reporte chegando no banco |
| 12:30 a 15:00 | Triagem pelo agente, Realtime, navegação A → B, filtros do feed |
| **15:00** | **Integração 2 e corte**: o que não funciona sai. Só correção de bug daqui em diante |
| 15:00 a 16:00 | Testes dos fluxos, deploy na Vercel, README com prints e atribuições |
| 16:00 a 16:30 | Ensaio da demo |
| **17:30** | **Prazo duro: nenhum commit depois disso** (desclassifica). Último push seguro ~17:20 |

---

## 11. Regras de qualidade (valem para todo código)

- **Nunca** subir chave, senha ou `.env` para o Git. O repositório é público.
- Commits pequenos, em português, no formato `feat(escopo): mensagem`. Cada um mexe só nas suas pastas.
- Antes de commitar: `npm run lint`, `npm run typecheck` e `npm test` limpos. Antes do deploy: `npm run build`.
- **Testes mínimos** (vitest): validação da saída do agente (zod), expiração por tipo, deduplicação de reporte (~300 m / 2 h), "evento perto da rota" (~500 m), limite do Rio.
- Toda entrada de usuário e toda resposta de API externa é **não confiável**: validar antes de usar.
- Tratamento de erro em toda chamada externa (ORS, Nominatim, Claude, fontes), com mensagem útil na tela e plano B.
- **Acessibilidade (WCAG 2.1 AA)**: contraste, navegação por teclado nas abas, filtros e formulário; ícones com texto alternativo; **o feed é a alternativa acessível ao mapa**; foco visível; botão de reportar com rótulo.
- Horários sempre no fuso do Rio (`America/Sao_Paulo`), formato "registrado às 14h05". Nunca escrever "acontecendo agora" para dado que pode ter atraso (Fogo Cruzado).
- Dado de exemplo sempre marcado como exemplo na tela.
- **Linguagem**: falar do evento, do local e do horário. Nunca "bairro perigoso", "área de risco", "evite a comunidade X".

---

## 12. Pitch (o que contar aos jurados)

1. **Problema**: no Rio, para saber se dá para sair, a pessoa abre 4 apps e 2 grupos de WhatsApp, e metade é boato.
2. **Demo**: escolher um bairro → ver os balões → abrir o feed filtrado → traçar uma rota e ver as ocorrências do caminho → reportar uma árvore caída pelo celular do jurado → o balão aparece no telão em tempo real, já classificado pelo agente.
3. **Diferencial**: o agente de IA confere cada reporte (tipo, bairro, duplicata, dados pessoais) e mostra fonte, horário e confiança em tudo. Colaborativo sem virar boato.
4. **Impacto e próximo passo**: os mesmos dados, agregados por tipo e período, viram um painel para a Secretaria de Segurança e a Prefeitura (onde falta iluminação, onde caem mais árvores, onde há mais ocorrências), sem mancha permanente sobre comunidades.
5. **Honestidade**: dizer quais fontes estão ao vivo e quais dados são de exemplo.

---

## 13. Checklist de pronto

- [ ] Mapa limitado ao Rio, com busca e escolha de bairro
- [ ] Balões com ícone por tipo e cartão com fonte, horário e confiança
- [ ] Ocorrência nova aparece sem recarregar
- [ ] Navegação A → B com a rota e as ocorrências do caminho
- [ ] Feed com filtro por tipo e por bairro
- [ ] Reporte de ponta a ponta com triagem do agente (publicar, juntar, recusar)
- [ ] Plano B do agente e das fontes funcionando
- [ ] RLS ligado e nenhuma chave no navegador ou no Git
- [ ] Lint, typecheck, testes e build limpos
- [ ] Deploy na Vercel e README com prints e atribuições
