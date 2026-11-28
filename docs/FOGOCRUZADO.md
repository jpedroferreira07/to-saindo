# Fogo Cruzado API v2: como entra no projeto

Fonte: texto de contexto que o time já tinha (conversa anterior) + documentação oficial (https://api.fogocruzado.org.br/docs). Não testado com login, porque falta a conta.

## Verificado em 2026-11-26 (teste do Bernardo no PowerShell, com login real)
- Login funciona (HTTP 200). Estados: Bahia, Pará, Pernambuco, Rio de Janeiro. RJ tem 21 cidades (região metropolitana).
- `GET /occurrences?order=DESC&page=1&take=3&idState=<RJ>&initialdate=<-30d>&finaldate=<hoje>` devolveu `code, data, msg, msgCode, pageMeta`: **236 ocorrências em 30 dias no RJ (~8/dia)**, 79 páginas com take=3.
- `X-Last-Update` presente (`2026-11-26T16:14:59-03:00`). Ocorrência mais recente: `2026-11-26T12:30:00.000Z` (Maré, Rio). **Atenção ao fuso:** o campo vem com "Z", mas o texto de contexto diz que já é horário de Brasília. Se for horário local, o atraso é ~4h; se for UTC, ~7h. Comparar com um tiroteio conhecido antes de decidir.
- **Não explicado:** a consulta anterior (`order=ASC`, `take=5`, janela de 3 dias) voltou vazia. Pode ser o `ASC`, o tamanho da janela ou outra coisa. Até testar, usar `DESC` e janela de 30 dias e filtrar por data no nosso lado.
- Bairros vêm em MAIÚSCULAS e sem acento (ex.: MARE, CURICICA). Normalizar para casar com o limite de bairros do Data.Rio. Cidades fora da capital (ex.: Guapimirim) não têm polígono de bairro do Rio: usar só a cidade.
- Com ~8 eventos por dia no estado todo, a camada de tiroteio é esparsa. A demo de alerta ao vivo não pode depender de um tiroteio novo aparecer: ter o evento de exemplo pronto.

## Fatos que mudam o plano
- **Cobertura:** regiões metropolitanas do Rio (desde 2016), Recife (2018), Bahia (2022) e Pará (2023). Fora disso, "sem dados de tiroteio nesta região".
- **Autenticação NÃO é token fixo:** login com e-mail e senha (`POST /auth/login`) devolve JWT que vale 1h; renovar com `POST /auth/refresh`. Variáveis: `FOGOCRUZADO_EMAIL` e `FOGOCRUZADO_PASSWORD`, só em `.env`. Em 401, refazer login e repetir a chamada uma vez.
- Base: `https://api-service.fogocruzado.org.br/api/v2` (o outro domínio é só a documentação).
- **Não há filtro por coordenada.** Busca-se por estado/cidade + intervalo de datas e filtra-se por distância no nosso banco.
- Paginação: percorrer `page` enquanto `hasNextPage`.
- Datas já em America/Sao_Paulo; `latitude`/`longitude` vêm como string.
- Os headers `X-Last-Update` e `X-Last-Update-State` permitem checar se há dado novo antes de baixar tudo.
- IDs de estado e cidade: resolver por `/states` e `/cities` na inicialização, nunca fixar no código.

## Mapeamento ocorrência → evento (tabela `events`)
| Campo do evento | Origem |
|---|---|
| tipo | `tiroteio` |
| lat / lng | `latitude` / `longitude` (converter para número) |
| inicio | `date` |
| expira_em | inicio + 3h (+ até 6h se `clippings` tiver "Tiroteio contínuo") |
| titulo/descricao | gerados do `mainReason`, bairro e cidade, sem dados de vítimas |
| severidade | 3: chacina, mortos ou tiroteio contínuo; 2: feridos, ação ou operação policial; 1: demais |
| confianca | `confirmado` (dado curado pelo Instituto Fogo Cruzado, não é órgão oficial) |
| fonte / url | "Fogo Cruzado" + link do site |
| hash_dedup | id da ocorrência |

## O que o arquivo trouxe e eu não tinha (aproveitar)
1. **`transports[]` com `interruptedTransport`:** mostra metrô/BRT/trem interrompido por tiroteio. Alimenta a camada `transporte` direto, sem scraping.
2. **`qualifications` das vítimas** (entregador/motoboy, motorista de aplicativo, mototaxista): confirma que o perfil entregador/motorista tem dado próprio. Usar só **agregado** ("motoboys foram atingidos nesta região este mês"), nunca por pessoa.
3. **`policeAction`/`agentPresence`/"Operação policial":** o agente pode distinguir operação policial planejada de disputa, e avisar com a linguagem certa.
4. **`clippings` ("Tiroteio contínuo", "Tiros de helicóptero", "Bar", "Shopping")** como contexto na resposta.
5. **`X-Last-Update`** para o worker de coleta poupar chamadas.
6. **Histórico desde 2016:** permite "nesta região, em média, quantos tiroteios por semana", útil para o morador escolher horário. Cuidado de texto: falar de frequência de eventos datados, nunca de "região perigosa" (regra do DESIGN).

## O que melhorar / cuidados
- **Privacidade:** a API traz idade, raça, gênero e situação de vítimas. **Não guardar nem mostrar.** Salvar só contagens (mortos/feridos).
- **Latência desconhecida:** os dados são curados, então podem chegar com atraso. Medir no primeiro acesso a diferença entre `date` e quando aparece; o agente deve dizer "registrado às X", nunca "está acontecendo agora" sem checar.
- **Termos de uso:** a equipe do Fogo Cruzado envia termos e condições; ler antes do dia 28 (atribuição, limites de requisição, uso comercial).
- Valores de `typeOccurrence` além de `withVictim` não estão documentados: testar com o acesso, sem presumir.
- Campos podem vir `null` (idade, raça, bairro); a coleta precisa tolerar isso.
