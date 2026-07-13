#include "search.h"
#include "evaluate.h"
#include <algorithm>

namespace engine {

Search::Search() {
    for (int i=0; i<64; i++) {
        lances_assassinos[i][0].Invalid();
        lances_assassinos[i][1].Invalid();
    }
}

int Search::GetValorPeca(char piece) {
    if (piece >= 'A' && piece <= 'Z') piece += 32;
    switch(piece) {
        case 'p': return VALOR_PEAO;
        case 'n': return VALOR_CAVALO;
        case 'b': return VALOR_BISPO;
        case 'r': return VALOR_TORRE;
        case 'q': return VALOR_RAINHA;
        default: return 0;
    }
}

bool Search::IsCheck(thc::ChessRules &cr) {
    if (cr.WhiteToPlay()) {
        return cr.AttackedSquare(cr.wking_square, false);
    } else {
        return cr.AttackedSquare(cr.bking_square, true);
    }
}

void Search::OrdenarCapturas(thc::ChessRules &cr, std::vector<thc::Move> &capturas) {
    std::vector<std::pair<int, thc::Move>> pontuacoes;
    for (const auto& lance : capturas) {
        char vitima = cr.squares[lance.dst];
        char atacante = cr.squares[lance.src];
        
        int pontuacao = 0;
        if (vitima != ' ' && vitima != '\0') {
            pontuacao += GetValorPeca(vitima) * 10;
        } else {
            // Pode ser en-passant
            pontuacao += VALOR_PEAO * 10;
        }
        
        if (atacante != ' ' && atacante != '\0') {
            pontuacao -= GetValorPeca(atacante);
        }
        
        pontuacoes.push_back({pontuacao, lance});
    }
    
    std::sort(pontuacoes.begin(), pontuacoes.end(), [](const std::pair<int, thc::Move>& a, const std::pair<int, thc::Move>& b) {
        return a.first > b.first;
    });
    
    for (size_t i = 0; i < pontuacoes.size(); i++) {
        capturas[i] = pontuacoes[i].second;
    }
}

void Search::OrdenarLances(thc::ChessRules &cr, std::vector<thc::Move> &lances, int profundidade, const thc::Move* lance_tt) {
    std::vector<std::pair<int, thc::Move>> pontuacoes;
    
    thc::Move assassino_1; assassino_1.Invalid();
    thc::Move assassino_2; assassino_2.Invalid();
    
    if (profundidade < 64) {
        assassino_1 = lances_assassinos[profundidade][0];
        assassino_2 = lances_assassinos[profundidade][1];
    }
    
    for (const auto& lance : lances) {
        int pontuacao = 0;
        if (lance_tt && lance == *lance_tt) {
            pontuacao = 100000;
        } else if (assassino_1.Valid() && lance == assassino_1) {
            pontuacao = 90000;
        } else if (assassino_2.Valid() && lance == assassino_2) {
            pontuacao = 80000;
        } else {
            if (lance.capture != ' ' && lance.capture != '\0') {
                pontuacao += 10000; // Capturas
            }
            if (lance.special >= thc::SPECIAL_PROMOTION_QUEEN && lance.special <= thc::SPECIAL_PROMOTION_KNIGHT) {
                pontuacao += 8000;
            }
        }
        pontuacoes.push_back({pontuacao, lance});
    }
    
    std::sort(pontuacoes.begin(), pontuacoes.end(), [](const std::pair<int, thc::Move>& a, const std::pair<int, thc::Move>& b) {
        return a.first > b.first;
    });
    
    for (size_t i = 0; i < pontuacoes.size(); i++) {
        lances[i] = pontuacoes[i].second;
    }
}

int Search::BuscaQuiescencia(thc::ChessRules &cr, int alfa, int beta, bool eh_jogador_maximizador, int profundidade_max) {
    thc::TERMINAL score_terminal;
    cr.Evaluate(score_terminal);
    if (score_terminal != thc::NOT_TERMINAL || profundidade_max == 0) {
        if (score_terminal == thc::TERMINAL_WCHECKMATE) return -99999;
        if (score_terminal == thc::TERMINAL_BCHECKMATE) return 99999;
        if (score_terminal == thc::TERMINAL_WSTALEMATE || score_terminal == thc::TERMINAL_BSTALEMATE) return 0;
        
        return Evaluate::AvaliarTabuleiro(cr);
    }
    
    int aval_estatica = Evaluate::AvaliarTabuleiro(cr);
    
    if (eh_jogador_maximizador) {
        if (aval_estatica + 1100 < alfa) return alfa; // Delta Pruning
        if (aval_estatica >= beta) return beta;
        if (aval_estatica > alfa) alfa = aval_estatica;
        
        std::vector<thc::Move> lances;
        cr.GenLegalMoveList(lances);
        std::vector<thc::Move> capturas;
        for (const auto& l : lances) {
            if (l.capture != ' ' && l.capture != '\0') {
                capturas.push_back(l);
            }
        }
        
        if (capturas.empty()) return aval_estatica;
        
        OrdenarCapturas(cr, capturas);
        int max_aval = aval_estatica;
        
        for (auto& lance : capturas) {
            cr.PushMove(lance);
            int aval = BuscaQuiescencia(cr, alfa, beta, false, profundidade_max - 1);
            cr.PopMove(lance);
            
            if (aval > max_aval) max_aval = aval;
            if (max_aval > alfa) alfa = max_aval;
            if (alfa >= beta) break;
        }
        return max_aval;
    } else {
        if (aval_estatica - 1100 > beta) return beta; // Delta Pruning
        if (aval_estatica <= alfa) return alfa;
        if (aval_estatica < beta) beta = aval_estatica;
        
        std::vector<thc::Move> lances;
        cr.GenLegalMoveList(lances);
        std::vector<thc::Move> capturas;
        for (const auto& l : lances) {
            if (l.capture != ' ' && l.capture != '\0') {
                capturas.push_back(l);
            }
        }
        
        if (capturas.empty()) return aval_estatica;
        
        OrdenarCapturas(cr, capturas);
        int min_aval = aval_estatica;
        
        for (auto& lance : capturas) {
            cr.PushMove(lance);
            int aval = BuscaQuiescencia(cr, alfa, beta, true, profundidade_max - 1);
            cr.PopMove(lance);
            
            if (aval < min_aval) min_aval = aval;
            if (min_aval < beta) beta = min_aval;
            if (alfa >= beta) break;
        }
        return min_aval;
    }
}

int Search::MinimaxAlfaBeta(thc::ChessRules &cr, int profundidade, int alfa, int beta, bool eh_jogador_maximizador) {
    int alfa_original = alfa;
    int beta_original = beta;
    uint64_t hash_chave = cr.Hash64Calculate();
    
    thc::Move* lance_tt_ptr = nullptr;
    thc::Move lance_tt; lance_tt.Invalid();
    
    auto it = tabela_transposicao.find(hash_chave);
    if (it != tabela_transposicao.end()) {
        const TTEntry& entrada = it->second;
        lance_tt = entrada.melhor_lance;
        lance_tt_ptr = &lance_tt;
        
        if (entrada.profundidade >= profundidade) {
            if (entrada.flag == 0) { // EXATO
                return entrada.valor;
            } else if (entrada.flag == 1) { // LIMITE_INFERIOR
                alfa = std::max(alfa, entrada.valor);
            } else if (entrada.flag == 2) { // LIMITE_SUPERIOR
                beta = std::min(beta, entrada.valor);
            }
            if (alfa >= beta) {
                return entrada.valor;
            }
        }
    }
    
    thc::TERMINAL score_terminal;
    cr.Evaluate(score_terminal);
    if (score_terminal != thc::NOT_TERMINAL) {
        if (score_terminal == thc::TERMINAL_WCHECKMATE) return -99999 - profundidade;
        if (score_terminal == thc::TERMINAL_BCHECKMATE) return 99999 + profundidade;
        return 0; // Empate
    }
    
    if (profundidade == 0) {
        return BuscaQuiescencia(cr, alfa, beta, eh_jogador_maximizador);
    }
    
    // Null Move Pruning (Poda de Lance Nulo)
    // Assume que passar a vez é o pior lance. Se mesmo passando a vez a avaliação for boa o suficiente para causar um corte beta, não precisamos buscar.
    int R = 2; // Fator de redução
    if (profundidade >= 3 && !IsCheck(cr)) {
        thc::ChessRules copia_nmp = cr;
        copia_nmp.Toggle();
        copia_nmp.enpassant_target = thc::SQUARE_INVALID;
        
        int aval_nula = MinimaxAlfaBeta(copia_nmp, profundidade - 1 - R, alfa, beta, !eh_jogador_maximizador);
        
        if (eh_jogador_maximizador && aval_nula >= beta) return beta;
        if (!eh_jogador_maximizador && aval_nula <= alfa) return alfa;
    }
    
    thc::Move melhor_lance; melhor_lance.Invalid();
    std::vector<thc::Move> lances;
    cr.GenLegalMoveList(lances);
    OrdenarLances(cr, lances, profundidade, lance_tt_ptr);
    
    int valor_final = 0;
    int movimentos_pesquisados = 0;
    bool in_check = IsCheck(cr);
    
    if (eh_jogador_maximizador) {
        int max_aval = -999999;
        for (auto& lance : lances) {
            cr.PushMove(lance);
            int aval = 0;
            
            bool is_capture = (lance.capture != ' ' && lance.capture != '\0');
            bool is_promotion = (lance.special >= thc::SPECIAL_PROMOTION_QUEEN && lance.special <= thc::SPECIAL_PROMOTION_KNIGHT);
            
            int profundidade_buscada = profundidade - 1;
            
            // Late Move Reductions (LMR)
            if (movimentos_pesquisados >= 4 && profundidade >= 3 && !is_capture && !is_promotion && !in_check) {
                profundidade_buscada--;
            }
            
            // Principal Variation Search (PVS)
            if (movimentos_pesquisados == 0) {
                aval = MinimaxAlfaBeta(cr, profundidade_buscada, alfa, beta, false);
            } else {
                aval = MinimaxAlfaBeta(cr, profundidade_buscada, alfa, alfa + 1, false);
                if (aval > alfa && aval < beta) {
                    aval = MinimaxAlfaBeta(cr, profundidade - 1, alfa, beta, false);
                }
            }
            
            cr.PopMove(lance);
            movimentos_pesquisados++;
            
            if (aval > max_aval) {
                max_aval = aval;
                melhor_lance = lance;
            }
            if (max_aval > alfa) alfa = max_aval;
            if (alfa >= beta) {
                if (profundidade < 64 && !is_capture) {
                    if (lances_assassinos[profundidade][0] != lance) {
                        lances_assassinos[profundidade][1] = lances_assassinos[profundidade][0];
                        lances_assassinos[profundidade][0] = lance;
                    }
                }
                break;
            }
        }
        valor_final = max_aval;
    } else {
        int min_aval = 999999;
        for (auto& lance : lances) {
            cr.PushMove(lance);
            int aval = 0;
            
            bool is_capture = (lance.capture != ' ' && lance.capture != '\0');
            bool is_promotion = (lance.special >= thc::SPECIAL_PROMOTION_QUEEN && lance.special <= thc::SPECIAL_PROMOTION_KNIGHT);
            
            int profundidade_buscada = profundidade - 1;
            
            // Late Move Reductions (LMR)
            if (movimentos_pesquisados >= 4 && profundidade >= 3 && !is_capture && !is_promotion && !in_check) {
                profundidade_buscada--;
            }
            
            // Principal Variation Search (PVS)
            if (movimentos_pesquisados == 0) {
                aval = MinimaxAlfaBeta(cr, profundidade_buscada, alfa, beta, true);
            } else {
                aval = MinimaxAlfaBeta(cr, profundidade_buscada, beta - 1, beta, true);
                if (aval > alfa && aval < beta) {
                    aval = MinimaxAlfaBeta(cr, profundidade - 1, alfa, beta, true);
                }
            }
            
            cr.PopMove(lance);
            movimentos_pesquisados++;
            
            if (aval < min_aval) {
                min_aval = aval;
                melhor_lance = lance;
            }
            if (min_aval < beta) beta = min_aval;
            if (alfa >= beta) {
                if (profundidade < 64 && !is_capture) {
                    if (lances_assassinos[profundidade][0] != lance) {
                        lances_assassinos[profundidade][1] = lances_assassinos[profundidade][0];
                        lances_assassinos[profundidade][0] = lance;
                    }
                }
                break;
            }
        }
        valor_final = min_aval;
    }
    
    int flag = 0;
    if (valor_final <= alfa_original) {
        flag = 2; // LIMITE_SUPERIOR
    } else if (valor_final >= beta_original) {
        flag = 1; // LIMITE_INFERIOR
    } else {
        flag = 0; // EXATO
    }
    
    TTEntry entrada;
    entrada.valor = valor_final;
    entrada.melhor_lance = melhor_lance;
    entrada.profundidade = profundidade;
    entrada.flag = flag;
    
    tabela_transposicao[hash_chave] = entrada;
    
    return valor_final;
}

thc::Move Search::EncontrarMelhorLance(thc::ChessRules &cr, int profundidade) {
    tabela_transposicao.clear(); // Previne estouro de memoria
    for (int i=0; i<64; i++) {
        lances_assassinos[i][0].Invalid();
        lances_assassinos[i][1].Invalid();
    }
    
    thc::Move melhor_lance_global; melhor_lance_global.Invalid();
    bool is_white = cr.WhiteToPlay();
    
    // Aprofundamento Iterativo
    for (int d = 1; d <= profundidade; d++) {
        std::vector<thc::Move> lances;
        cr.GenLegalMoveList(lances);
        
        // Pega o melhor lance da TT da profundidade anterior se possivel
        thc::Move* lance_tt_ptr = nullptr;
        uint64_t hash_chave = cr.Hash64Calculate();
        if (tabela_transposicao.count(hash_chave)) {
            lance_tt_ptr = &tabela_transposicao[hash_chave].melhor_lance;
        }
        
        OrdenarLances(cr, lances, d, lance_tt_ptr);
        
        int alfa = -999999;
        int beta = 999999;
        
        thc::Move melhor_lance_atual = lances[0];
        
        if (is_white) {
            int max_aval = -999999;
            for (auto& lance : lances) {
                cr.PushMove(lance);
                int aval = MinimaxAlfaBeta(cr, d - 1, alfa, beta, false);
                cr.PopMove(lance);
                
                if (aval > max_aval) {
                    max_aval = aval;
                    melhor_lance_atual = lance;
                }
                if (max_aval > alfa) alfa = max_aval;
            }
        } else {
            int min_aval = 999999;
            for (auto& lance : lances) {
                cr.PushMove(lance);
                int aval = MinimaxAlfaBeta(cr, d - 1, alfa, beta, true);
                cr.PopMove(lance);
                
                if (aval < min_aval) {
                    min_aval = aval;
                    melhor_lance_atual = lance;
                }
                if (min_aval < beta) beta = min_aval;
            }
        }
        
        if (melhor_lance_atual.Valid()) {
            melhor_lance_global = melhor_lance_atual;
        }
    }
    
    return melhor_lance_global;
}

} // namespace engine
