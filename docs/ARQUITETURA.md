# Desenho do app (texto, sem código)

Atualizado em 2026-11-26 para a versão 2 (WhatsApp + Telegram, site de entrada + mapa). A direção visual do site **não** é definida aqui: ela sai do fluxo `/site-premium` no dia (ver `PENDENCIAS.md`).

## Banco (Supabase, só armazenamento, criado no dia 28/11)
**events**: id, tipo, titulo, descricao, lat, lng, raio_m, bairro, inicio (hora do ocorrido), expira_em, fonte, url, confianca (oficial | confirmado | relato), severidade (1 a 3), hash_dedup, criado_em.
- Tipos: tiroteio, chuva, alagamento, transito, transporte, noticia.
- `expira_em` conta da **hora do ocorrido**: tiroteio 3h, chuva 6h, notícia 12h. Expirado some do mapa e não gera aviso.
- `hash_dedup`: tipo + bairro + janela de 1h (ou o id da fonte, quando houver), para juntar relatos repetidos.

**users**: id, canal_preferido (whatsapp | telegram), whatsapp_id, telegram_id, criado_em.
**preferences**: user_id, tipos_aviso (chuva, tiroteio, mobilidade, noticias), antecedencia_min, silencio_inicio, silencio_fim, severidade_minima.
**routes**: id, user_id, nome, origem, destino, vias_citadas, meio (carro | moto | onibus | metro | trem), dias, horario.
**places**: id, user_id, nome, lat, lng, bairro.
**alerts_sent**: user_id, event_id, route_id, enviado_em. Garante que **o mesmo evento não é avisado duas vezes**, em nenhum canal.

Segurança: RLS ligado em todas as tabelas; `events` com leitura pública e o resto só pelo servidor. A chave de serviço do Supabase fica só no servidor e no verificador de alertas, nunca no navegador.
Privacidade (LGPD): guardar só o que a pessoa informou; comando "apagar meus dados" nos dois canais e no site; página curta de privacidade dizendo o que é guardado e por quê.

## Agente (Claude, tool use)
Ferramentas: `resumo_do_bairro`, `buscar_eventos`, `eventos_no_trajeto`, `rota_alternativa` (OpenRouteService + link do Google Maps), `clima_agora`, `geocodificar`, `salvar_trajeto`, `preferencias`.

Regras do prompt (obrigatórias):
1. Toda resposta cita fonte, horário ("registrado às X") e nível de confiança.
2. Relato isolado é "não confirmado"; nunca dizer "está acontecendo agora" sem checar o horário.
3. Nunca rotular bairro ou comunidade como perigoso; falar do evento, do local e do horário.
4. Sem dados: dizer que não tem. Não inventar.
5. Recomendação curta e concreta. Rota alternativa só para carro e moto; para transporte público, horário e aviso.
6. Em risco real, lembrar 190 (polícia) e 193 (bombeiros) e seguir a Defesa Civil.

## Verificador de alertas
A cada 5 a 10 min: coleta eventos novos → cruza com trajetos e lugares salvos (bairro e vias) → respeita preferências e horário de silêncio → manda **uma vez** no canal preferido → grava em `alerts_sent`.
Regra contra excesso: só avisa acima da `severidade_minima` e agrupa vários eventos do mesmo trajeto numa mensagem só.

## Site (entrada + mapa resumido)
Conteúdo mínimo: promessa em uma frase, botões "Conectar WhatsApp" e "Conectar Telegram", exemplo de aviso, mapa do Rio com os eventos de agora, preferências de aviso, link de privacidade e "apagar meus dados", atribuições das fontes.
Restrições já decididas: confiança indicada por forma ou ícone além da cor (acessibilidade); tom de utilidade pública, sem sensacionalismo; nada de mancha permanente sobre bairros.
