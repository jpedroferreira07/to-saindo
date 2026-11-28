# Escopo decidido (2026-11-26) — vale mais que PLANO.md onde houver conflito

> **Histórico.** Superado pela versão 2 em `RESUMO-PARA-O-GRUPO.md` (WhatsApp + Telegram, site como entrada + mapa). Mantido só como registro.

## Decisões do Bernardo
- **Só Rio de Janeiro** (Fogo Cruzado cobre o Rio; Data.Rio/COR/Alerta Rio são do Rio).
- **Consulta** pelo site/app e **alertas**.
- **Eixos unidos:** o bairro é a porta de entrada ("o que está acontecendo em cada lugar") e o trajeto é o aprofundamento ("e no meu caminho?").

## Produto em uma frase
Escolha um bairro, um lugar ou um trajeto e veja, em linguagem simples, clima, mobilidade, tiroteios registrados e notícias do que está acontecendo agora, com confiança e fonte, e receba alerta quando algo mudar no que você salvou.

## Fluxo do usuário
1. **Bairro:** busca na lista de bairros oficiais; tela com 4 abas (Clima, Mobilidade, Segurança, Notícias) e um resumo de IA no topo.
2. **Lugar:** o mesmo, centrado num endereço ou ponto salvo (casa, trabalho, faculdade).
3. **Trajeto:** origem → destino + horário; o agente lista o que está no corredor da rota e recomenda ação.
4. **Alertas:** o usuário salva bairros, lugares e trajetos; evento novo que cruza com o salvo gera aviso.

## Minhas decisões (como proposta; vale o que o time disser)
- **Canal:** site responsivo publicado (PWA instalável no celular) como produto principal; alertas por **Telegram** (mais rápido de fazer que push web) e também em destaque no site. O bot de Telegram e as chaves ficam para depois, como combinado.
- **Painel é o núcleo; alertas e trajeto entram em seguida.** Ordem de construção no dia: bairro+abas → lugar → trajeto → alertas.
- **Stack:** TypeScript em tudo (Next.js + MapLibre/Leaflet + Supabase) para evitar dois ambientes em 6h30. O resumo antigo sugeria Python/FastAPI; trocar só se o time preferir.
- **Cruzamento por bairro:** polígonos do Data.Rio no Supabase/PostGIS (ponto dentro do polígono); dado de estação, ponto GPS ou endereço vira bairro.
- **Fallback:** dado histórico real, rotulado "histórico"; os eventos de exemplo só como último recurso.
- **Agente:** ferramentas `resumo_do_bairro`, `eventos_no_trajeto`, `buscar_eventos`, `clima_agora`, `geocodificar`, com a regra de citar fonte, horário e confiança.
- **Perfis (morador, entregador, turista):** mudam o tom e a prioridade, só se sobrar tempo; viram opcional.

## Fontes (Rio)
Fogo Cruzado (tiroteio), Data.Rio/Alerta Rio (chuva, estações), COR (ocorrências, GPS de ônibus), Open-Meteo (previsão), Google News/G1 RSS (notícias), Nominatim (endereços), limites de bairros do Data.Rio. Detalhes em `FONTES.md` e `FOGOCRUZADO.md`.

## Antes do dia 28 (sem código)
- [ ] Confirmar com a organização que testar APIs/cadastros antes é permitido
- [ ] Achar a chuva em tempo real e as ocorrências do COR no Data.Rio
- [ ] Testar INMET/OSRM do notebook (INMET agora é secundário: foco Rio)
- [ ] Fogo Cruzado: testar o login com a conta
- [ ] Definir nome do projeto e papéis
- [ ] Garantir inscrição aprovada e conta de hospedagem
