# Arquitetura: C++ / WebAssembly / Javascript

Este documento descreve como a Engine de Xadrez opera sob o capô.

## O Cérebro (C++)
Localizado em `ChessEngine/ArquivosCpp/`.
O núcleo lógico usa uma versão otimizada do algoritmo **Minimax com Poda Alfa-Beta**, juntamente com **Tabelas de Transposição (Zobrist Hash)** e **Busca de Quiescência (Quiescence Search)**.
- O código C++ **não** tem nenhuma ideia de que está rodando em um navegador web. Ele apenas recebe uma string `FEN` (estado do tabuleiro) e retorna uma string representando o melhor lance.

## A Ponte (Emscripten / WebAssembly)
O compilador Emscripten converte o C++ bruto para o arquivo `WebApp/engine.wasm`.
- As funções C++ que precisam ser acessadas pelo Javascript recebem a tag `EMSCRIPTEN_KEEPALIVE` e possuem encapsulamento `extern "C"`.
- Nunca edite `engine.wasm` ou `engine.js` (wrapper gerado). Eles são gerados ao rodar o `compile.ps1`.

## O Front-End (Javascript)
Localizado em `WebApp/script.js`.
- Utiliza a biblioteca `chess.js` (apenas para validar movimentos lícitos do lado do cliente) e `chessboard.js` (para desenhar a GUI na tela).
- **Assincronismo (O Gargalo):** O método `_CalcularMelhorLance()` do WebAssembly roda na *Main Thread* do Javascript, bloqueando o Event Loop. Um timer `setTimeout` é usado para garantir que o DOM (HTML) atualize a mensagem "A IA está pensando" ANTES do processamento ser iniciado.

## Internacionalização (i18n)
Localizado em `WebApp/i18n.js` e `WebApp/translations.js`.
- Sistema reativo construído com Vanilla JS.
- Mapeia elementos do HTML que possuem o atributo `data-i18n` e substitui seus valores em tempo de execução usando um dicionário em memória.
- Para gerar mensagens dinâmicas via JS, utilize sempre o método global `i18n.t('chave')`.
