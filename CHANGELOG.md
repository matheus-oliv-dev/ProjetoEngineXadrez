# Relatório de Melhorias e Alterações (Changelog)

Este documento registra as principais mudanças, novos recursos, melhorias e correções de bugs implementadas na engine de xadrez de agora em diante.

## [Não Lançado / Em Andamento]

### Adicionado
- **Métricas de Treinamento:** Adicionado o script `ChessEngine/ArquivosPy/eval_metrics.py` para calcular e acompanhar o ganho de fitness/precisão (ex: de 12% para 24% no estilo de Magnus Carlsen) alcançado durante as rodadas de otimização dos parâmetros da engine.
- As métricas agora são salvas automaticamente num arquivo `metricas_treinamento.json` para facilitar comparações futuras quando novos conjuntos de partidas de outros jogadores forem adicionados.
- **Expansão da Base de Dados:** Adicionadas as partidas de **Anatoly Karpov** (`Karpov.pgn`) na pasta principal do projeto.
- **Treinamento Multi-base:** Os scripts de otimização (`optimizer.py`) e de avaliação de métricas (`eval_metrics.py`) foram atualizados para carregar e processar simultaneamente as posições de Magnus Carlsen e Anatoly Karpov.
- Expandir a base de dados de treinamento com partidas de outros Grandes Mestres (além de Magnus Carlsen) para generalizar o estilo de jogo da engine.
- Integrar visualizações gráficas das métricas para acompanhar a convergência da otimização ao longo do tempo.

---
*Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)*
