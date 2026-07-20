# Diário de Progresso (Harness Engineering)

Este arquivo documenta o estado atual do projeto para que nenhum contexto seja perdido entre as sessões dos Agentes de IA.

## Estado Atual (2026-07)
- **Status Geral:** O projeto compila e roda com sucesso no navegador. Hospedado na Vercel via domínio customizado `xadrez.matheusdev.com.br`.
- **Arquitetura Base:** C++ compilado para WebAssembly. Frontend interativo com Chessboard.js.
- **Destaque:** Sistema de Internacionalização (i18n) recém implantado, controlando a tradução dinâmica sem dependências externas.
- **Harness:** Estrutura de Harness Engineering implantada para blindar o repositório contra bugs e preservar o histórico de decisões.

## Últimas Decisões Tomadas
1. **WASM sem Web Workers (por enquanto):** O WebAssembly roda na mesma thread do JS e bloqueia a UI por curtos períodos no Nível Lenda. Optamos por aceitar essa perda mínima em vez de aumentar a complexidade assíncrona, já que o foco primário do projeto (portfólio) foi atingido com sucesso.
2. **i18n Nativo:** Decidimos não usar frameworks pesados (como i18next). Construímos uma solução enxuta baseada no atributo `data-i18n` e um botão toggle para evitar overhead e manter o Javascript puro.
3. **Miopia Estocástica:** Implementada injeção de ruído randômico na avaliação da Engine (Hash Noise) para criar os 8 níveis de dificuldade sem precisar alterar o algoritmo Poda Alfa-Beta base.

## Bloqueios / Dificuldades
- O script `compile.ps1` é estritamente configurado para rodar no ambiente Windows (PowerShell) com o EMSDK ativado. Não tentar rodar `make` ou comandos Bash sem adaptar a pipeline.

## Próximos Passos
- Ver `feature_list.json` para mapear os próximos desejos de funcionalidades.
