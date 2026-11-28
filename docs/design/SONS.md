# Sons de cada meio (seleção de transporte)

Atualizado em 2026-11-26. Regras de uso em [DIRECAO-VISUAL.md](DIRECAO-VISUAL.md#som-de-cada-meio-ideia-do-time-2026-11-26): toca só ao clicar no meio, trocar de meio corta o som atual, botão de mudo lembrado, arquivo carregado no primeiro clique, e o destaque visual acontece igual sem som.

Arquivos baixados (ainda sem corte) em `assets/sons/originais/`. Nada disso é código do site: é preparo de material, permitido antes de sábado.

## Licença
Todos os efeitos vêm do Pixabay, sob a [Licença de Conteúdo do Pixabay](https://pixabay.com/service/license-summary/): uso gratuito, inclusive comercial, **sem atribuição obrigatória** (vamos creditar no README mesmo assim). Não pode revender nem redistribuir o arquivo sozinho, sem modificação; usar dentro do site é permitido.

A voz dos avisos de estação é **sintética** (Microsoft Maria, pt-BR, do próprio Windows), gerada pelo time. **Não** usamos a gravação real do MetrôRio nem do BRT: é conteúdo protegido (Lei 9.610/98) e o site fica público. O Bernardo queria a voz original; decidimos imitar o estilo (sinal + voz sintética com o mesmo roteiro).

## Escolhas (aprovadas pelo Bernardo em 2026-11-26, ouvindo na página de teste)
| Meio | Arquivo | Fonte (Pixabay) | Duração do arquivo | Trecho usado |
|---|---|---|---|---|
| Carro | `carro.mp3` | [car horn, freesound_community](https://pixabay.com/sound-effects/city-car-horn-6408/) | 4,2 s | cortar para até 2 s |
| Moto | `moto-b.mp3` | [electric horn honking, alex_jauk](https://pixabay.com/sound-effects/film-special-effects-electric-horn-honking-236026/): buzina dupla rápida | 0,9 s | inteiro |
| Ônibus | **em aberto** | ver "Ônibus" abaixo | | |
| VLT | `vlt.mp3` | [tram bell, freesound_community](https://pixabay.com/sound-effects/city-tram-bell-29757/) | 31,1 s | 0 a 3 s |
| Bicicleta | `bike-b.mp3` | [bicycle bell 1, flutie8211](https://pixabay.com/sound-effects/film-special-effects-bicycle-bell-1-545997/): "trim trim" | 4,2 s | 0 a 1,5 s |
| Trem | `trem.mp3` | [diesel horn 02, freesound_community](https://pixabay.com/sound-effects/city-diesel-horn-02-98042/) | 1,1 s | inteiro |
| Barca | `barca.mp3` | [cargo ship horn, Universfield](https://pixabay.com/sound-effects/film-special-effects-cargo-ship-horn-352063/) | 2,4 s | inteiro |
| Metrô e BRT (sinal) | `chime.mp3` | [subway station chime, freesound_community](https://pixabay.com/sound-effects/city-subway-station-chime-100558/) | 2,7 s | inteiro, antes da voz |
| Metrô (voz) | `voz-metro.wav` | voz sintética: "Próxima estação: Central. Desembarque pelo lado esquerdo do trem. Estação de integração com os trens urbanos e o VLT." | 12,5 s | inteiro (exceção ao limite de duração, ver DIRECAO-VISUAL) |
| BRT (voz) | `voz-brt.wav` | voz sintética: "Próxima estação: Alvorada." | 3,9 s | inteiro |

## Ônibus (em aberto)
Pedido: ~3 s, sendo 2 s de pneu freando e 1 s de ar soltando. Nenhuma opção soou real para o Bernardo.

Testadas e não aprovadas:
- Arquivo único: só o ar ([air or steam pressure release](https://pixabay.com/sound-effects/technology-air-or-steam-pressure-release-29600/), `onibus.mp3`); [slow pull up and stop](https://pixabay.com/sound-effects/film-special-effects-slow-pull-up-and-stop-93445/) 3,5 a 7,0 s (`onibus-a.mp3`); [bus arrival](https://pixabay.com/sound-effects/city-bus-arrival-71991/) 19,5 a 25,5 s (`onibus-b.mp3`).
- Combinações freio + ar (freio 2 s, depois ar 1 s):

| Opção | Freio | Ar |
|---|---|---|
| A | `freio-1.mp3` 0 a 2 s ([car braking, Universfield](https://pixabay.com/sound-effects/film-special-effects-car-braking-153305/)) | `ar-1.mp3` 0 a 1 s ([air release, freesound_community](https://pixabay.com/sound-effects/film-special-effects-air-release-47977/)) |
| B | `freio-2.mp3` 1,5 a 3,5 s ([car brake, magiaz](https://pixabay.com/sound-effects/film-special-effects-car-brake-325519/)) | `ar-1.mp3` 0 a 1 s |
| C | `freio-3.mp3` 1,5 a 3,5 s ([car brake3, magiaz](https://pixabay.com/sound-effects/film-special-effects-car-brake3-325523/)) | `ar-2.mp3` 0,4 a 1,4 s ([slips air release, freesound_community](https://pixabay.com/sound-effects/film-special-effects-slips-air-release-v1-107120/)) |
| D | `freio-4.mp3` inteiro, 1,4 s ([rubber tire screech 4, floraphonic](https://pixabay.com/sound-effects/film-special-effects-rubber-tire-screech-4-202533/)) | `ar-2.mp3` 0,4 a 1,4 s |

Próxima ideia: alguém do time gravar com o celular um ônibus real parando no ponto (som ambiente gravado pelo time não tem direito de terceiros). Sem som até sábado, o ônibus fica só com o destaque visual.

## Alternativas já levantadas (se algum som escolhido deixar de agradar)
- Carro: [double car honk](https://pixabay.com/sound-effects/film-special-effects-double-car-honk-352443/) (1 s), [car horn 02](https://pixabay.com/sound-effects/city-car-horn-02-153260/) (2 s).
- Moto: [car horn, Universfield](https://pixabay.com/sound-effects/city-car-horn-153261/) (buzinadas em sequência, 3,6 s, `moto-a.mp3`), [car horn honking](https://pixabay.com/sound-effects/film-special-effects-car-horn-honking-413906/) (`moto-c.mp3`).
- Bicicleta: [bike bell](https://pixabay.com/sound-effects/city-bike-bell-43963/) (dois toques, 1,5 s, `bike-a.mp3`).
- Trem: [train horn fades](https://pixabay.com/sound-effects/city-train-horn-fades-25194/) (20 s).
- Barca: [boat horn](https://pixabay.com/sound-effects/film-special-effects-boat-horn-386178/) (1 s), [ship horn distant](https://pixabay.com/sound-effects/musical-ship-horn-distant-38390/) (7 s).
- Sinal de estação: [announcement chime](https://pixabay.com/sound-effects/film-special-effects-announcement-chime-638371/) (4 s), [3 tone chime](https://pixabay.com/sound-effects/musical-3-tone-chime-99718/) (4 s).

Arquivos descartados que ainda estão na pasta (não vão para o site): `moto.mp3`, `moto-a.mp3`, `moto-c.mp3`, `bike.mp3`, `bike-a.mp3`, `onibus.mp3`, `onibus-a.mp3`, `onibus-b.mp3`, `freio-1..4.mp3`, `ar-1..2.mp3`.

## Como ouvir
Página `assets/sons/ouvir.html`, servida em `http://127.0.0.1:8765/ouvir.html` pela configuração `ouvir-sons` do `.claude/launch.json` (servidor Python só na máquina local). Abrir o arquivo direto pelo navegador não toca os sons: precisa do servidor. A página já segue a regra de trocar de meio cortando o som atual.

## Falta
- [ ] Som do ônibus (em aberto, ver acima).
- [ ] Confirmar o lado do desembarque na Central (o texto usa "esquerdo" sem conferência) ou trocar a estação.
- [ ] Decidir se o aviso do metrô fica com 12,5 s (+ 2,7 s de sinal) ou se a voz fica mais rápida/curta.
- [ ] Cortar carro (até 2 s), VLT (0 a 3 s) e bicicleta (0 a 1,5 s) e converter as vozes para mp3 (ffmpeg ou Audacity; nenhum dos dois está instalado nesta máquina). Alternativa: no site, tocar só o trecho pelo código.
