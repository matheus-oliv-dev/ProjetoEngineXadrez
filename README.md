[![Status do Projeto](https://img.shields.io/badge/status-conclu%C3%ADdo-brightgreen)](https://github.com/matheus-oliv-dev/ProjetoEngineXadrez)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://xadrez.matheusdev.com.br/)

# ♟️ C++ WebAssembly Chess Engine

Bem-vindo ao **Projeto Engine de Xadrez**! 
Este repositório contém o código-fonte de uma Inteligência Artificial de Xadrez de alta performance, construída do zero em **C++** e compilada para rodar nativamente no seu navegador utilizando **WebAssembly (WASM)**.

O objetivo principal deste projeto foi desenvolver uma IA capaz de calcular variações matemáticas complexas em altíssima velocidade (avaliando milhares de posições por segundo), sem a necessidade de instalar nada ou depender de servidores backend caros. Tudo acontece diretamente na CPU do cliente.

![Interface do Jogo](WebApp/img/chessboard.png) *(Substitua por um print da sua interface real)*

## ✨ Funcionalidades e Destaques

* **Performance WebAssembly:** O núcleo de cálculo pesado em C++ foi traduzido para WebAssembly, permitindo que a IA jogue no navegador web com velocidades próximas às de aplicações Desktop nativas.
* **Internacionalização (i18n):** Interface totalmente bilíngue (Português 🇧🇷 e Inglês 🇺🇸), trocando idiomas dinamicamente sem recarregar a página.
* **8 Níveis de Dificuldade Dinâmicos:** Através de um algoritmo de "Miopia Estocástica", a IA simula perfeitamente erros humanos nos níveis iniciais (Muito Fácil, Fácil) e se torna implacável (cálculo puro) no nível Lenda.
* **Sistema de Relógios e UI:** Relógios configuráveis (Bullet, Blitz, Rápida), suporte a PGN (Copiar/Baixar), Tela Cheia e inversão de tabuleiro.
* **Client-Side puro:** Hospedagem estática gratuita na **Vercel**. Zero custos de backend.

## 🧠 Heurísticas de Inteligência Artificial (C++)

O coração da Engine (escrito em C++11/14) foi tunado com algoritmos de estado da arte para otimização de árvore de busca:

1. **Minimax com Poda Alfa-Beta:** O algoritmo central, otimizado para descartar ramificações irrelevantes (cortes Alfa e Beta).
2. **Quiescence Search:** Resolve o "Efeito Horizonte", forçando a IA a continuar analisando ramificações onde ocorrem capturas em cadeia antes de dar uma nota final ao tabuleiro.
3. **Move Ordering & Lances Assassinos:** A IA tenta primeiro os lances de captura e os lances que causaram "cortes Beta" em outras linhas, acelerando a busca brutalmente.
4. **Tabelas de Transposição (Zobrist Hashing):** Hashes de 64 bits mapeiam posições já avaliadas na memória RAM, evitando recálculo de caminhos diferentes que levam ao mesmo tabuleiro.
5. **Delta Pruning & Mop-up Evaluation:** Ignora lances de captura inúteis em finais de jogo e sabe como encurralar o Rei adversário no canto do tabuleiro usando Piece-Square Tables (PST).

## 🛠️ Tecnologias Utilizadas

* **Back-End (Núcleo Lógico):** C++ (usando a biblioteca estática THC para validação de regras).
* **Compilação/Ponte:** Emscripten (Gera os binários WebAssembly `.wasm` e o wrapper Javascript `.js`).
* **Front-End:** HTML5, CSS3, JavaScript (Vanilla).
* **Bibliotecas Visuais:** Chessboard.js (Gráficos do tabuleiro) e Chess.js (Controle de PGN e turnos no lado web).
* **Deploy:** Vercel via Git.

## 📂 Estrutura Principal do Projeto

```text
ProjetoEngineXadrez/
├── ChessEngine/
│   ├── ArquivosCpp/          # Código fonte em C++ da IA (evaluate.cpp, search.cpp)
│   └── (Legado Python)       # Versão original da interface em Pygame (Descontinuada)
├── WebApp/
│   ├── index.html            # Estrutura do site
│   ├── style.css             # Estilização
│   ├── script.js             # Lógica de interface, Relógios e chamada do WASM
│   ├── i18n.js               # Sistema de mudança de idiomas
│   ├── translations.js       # Dicionários de PT-BR e EN
│   └── engine.wasm / .js     # Arquivos gerados pelo Emscripten
├── compile.ps1               # Script PowerShell para buildar o C++ em WASM
└── README.md
```

## 🚀 Como Executar o Jogo

### Jogar Online
O projeto está publicado e funcional. Jogue agora mesmo em:
👉 **[xadrez.matheusdev.com.br](https://xadrez.matheusdev.com.br/)**

### Compilar Localmente (Para Desenvolvedores)
Se você deseja modificar a inteligência artificial (C++):
1. Instale o [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html).
2. Clone o repositório.
3. No terminal (Windows PowerShell), execute o script de compilação:
   ```powershell
   ./compile.ps1
   ```
4. Inicie um servidor web local na pasta raiz (ex: `python -m http.server 8000`).
5. Acesse `http://localhost:8000/WebApp/` no navegador.
