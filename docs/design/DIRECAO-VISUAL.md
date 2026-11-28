# Tô saindo: direção visual (decidida em 2026-11-26)

Decisões de design tomadas antes do evento, sem código. O `DESIGN.md` oficial (tokens) é gerado pelo impeccable **no fim do build de sábado**, a partir do site pronto; até lá, este arquivo e `.impeccable/surfaces/src-app-page-tsx.md` são a referência.

## Telas aprovadas
| Tela | Arquivo | O que mostra |
|---|---|---|
| Principal | [tela-principal.png](tela-principal.png) | Rio em 3D à noite, cada meio de transporte realista sobre a própria via, trajeto escrito em LED no topo, 3 avisos na rota, painel com os 8 meios e botões de conectar |
| Subsolo | [tela-subsolo.png](tela-subsolo.png) | Estado do botão "Ver o subsolo": o chão se abre e mostra os túneis e estações do metrô |

As imagens foram geradas por IA no Figma (arquivo "Tô saindo já — comps": https://www.figma.com/design/sEvCj3OC80yWaXugmHwWNC, com as 7 versões; peça acesso ao Bernardo) como **referência**: no sábado o código precisa chegar o mais perto possível delas. Não são assets finais.

## Identidade
- **Nome:** Tô saindo.
- **Tom:** carioca e confiável. Leve no convite, sóbrio e curto nos avisos.
- **Mundo:** a linguagem dos painéis de LED do transporte do Rio (letreiros de ônibus, painéis das vias expressas, estações) acende a cidade inteira. Vale para todos os meios, não só ônibus.

## Cores (opção B, "Cores dos consórcios")
| Papel | Cor | Uso |
|---|---|---|
| Fundo | `#101215` | noite grafite-azulada |
| LED | `#FFB000` | trajeto, malha da cidade, etiquetas, marca |
| Texto | `#EDEFF2` | textos e títulos |
| Chuva | `#4D9BFF` | avisos de chuva e alagamento |
| Tiroteio registrado | `#FF5A4F` | avisos do Fogo Cruzado |
| Mobilidade | `#3DBE63` | trânsito, transporte, notícias de via |

Contraste conferido sobre o fundo: LED 10,2:1; texto 16,3:1; azul 6,7:1; vermelho 6,1:1; verde 7,8:1 (todos passam no WCAG AA). **Regra:** tipo de aviso nunca só pela cor; sempre ícone + rótulo.

## Fontes (Google Fonts, gratuitas, com acentos)
- **Doto** (900): letreiro de LED, marca e trajeto.
- **Sora** (400, 600, 800): títulos, textos e botões.

## 3D e animação (pedido do time: muito destaque)
- **Cena 3D** com React Three Fiber + drei: modelo estilizado do Rio (baía, morros, Cristo, Pão de Açúcar) com a malha de transporte em pontos de LED.
- **Cada meio realista em miniatura** sobre a própria via: carro e moto no elevado, bike na ciclovia da orla, BRT na pista exclusiva, VLT nos trilhos do Centro, trem nos trilhos do subúrbio, barca na baía, metrô pelas estações com "M".
- **Interações assinatura:**
  1. Digitar o trajeto reescreve o letreiro em LED, ponto a ponto.
  2. "Ver o subsolo": o chão se corta e revela os túneis do metrô; "Voltar à superfície" fecha.
  3. Clicar num meio (no mapa ou no chip) destaca a malha dele e toca o som dele (ver abaixo).
- **Rolagem:** Lenis (rolagem suave) + GSAP ScrollTrigger guiando a câmera 3D: da vista geral para a rota, depois para a lista de avisos.
- Ler a documentação atual de GSAP, Lenis e React Three Fiber antes de usar (versões no relatório final).

## Som de cada meio (ideia do time, 2026-11-26)
Arquivos, fontes, licenças e trechos escolhidos: [SONS.md](SONS.md).

| Meio | Som |
|---|---|
| Metrô | sinal + aviso completo: "próxima estação", lado do desembarque e estação de integração |
| BRT | sinal + aviso de "próxima estação" |
| Ônibus | freio + o ar soltando (**em aberto**: nenhuma opção soou real) |
| Carro | buzina |
| Moto | buzina dupla rápida, como motoboy |
| VLT | sino |
| Bicicleta | campainha "trim trim" |
| Trem | buzina de trem |
| Barca | apito grave de navio |

Regras para o som funcionar bem e sem problema:
- **Direitos autorais:** **não** usar a gravação real da voz do MetrôRio, do BRT nem áudio baixado do YouTube. Usar efeitos com licença livre (Freesound CC0, Pixabay Sound Effects; conferir a licença de cada um) e, para os avisos de estação, voz sintética (decidido em 2026-11-26: Microsoft Maria, pt-BR) dizendo, por exemplo, "Próxima estação: Central. Desembarque pelo lado esquerdo do trem. Estação de integração com os trens urbanos e o VLT." O vídeo do YouTube serve **só de referência** para imitar o estilo.
- **Só toca ao clicar.** Nunca tocar sozinho ao abrir a página.
- **Trocar de meio corta o som atual** e começa o novo na hora, mesmo com o anterior tocando (pedido do Bernardo, 2026-11-26). Um som por vez.
- **Botão de som ligado/desligado** visível, e o estado lembrado.
- Efeitos curtos (até 3 s; o VLT usa 3 s), comprimidos (`.mp3` ou `.ogg`), carregados só no primeiro clique.
  O aviso falado de metrô e BRT é a exceção: dura o que a frase pedir (o do metrô tem ~12,5 s de voz). Como trocar de meio corta o som, ele não prende quem está navegando.
- Sem som não falta informação: o destaque visual acontece igual.

## Correções em relação às imagens geradas
- Trocar o ícone de **mira/arma** dos disparos por um **alerta neutro** (triângulo ou ponto de exclamação).
- **Sem logo de órgão real** (as imagens antigas inventaram o da Prefeitura).
- **Exemplos geograficamente verdadeiros:** o metrô não chega a Campo Grande. No estado do subsolo, usar um trajeto real de metrô (ex.: Botafogo → Centro). Campo Grande → Centro vale de carro, trem (ramal Santa Cruz) ou BRT.
- A geografia da cena 3D é estilizada; avisar isso no rodapé ("ilustração, fora de escala").

## Prompts usados (para gerar mais imagens no Gemini ou no GPT)
Os prompts completos de cada imagem estão gravados dentro dos próprios arquivos e em `.impeccable/mocks/*.png.json`. Para gerar variações fora do Figma, copiar o prompt da tela principal desse arquivo e trocar só o que mudar.
