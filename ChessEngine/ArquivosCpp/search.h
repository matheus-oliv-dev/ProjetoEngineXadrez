#ifndef SEARCH_H
#define SEARCH_H

#include "thc.h"
#include <vector>
#include <unordered_map>

namespace engine {

struct TTEntry {
    int valor;
    thc::Move melhor_lance;
    int profundidade;
    int flag; // 0=EXATO, 1=LIMITE_INFERIOR, 2=LIMITE_SUPERIOR
};

class Search {
public:
    Search();
    thc::Move EncontrarMelhorLance(thc::ChessRules &cr, int profundidade);
    
private:
    std::unordered_map<uint64_t, TTEntry> tabela_transposicao;
    thc::Move lances_assassinos[64][2];
    
    int BuscaQuiescencia(thc::ChessRules &cr, int alfa, int beta, bool eh_jogador_maximizador, int profundidade_max=4);
    int MinimaxAlfaBeta(thc::ChessRules &cr, int profundidade, int alfa, int beta, bool eh_jogador_maximizador);
    
    void OrdenarLances(thc::ChessRules &cr, std::vector<thc::Move> &lances, int profundidade, const thc::Move* lance_tt);
    void OrdenarCapturas(thc::ChessRules &cr, std::vector<thc::Move> &capturas);
    
    bool IsCheck(thc::ChessRules &cr);
    int GetValorPeca(char piece);
};

} // namespace engine

#endif // SEARCH_H
