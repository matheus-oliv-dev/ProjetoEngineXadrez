[![Status do Projeto](https://img.shields.io/badge/status-conclu%C3%ADdo-brightgreen)](https://github.com/MATHEUS111JUNDIAI/ProjetoEngineXadrez)

# Engine Híbrida de Xadrez (C++ & Python)

## 📖 Descrição

Bem-vindo ao **Projeto Engine de Xadrez**! Este repositório contém o código-fonte de uma Inteligência Artificial de Xadrez completa, construída com uma arquitetura híbrida poderosa. O projeto une a elegância e a facilidade de criação de interfaces do **Python/Pygame** com o poder de processamento bruto e velocidade extrema do **C++**.

O objetivo principal deste projeto foi desenvolver uma IA capaz de calcular variações matemáticas na velocidade da luz (atingindo profundidades de análise altíssimas) mantendo uma interface interativa, responsiva e bonita.

A comunicação entre a Interface e o Motor (Engine) acontece por meio do protocolo universal **UCI** (*Universal Chess Interface*), o mesmo utilizado por gigantes da indústria como *Stockfish* e *Komodo*.

## ✨ Funcionalidades Principais

* **Arquitetura Híbrida:** Separação total de responsabilidades. O Python cuida dos gráficos, cliques e loop de eventos, enquanto o C++ frita os circuitos calculando as melhores jogadas através de subprocessos.
* **8 Níveis de Dificuldade:** Você pode escolher desde a profundidade 1 (iniciante) até a profundidade 8 (nível Grande Mestre).
* **Threading Assíncrono:** A interface jamais congela. Enquanto o motor C++ pensa nas jogadas mais profundas, a tela do Pygame continua livre e responsiva, operando em threads independentes.
* **Salvamento PGN:** Exporte e salve suas partidas jogadas contra a Engine em formato `partida_salva.pgn` apenas apertando a tecla `S` a qualquer momento.

## 🧠 Heurísticas de Estado da Arte (C++)

O coração da Engine (o código C++) foi tunado com as heurísticas de otimização de árvore de busca mais poderosas do mundo do xadrez por computador, permitindo cortar milhões de nós desnecessários e avaliar a Profundidade 8 em uma fração de segundo:

1. **Poda Alfa-Beta & Minimax:** A espinha dorsal para avaliação de árvores de jogo.
2. **Iterative Deepening:** O aprofundamento iterativo ajuda a engine a organizar o seu tempo e encontrar lances bons logo de cara, melhorando a eficiência do Alfa-Beta.
3. **Transposition Tables (Zobrist Hash):** A engine possui uma "memória" para não ter que recalcular posições que ela já avaliou por meio da transposição de lances.
4. **Quiescence Search:** Resolve o "Efeito Horizonte". A IA continua analisando lances de captura além da profundidade máxima para garantir que não está cometendo um erro material catastrófico.
5. **Delta Pruning:** Durante o *Quiescence Search*, a IA ignora completamente capturas fúteis que não trazem vantagem material significativa.
6. **Lances Assassinos (Killer Moves):** Lances que causam o corte *Beta* são memorizados e testados primeiro em outras ramificações.
7. **Null Move Pruning (NMP):** A IA tenta passar o próprio turno; se a posição continuar incrivelmente vantajosa, ela assume que é um "corte seguro" e poda o galho inteiro.
8. **Principal Variation Search (PVS) & Late Move Reductions (LMR):** O verdadeiro segredo da velocidade extrema. Assume-se que o primeiro lance na ordenação já é ótimo, pesquisando os seguintes com "janela nula" e diminuindo a profundidade de busca (*LMR*) para os últimos lances aparentemente inúteis da fila.

## 🛠️ Tecnologias Utilizadas

* **C++11:** Usado para construir o executável `EngineCpp.exe` (processamento pesado e algoritmos de poda).
* **Python 3:** Usado para construir o orquestrador e a tela do jogo.
* **Pygame:** Renderização dos gráficos e captura dos eventos de mouse e teclado.
* **python-chess:** Gerenciamento das regras lógicas do tabuleiro (movimentos válidos, PGN, FEN) do lado visual.
* **PyInstaller:** Usado para empacotar todo o código Python e o executável C++ dentro de um único `.exe` final e portátil.

## 📂 Estrutura do Projeto

```
/
|- Assets/                    # Sprites das peças e ícones
|- ChessEngine/
|  |- ArquivosCpp/            # Código C++ da IA (search.cpp, evaluate.cpp, main.cpp, thc.h)
|  |- ArquivosPy/             # Interface Python (gui.py)
|     |- dist/                # Contém o executável FINAL (gui.exe) do jogo
|- README.md                  # Este documento
```

## 🚀 Como Executar o Jogo

1. **Jogar a versão Final Empacotada (Recomendado):**
   - Vá até a pasta `ChessEngine/ArquivosPy/dist/`.
   - Dê um duplo clique no arquivo `gui.exe`.
   - Selecione sua cor, seu nível e divirta-se!

2. **Rodar via Código Fonte (Desenvolvedores):**
   - Certifique-se de ter compilado o `EngineCpp.exe` usando G++ dentro de `ChessEngine/ArquivosCpp/`.
   - Na pasta `ChessEngine/ArquivosPy/`, instale as dependências executando `pip install pygame chess`.
   - Execute o jogo com `python gui.py`.
