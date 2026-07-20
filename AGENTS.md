# AGENTS.md

## Visão Geral do Projeto
Engine de Xadrez híbrida. 
A Lógica de inteligência artificial é processada no Back-End (C++ puro) e compilada para WebAssembly (WASM).
O Front-End é escrito em HTML, CSS e Vanilla Javascript, hospedado estaticamente na Vercel.

## Antes de Escrever Código
1. **Verifique onde você está:** O C++ fica em `ChessEngine/ArquivosCpp/` e o frontend em `WebApp/`.
2. **Leia o Estado Atual:** Consulte `progress.md` e `feature_list.json`.
3. **Valide a Integridade:** Execute `./init.ps1`.
Se o `init.ps1` retornar erro, **NÃO** comece a implementar novas lógicas. Conserte o ambiente primeiro.

## Restrições Obrigatórias (Invioláveis)
- **NÃO altere o código em `engine.js` ou `engine.wasm` diretamente.** Eles são artefatos de compilação.
- Sempre que modificar qualquer arquivo `.cpp` ou `.h`, você DEVE executar `./compile.ps1` e confirmar o sucesso antes de prosseguir.
- **Frontend Minimalista:** NÃO introduza frameworks Javascript (React, Vue) ou bibliotecas de CSS pesado (Tailwind, Bootstrap). O projeto requer CSS e Vanilla JS para extrair máxima performance.
- O Javascript interage com o C++ WebAssembly através do objeto `Module` (ex: `Module._CalcularMelhorLance()`).

## Documentos Temáticos (Fonte de Verdade)
- Arquitetura Híbrida C++/JS (`docs/architecture.md`) - Leia antes de modificar `script.js` ou `search.cpp`.

## Definição de Concluído (Definition of Done)
Uma feature só está concluída quando:
- O código compilou sem erros (`./compile.ps1` com sucesso).
- O script de validação (`./init.ps1`) não retornou falhas.
- O comportamento esperado no front-end foi testado e não congelou o UI de forma inaceitável.
- `feature_list.json` foi atualizado com o status `passing`.
- `progress.md` foi atualizado documentando as decisões arquiteturais.

## Fim de Sessão
1. Atualizar `feature_list.json`.
2. Atualizar `progress.md` com um resumo do que foi feito.
3. Fazer o `git push` com uma mensagem descritiva (Padrão Conventional Commits, ex: `feat: ...`, `fix: ...`).
