# gui.py
import pygame
import chess
import chess.pgn
import os
import sys

def resource_path(relative_path):
    """Obtém o caminho absoluto para o recurso, compatível com PyInstaller e execução normal."""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    return os.path.join(base_path, relative_path)

import subprocess

class UCIEngine:
    def __init__(self, caminho_executavel):
        self.process = subprocess.Popen(
            [caminho_executavel],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1 # Buffering por linha
        )
        self.enviar_comando("uci")
        
    def enviar_comando(self, comando):
        self.process.stdin.write(comando + "\n")
        self.process.stdin.flush()
        
    def obter_lance_engine(self, tabuleiro, profundidade):
        fen = tabuleiro.fen()
        self.enviar_comando(f"position fen {fen}")
        self.enviar_comando(f"go depth {profundidade}")
        
        while True:
            linha = self.process.stdout.readline().strip()
            if linha.startswith("bestmove"):
                partes = linha.split()
                if len(partes) >= 2:
                    move_str = partes[1]
                    return chess.Move.from_uci(move_str)
                    
    def obter_lance_engine(self, tabuleiro, profundidade):
        fen = tabuleiro.fen()
        self.enviar_comando(f"position fen {fen}")
        self.enviar_comando(f"go depth {profundidade}")
        
        while True:
            linha = self.process.stdout.readline().strip()
            if linha.startswith("bestmove"):
                partes = linha.split()
                if len(partes) >= 2:
                    move_str = partes[1]
                    return chess.Move.from_uci(move_str)
                    
    def iniciar_busca_assincrona(self, tabuleiro, profundidade, callback):
        import threading
        def worker():
            lance = self.obter_lance_engine(tabuleiro, profundidade)
            callback(lance)
        thread = threading.Thread(target=worker)
        thread.daemon = True
        thread.start()

    def fechar(self):
        self.enviar_comando("quit")
        self.process.wait()

#  CONFIGURAÇÕES GERAIS 
LARGURA_TABULEIRO = 800
LARGURA_TELA = 1000
ALTURA = 800
TAMANHO_QUADRADO = LARGURA_TABULEIRO // 8
FPS = 60

# Cores
COR_BRANCA = (240, 217, 181)
COR_PRETA = (181, 136, 99)
COR_DESTAQUE = (100, 255, 100, 100)
COR_DESTAQUE_ULTIMO_LANCE = (255, 255, 0, 100)

# Dicionário para carregar as imagens das peças
IMAGENS_PECAS = {}

def carregar_imagens():
    """Carrega as imagens das peças do diretório 'assets'."""
    caminho_assets = resource_path('Assets')
    simbolos_pecas = ['PW', 'RDW', 'NW', 'BW', 'QW', 'KW', 'PB', 'RDB', 'NB', 'BB', 'QB', 'KB']
    for simbolo in simbolos_pecas:
        try:
            caminho_imagem = os.path.join(caminho_assets, f"{simbolo}.png")
            IMAGENS_PECAS[simbolo] = pygame.transform.scale(
                pygame.image.load(caminho_imagem), (TAMANHO_QUADRADO, TAMANHO_QUADRADO)
            )
        except pygame.error as e:
            print(f"Erro ao carregar a imagem {caminho_imagem}: {e}")
            raise SystemExit()

def square_to_screen(square, jogar_de_pretas):
    """Converte um índice de casa do xadrez para linha e coluna da tela."""
    file = chess.square_file(square)
    rank = chess.square_rank(square)
    if jogar_de_pretas:
        col = 7 - file
        row = rank
    else:
        col = file
        row = 7 - rank
    return row, col

def screen_to_square(pos, jogar_de_pretas):
    """Converte a posição (x,y) do mouse para o índice de casa do xadrez."""
    col = pos[0] // TAMANHO_QUADRADO
    row = pos[1] // TAMANHO_QUADRADO
    if jogar_de_pretas:
        file = 7 - col
        rank = row
    else:
        file = col
        rank = 7 - row
    return chess.square(file, rank)

