# Tô saindo

Agente de IA que avisa, antes de você sair, quando há algo relevante no seu trajeto no Rio de Janeiro: chuva forte, tiroteio registrado, problema de mobilidade ou notícia que afeta o caminho. Fora isso, fica em silêncio. Projeto do Builders Day 2026 (hackathon 1565 × Taicor, 28/11).

Cada aviso traz a fonte, o horário e o nível de confiança. Os eventos expiram e o projeto não marca regiões como "perigosas".

## Documentação
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): banco, agente, verificador de alertas e conteúdo do site.
- [docs/FONTES.md](docs/FONTES.md): fontes de dados, endereços e resultado dos testes.
- [docs/FOGOCRUZADO.md](docs/FOGOCRUZADO.md): como a API de tiroteios entra no projeto.
- [docs/design/DIRECAO-VISUAL.md](docs/design/DIRECAO-VISUAL.md): direção visual, cores, fontes, 3D e telas aprovadas.
- [docs/design/SONS.md](docs/design/SONS.md): sons de cada meio de transporte, com fonte e licença.
- [docs/EVENTOS-EXEMPLO.md](docs/EVENTOS-EXEMPLO.md): eventos fictícios para a demo, sempre identificados como exemplo.

## Como rodar
Em construção (o código começa no dia do evento). Copie `.env.example` para `.env.local` e preencha as chaves. Nenhuma chave entra no repositório.

## Atribuições
Fontes de dados e sons com licença livre estão listadas em `docs/FONTES.md` e `docs/design/SONS.md`.
