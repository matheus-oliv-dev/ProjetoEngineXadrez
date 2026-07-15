# build_book.py
import chess
import chess.pgn
import json
from collections import defaultdict

def build_opening_book(pgn_file, max_games=6000, depth=20):
    """
    Lê um arquivo PGN e cria um livro de aberturas baseado na frequência dos lances.

    Args:
        pgn_file (str): O caminho para o arquivo PGN.
        max_games (int): O número máximo de jogos a serem analisados.
        depth (int): O número de meio-lances (plies) a serem analisados em cada jogo.
    """
    # Usaremos um dicionário para contar os lances: {posição_fen: {lance_uci: contagem}}
    opening_counts = defaultdict(lambda: defaultdict(int))
    
    print(f"Iniciando a análise de até {max_games} jogos. Isso pode demorar...")
    
    with open(pgn_file, "r", encoding="utf-8") as pgn:
        game_counter = 0
        while game_counter < max_games:
            # Lê um jogo do arquivo PGN
            game = chess.pgn.read_game(pgn)
            if game is None:
                break # Fim do arquivo
            
            # Imprime o progresso a cada 100 jogos
            if game_counter % 100 == 0 and game_counter > 0:
                print(f"Analisando jogo {game_counter}...")

            board = game.board()
            
            # Itera pelos primeiros 'depth' lances do jogo
            for i, move in enumerate(game.mainline_moves()):
                if i >= depth:
                    break
                
                # Pega a representação da posição atual (FEN)
                current_fen = board.fen()
                # Pega a representação do lance (UCI)
                move_uci = move.uci()
                
                # Incrementa a contagem para este lance nesta posição
                opening_counts[current_fen][move_uci] += 1
                
                # Executa o lance para avançar para a próxima posição
                board.push(move)

            game_counter += 1

    print(f"\nAnálise de {game_counter} jogos concluída. Convertendo contagens para probabilidades...")

    # Agora, converte as contagens em probabilidades
    opening_book = {}
    for fen, moves in opening_counts.items():
        total_plays = sum(moves.values())
        if total_plays > 1: # Só incluímos posições que apareceram mais de uma vez
            # Cria uma lista de tuplas (lance, probabilidade)
            opening_book[fen] = [
                (move, count / total_plays) for move, count in moves.items()
            ]

    # Salva o livro de aberturas em um arquivo JSON
    with open('book.json', 'w') as f:
        json.dump(opening_book, f, indent=2)
        
    print("\nLivro de aberturas criado com sucesso e salvo como 'book.json'!")

#  Ponto de Entrada do Script 
if __name__ == "__main__":
    # Garante que o arquivo PGN está na pasta
    try:
        build_opening_book('magnus_games.pgn')
    except FileNotFoundError:
        print("Erro: Arquivo 'magnus_games.pgn' não encontrado. Renomeie seu arquivo PGN para este nome ou altere no código.")