def calcular_vantagem_material(tabuleiro):
    VALORES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
    brancas = 0
    pretas = 0
    for casa in chess.SQUARES:
        peca = tabuleiro.piece_at(casa)
        if peca and peca.piece_type != chess.KING:
            val = VALORES[peca.piece_type]
            if peca.color == chess.WHITE:
                brancas += val
            else:
                pretas += val
    
    vantagem = brancas - pretas
    if vantagem > 0:
        return f"Brancas +{vantagem}"
    elif vantagem < 0:
        return f"Pretas +{abs(vantagem)}"
    else:
        return "Igualdade"

def desenhar_estado_jogo(tela, tabuleiro, casa_selecionada, ultimo_lance, jogar_de_pretas):
    """Função principal de desenho que desenha o tabuleiro e as peças."""
    for row in range(8):
        for col in range(8):
            color = COR_BRANCA if (row + col) % 2 == 0 else COR_PRETA
            pygame.draw.rect(tela, color, pygame.Rect(col * TAMANHO_QUADRADO, row * TAMANHO_QUADRADO, TAMANHO_QUADRADO, TAMANHO_QUADRADO))

    if ultimo_lance:
        start_square = ultimo_lance.from_square
        end_square = ultimo_lance.to_square
        start_row, start_col = square_to_screen(start_square, jogar_de_pretas)
        end_row, end_col = square_to_screen(end_square, jogar_de_pretas)
        
        s = pygame.Surface((TAMANHO_QUADRADO, TAMANHO_QUADRADO), pygame.SRCALPHA)
        s.fill(COR_DESTAQUE_ULTIMO_LANCE)
        tela.blit(s, (start_col * TAMANHO_QUADRADO, start_row * TAMANHO_QUADRADO))
        tela.blit(s, (end_col * TAMANHO_QUADRADO, end_row * TAMANHO_QUADRADO))


    if casa_selecionada is not None:
        row, col = square_to_screen(casa_selecionada, jogar_de_pretas)
        s = pygame.Surface((TAMANHO_QUADRADO, TAMANHO_QUADRADO), pygame.SRCALPHA)
        s.fill(COR_DESTAQUE)
        tela.blit(s, (col * TAMANHO_QUADRADO, row * TAMANHO_QUADRADO))
        
        surf_movimento = pygame.Surface((TAMANHO_QUADRADO, TAMANHO_QUADRADO), pygame.SRCALPHA)
        pygame.draw.circle(surf_movimento, (0, 0, 0, 80), (TAMANHO_QUADRADO // 2, TAMANHO_QUADRADO // 2), TAMANHO_QUADRADO // 6)
        
        for lance in tabuleiro.legal_moves:
            if lance.from_square == casa_selecionada:
                end_sq = lance.to_square
                end_row, end_col = square_to_screen(end_sq, jogar_de_pretas)
                tela.blit(surf_movimento, (end_col * TAMANHO_QUADRADO, end_row * TAMANHO_QUADRADO))

    piece_map = {
        (chess.PAWN, chess.WHITE): 'PW', (chess.PAWN, chess.BLACK): 'PB', (chess.ROOK, chess.WHITE): 'RDW',
        (chess.ROOK, chess.BLACK): 'RDB', (chess.KNIGHT, chess.WHITE): 'NW', (chess.KNIGHT, chess.BLACK): 'NB',
        (chess.BISHOP, chess.WHITE): 'BW', (chess.BISHOP, chess.BLACK): 'BB', (chess.QUEEN, chess.WHITE): 'QW',
        (chess.QUEEN, chess.BLACK): 'QB', (chess.KING, chess.WHITE): 'KW', (chess.KING, chess.BLACK): 'KB',
    }
    for square_index in chess.SQUARES:
        peca = tabuleiro.piece_at(square_index)
        if peca is not None:
            simbolo = piece_map[(peca.piece_type, peca.color)]
            row, col = square_to_screen(square_index, jogar_de_pretas)
            tela.blit(IMAGENS_PECAS[simbolo], pygame.Rect(col * TAMANHO_QUADRADO, row * TAMANHO_QUADRADO, TAMANHO_QUADRADO, TAMANHO_QUADRADO))

    # Desenha o painel lateral
    rect_painel = pygame.Rect(LARGURA_TABULEIRO, 0, LARGURA_TELA - LARGURA_TABULEIRO, ALTURA)
    pygame.draw.rect(tela, (40, 40, 40), rect_painel)
    pygame.draw.line(tela, (255, 215, 0), (LARGURA_TABULEIRO, 0), (LARGURA_TABULEIRO, ALTURA), 3)

    fonte_titulo = pygame.font.SysFont("Arial", 24, bold=True)
    fonte_texto = pygame.font.SysFont("Arial", 20)
    
    # De quem é a vez
    texto_vez = "Vez das Brancas" if tabuleiro.turn == chess.WHITE else "Vez das Pretas"
    cor_vez = (240, 240, 240) if tabuleiro.turn == chess.WHITE else (150, 150, 150)
    surf_vez = fonte_titulo.render(texto_vez, True, cor_vez)
    tela.blit(surf_vez, (LARGURA_TABULEIRO + 20, 30))
    
    # Vantagem Material
    texto_vantagem = calcular_vantagem_material(tabuleiro)
    surf_vantagem_titulo = fonte_texto.render("Material:", True, (200, 200, 200))
    tela.blit(surf_vantagem_titulo, (LARGURA_TABULEIRO + 20, 80))
    
    surf_vantagem_valor = fonte_titulo.render(texto_vantagem, True, (255, 215, 0))
    tela.blit(surf_vantagem_valor, (LARGURA_TABULEIRO + 20, 110))

class Botao:
    def __init__(self, x, y, largura, altura, texto, cor_fundo, cor_hover, cor_texto=(255,255,255), fonte_size=30):
        self.rect = pygame.Rect(x, y, largura, altura)
        self.texto = texto
        self.cor_fundo = cor_fundo
        self.cor_hover = cor_hover
        self.cor_texto = cor_texto
        self.fonte = pygame.font.SysFont("Arial", fonte_size, bold=True)
        self.selecionado = False

    def desenhar(self, tela):
        pos_mouse = pygame.mouse.get_pos()
        cor_atual = self.cor_hover if self.rect.collidepoint(pos_mouse) or self.selecionado else self.cor_fundo
        
        # Desenha sombra
        pygame.draw.rect(tela, (50, 50, 50), self.rect.move(2, 2), border_radius=8)
        # Desenha botão
        pygame.draw.rect(tela, cor_atual, self.rect, border_radius=8)
        # Desenha borda se selecionado
        if self.selecionado:
            pygame.draw.rect(tela, (255, 215, 0), self.rect, 3, border_radius=8)

        surf_texto = self.fonte.render(self.texto, True, self.cor_texto)
        rect_texto = surf_texto.get_rect(center=self.rect.center)
        tela.blit(surf_texto, rect_texto)

    def checar_clique(self, pos_mouse):
        return self.rect.collidepoint(pos_mouse)

def tela_fim_jogo(tela, resultado):
    s = pygame.Surface((LARGURA_TELA, ALTURA), pygame.SRCALPHA)
    s.fill((0, 0, 0, 180))
    tela.blit(s, (0, 0))
    
    fonte_titulo = pygame.font.SysFont("Arial", 60, bold=True)
    if resultado == "1-0":
        texto_res = "Brancas Vencem!"
    elif resultado == "0-1":
        texto_res = "Pretas Vencem!"
    else:
        texto_res = "Empate!"
        
    titulo = fonte_titulo.render(texto_res, True, (255, 255, 255))
    tela.blit(titulo, titulo.get_rect(center=(LARGURA_TELA//2, ALTURA//2 - 100)))
    
    btn_jogar = Botao(LARGURA_TELA//2 - 125, ALTURA//2, 250, 60, "Jogar Novamente", (46, 139, 87), (60, 179, 113))
    btn_sair = Botao(LARGURA_TELA//2 - 125, ALTURA//2 + 80, 250, 60, "Sair", (178, 34, 34), (205, 92, 92))
    
    while True:
        btn_jogar.desenhar(tela)
        btn_sair.desenhar(tela)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                raise SystemExit()
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                pos = pygame.mouse.get_pos()
                if btn_jogar.checar_clique(pos):
                    return True
                if btn_sair.checar_clique(pos):
                    pygame.quit()
                    raise SystemExit()
                    
        pygame.display.flip()

def tela_inicial(tela):
    cor_selecionada = None
    profundidade_selecionada = None
    
    COR_BOTAO = (70, 130, 180)
    COR_HOVER = (100, 149, 237)
    COR_BOTAO_INATIVO = (150, 150, 150)
    COR_BOTAO_START = (46, 139, 87)
    COR_HOVER_START = (60, 179, 113)
    
    botoes_cor = [
        Botao(LARGURA_TELA//2 - 160, ALTURA//2 - 100, 150, 50, "Brancas", COR_BOTAO, COR_HOVER),
        Botao(LARGURA_TELA//2 + 10, ALTURA//2 - 100, 150, 50, "Pretas", COR_BOTAO, COR_HOVER)
    ]
    botoes_dif = []
    largura_btn = 50
    espaco = 10
    total_botoes = 8
    inicio_x = LARGURA_TELA//2 - (total_botoes*largura_btn + (total_botoes-1)*espaco)//2
    for i in range(1, total_botoes + 1):
        botoes_dif.append(Botao(inicio_x + (i-1)*(largura_btn+espaco), ALTURA//2 + 20, largura_btn, 50, str(i), COR_BOTAO, COR_HOVER))
        
    btn_start = Botao(LARGURA_TELA//2 - 125, ALTURA//2 + 120, 250, 60, "INICIAR JOGO", COR_BOTAO_INATIVO, COR_BOTAO_INATIVO)

    fonte_titulo = pygame.font.SysFont("Arial", 60, bold=True)
    fonte_sub = pygame.font.SysFont("Arial", 30, bold=True)

    while True:
        tela.fill(COR_BRANCA)
        
        titulo = fonte_titulo.render("Engine de Xadrez", True, (40, 40, 40))
        tela.blit(titulo, titulo.get_rect(center=(LARGURA_TELA//2, ALTURA//2 - 200)))
        
        txt_cor = fonte_sub.render("Escolha sua cor:", True, (40, 40, 40))
        tela.blit(txt_cor, txt_cor.get_rect(center=(LARGURA_TELA//2, ALTURA//2 - 140)))
        
        txt_dif = fonte_sub.render("Dificuldade (Profundidade):", True, (40, 40, 40))
        tela.blit(txt_dif, txt_dif.get_rect(center=(LARGURA_TELA//2, ALTURA//2 - 20)))

        pode_iniciar = (cor_selecionada is not None) and (profundidade_selecionada is not None)
        if pode_iniciar:
            btn_start.cor_fundo = COR_BOTAO_START
            btn_start.cor_hover = COR_HOVER_START
        else:
            btn_start.cor_fundo = COR_BOTAO_INATIVO
            btn_start.cor_hover = COR_BOTAO_INATIVO

        for b in botoes_cor + botoes_dif + [btn_start]:
            b.desenhar(tela)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                raise SystemExit()
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                pos = pygame.mouse.get_pos()
                
                if botoes_cor[0].checar_clique(pos):
                    cor_selecionada = chess.WHITE
                    botoes_cor[0].selecionado = True
                    botoes_cor[1].selecionado = False
                elif botoes_cor[1].checar_clique(pos):
                    cor_selecionada = chess.BLACK
                    botoes_cor[1].selecionado = True
                    botoes_cor[0].selecionado = False
                    
                for i, b in enumerate(botoes_dif):
                    if b.checar_clique(pos):
                        profundidade_selecionada = i + 1
                        for btn in botoes_dif: btn.selecionado = False
                        b.selecionado = True
                        
                if btn_start.checar_clique(pos) and pode_iniciar:
                    return cor_selecionada, profundidade_selecionada

        pygame.display.flip()


def main():
    """Função principal que inicializa o Pygame e roda o loop do jogo interativo."""
    pygame.init()
    tela = pygame.display.set_mode((LARGURA_TELA, ALTURA))
    pygame.display.set_caption("Engine de Xadrez")
    clock = pygame.time.Clock()
    
    carregar_imagens()
    
    caminho_engine = resource_path(os.path.join("ChessEngine", "ArquivosCpp", "EngineCpp.exe"))
    if not os.path.exists(caminho_engine):
        print(f"Erro: Engine nao encontrada em {caminho_engine}")
        raise SystemExit()
        
    engine = UCIEngine(caminho_engine)

    proxima_vez_jogador, profundidade_busca = tela_inicial(tela)
    jogar_de_pretas = (proxima_vez_jogador == chess.BLACK)

    tabuleiro = chess.Board()
    
    cliques_jogador = []
    casa_selecionada = None
    ultimo_lance = None
    game_over = False

    # Botão Inverter Tabuleiro
    btn_inverter = Botao(LARGURA_TABULEIRO + 20, ALTURA - 80, 160, 50, "Inverter Tab.", (70, 130, 180), (100, 149, 237), fonte_size=20)

    engine_buscando = False
    lance_calculado = None

    def engine_terminou(lance):
        nonlocal lance_calculado
        lance_calculado = lance

    running = True
    while running:
        eh_turno_humano = (tabuleiro.turn == proxima_vez_jogador)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_s and not game_over:
                    partida = chess.pgn.Game()
                    partida.headers["Event"] = "Partida Casual"
                    partida.headers["Site"] = "Local"
                    partida.headers["Date"] = "????.??.??"
                    partida.headers["Round"] = "?"
                    partida.headers["White"] = "Jogador Humano" if proxima_vez_jogador == chess.WHITE else "Engine"
                    partida.headers["Black"] = "Jogador Humano" if proxima_vez_jogador == chess.BLACK else "Engine"
                    partida.headers["Result"] = tabuleiro.result()

                    node = partida
                    for lance in tabuleiro.move_stack:
                        node = node.add_variation(lance)

                    caminho_salvar = os.path.join(os.getcwd(), 'partida_salva.pgn')
                    with open(caminho_salvar, "w", encoding="utf-8") as arquivo_pgn:
                        exporter = chess.pgn.FileExporter(arquivo_pgn)
                        partida.accept(exporter)
                    print("Partida salva em partida_salva.pgn")
            
            if event.type == pygame.MOUSEBUTTONDOWN:
                location = pygame.mouse.get_pos()
                
                # Checar se clicou no botão de inverter tabuleiro
                if btn_inverter.checar_clique(location):
                    jogar_de_pretas = not jogar_de_pretas
                
                # Checar se clicou dentro do tabuleiro
                elif eh_turno_humano and not game_over and location[0] < LARGURA_TABULEIRO:
                    indice_casa = screen_to_square(location, jogar_de_pretas)
                
                    if casa_selecionada is None:
                        if tabuleiro.piece_at(indice_casa) is not None and tabuleiro.piece_at(indice_casa).color == tabuleiro.turn:
                            casa_selecionada = indice_casa
                    else:
                        lance = chess.Move(casa_selecionada, indice_casa)
                        if tabuleiro.piece_at(casa_selecionada).piece_type == chess.PAWN and chess.square_rank(indice_casa) in [0, 7]:
                            lance.promotion = chess.QUEEN
                        
                        if lance in tabuleiro.legal_moves:
                            tabuleiro.push(lance)
                            ultimo_lance = lance
                            print(f"Jogador fez o lance: {lance.uci()}")
                        else:
                            print("Lance ilegal, tente novamente.")
                        
                        casa_selecionada = None


        if not tabuleiro.is_game_over() and not eh_turno_humano and not game_over:
            if not engine_buscando:
                engine_buscando = True
                engine.iniciar_busca_assincrona(tabuleiro, profundidade_busca, engine_terminou)
            elif lance_calculado is not None:
                print(f"Engine joga: {lance_calculado.uci()}")
                tabuleiro.push(lance_calculado)
                ultimo_lance = lance_calculado
                engine_buscando = False
                lance_calculado = None

        desenhar_estado_jogo(tela, tabuleiro, casa_selecionada, ultimo_lance, jogar_de_pretas)
        btn_inverter.desenhar(tela)
        
        if tabuleiro.is_game_over() and not game_over:
            game_over = True
            desenhar_estado_jogo(tela, tabuleiro, casa_selecionada, ultimo_lance, jogar_de_pretas)
            btn_inverter.desenhar(tela)
            pygame.display.flip()
            
            jogar_novamente = tela_fim_jogo(tela, tabuleiro.result())
            if jogar_novamente:
                proxima_vez_jogador, profundidade_busca = tela_inicial(tela)
                jogar_de_pretas = (proxima_vez_jogador == chess.BLACK)
                tabuleiro.reset()
                ultimo_lance = None
                game_over = False

        pygame.display.flip()
        
        clock.tick(FPS)
            
    engine.fechar()
    pygame.quit()

if __name__ == "__main__":
    main()