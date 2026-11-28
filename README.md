# Tô saindo

Mapa colaborativo do Rio de Janeiro que mostra, em tempo real, o que está acontecendo em cada bairro (árvore caída, luz queimada, trânsito, assalto, tiroteio, chuva) e deixa qualquer pessoa reportar o que viu. Um agente de IA confere, classifica e junta os reportes antes de publicar. Duas abas: **Mapa** (busca, bairro e navegação de A até B) e **Feed** (alertas em texto, com filtro por tipo e bairro). Projeto do Builders Day 2026 (hackathon 1565 × Taicor, 28/11).

Cada ocorrência traz a fonte, o horário e o nível de confiança. As ocorrências expiram e o projeto não marca regiões como "perigosas".

## Documentação
- [docs/PLANO-APP.md](docs/PLANO-APP.md): **plano vigente** (telas, agente, dados, contratos das rotas, divisão do time).
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): desenho anterior (histórico).
- [docs/FONTES.md](docs/FONTES.md): fontes de dados, endereços e resultado dos testes.
- [docs/FOGOCRUZADO.md](docs/FOGOCRUZADO.md): como a API de tiroteios entra no projeto.
- [docs/design/DIRECAO-VISUAL.md](docs/design/DIRECAO-VISUAL.md): direção visual, cores, fontes, 3D e telas aprovadas.
- [docs/design/SONS.md](docs/design/SONS.md): sons de cada meio de transporte, com fonte e licença.
- [docs/EVENTOS-EXEMPLO.md](docs/EVENTOS-EXEMPLO.md): eventos fictícios para a demo, sempre identificados como exemplo.

## Como rodar
Em construção (o código começa no dia do evento). Copie `.env.example` para `.env.local` e preencha as chaves. Nenhuma chave entra no repositório.

## Atribuições
Fontes de dados e sons com licença livre estão listadas em `docs/FONTES.md` e `docs/design/SONS.md`.
