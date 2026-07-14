#include "evaluate.h"
#include <algorithm>
#include <cmath>

namespace engine {

const int PST_PEAO[64] = {
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
};

const int PST_CAVALO[64] = {
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
};

const int PST_BISPO[64] = {
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
};

const int PST_TORRE[64] = {
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
};

const int PST_RAINHA[64] = {
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
};

const int PST_REI[64] = {
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
};

int Evaluate::AvaliarTabuleiro(thc::ChessRules &cr, int nivel_dificuldade) {
    int pontuacao_total = 0;
    int material_branco = 0;
    int material_preto = 0;

    for (int i = 0; i < 64; i++) {
        char peca = cr.squares[i];
        if (peca == ' ' || peca == '\0') continue;

        int pontuacao_material = 0;
        const int* tabela_ps = nullptr;
        bool is_white = (peca >= 'A' && peca <= 'Z');
        char tipo_peca = is_white ? peca + 32 : peca; // converte para minuscula

        switch (tipo_peca) {
            case 'p': pontuacao_material = VALOR_PEAO; tabela_ps = PST_PEAO; break;
            case 'n': pontuacao_material = VALOR_CAVALO; tabela_ps = PST_CAVALO; break;
            case 'b': pontuacao_material = VALOR_BISPO; tabela_ps = PST_BISPO; break;
            case 'r': pontuacao_material = VALOR_TORRE; tabela_ps = PST_TORRE; break;
            case 'q': pontuacao_material = VALOR_RAINHA; tabela_ps = PST_RAINHA; break;
            case 'k': pontuacao_material = VALOR_REI; tabela_ps = PST_REI; break;
        }

        int pontuacao_posicional = 0;
        if (is_white) {
            pontuacao_posicional = tabela_ps[i];
            pontuacao_total += pontuacao_material + pontuacao_posicional;
            if (tipo_peca != 'k' && tipo_peca != 'p') material_branco += pontuacao_material;
        } else {
            pontuacao_posicional = tabela_ps[i ^ 56]; // Espelhamento vertical: inverte o bit 3, 4 e 5 (rank)
            pontuacao_total -= (pontuacao_material + pontuacao_posicional);
            if (tipo_peca != 'k' && tipo_peca != 'p') material_preto += pontuacao_material;
        }
    }

    // Lógica de Mop-up (Forçar o rei adversário para o canto no final do jogo)
    if (material_branco >= material_preto + 300 && material_preto <= 300) {
        int perdedor = cr.bking_square;
        int vencedor = cr.wking_square;
        
        int rank_p = perdedor / 8;
        int file_p = perdedor % 8;
        int dist_centro = std::max(3 - rank_p, rank_p - 4) + std::max(3 - file_p, file_p - 4);
        
        int rank_v = vencedor / 8;
        int file_v = vencedor % 8;
        int dist_reis = std::abs(rank_v - rank_p) + std::abs(file_v - file_p);
        
        pontuacao_total += (dist_centro * 20) + ((14 - dist_reis) * 10);
    } else if (material_preto >= material_branco + 300 && material_branco <= 300) {
        int perdedor = cr.wking_square;
        int vencedor = cr.bking_square;
        
        int rank_p = perdedor / 8;
        int file_p = perdedor % 8;
        int dist_centro = std::max(3 - rank_p, rank_p - 4) + std::max(3 - file_p, file_p - 4);
        
        int rank_v = vencedor / 8;
        int file_v = vencedor % 8;
        int dist_reis = std::abs(rank_v - rank_p) + std::abs(file_v - file_p);
        
        pontuacao_total -= (dist_centro * 20) + ((14 - dist_reis) * 10);
    }

    // --- LÓGICA DE DIFICULDADE PROGRESSIVA (HASH NOISE / MIOPIA ESTOCÁSTICA) ---
    // Aplica um ruído na visão da máquina baseado no nível, tornando-a capaz de cometer blunders.
    // O ruído é baseado na Hash64 da posição atual para que a Alpha-Beta pruning não enlouqueça avaliando
    // a mesma posição com notas diferentes. A mesma posição = O mesmo erro.
    int margem_erro = 0;
    switch (nivel_dificuldade) {
        case 2: margem_erro = 600; break; // Entrega torres e bispos sem ver (Erro enorme)
        case 3: margem_erro = 300; break; // Entrega peças menores (Erro moderado)
        case 4: margem_erro = 100; break; // Perde peões ou posicionamento (Erro tático leve)
        case 5: margem_erro = 50;  break; // Comete erros puramente posicionais (Inacurácia)
        case 6: margem_erro = 20;  break; // Pequenos vacilos estratégicos
        case 7: margem_erro = 5;   break; // Quase perfeito
        case 8: margem_erro = 0;   break; // Máquina de Matar (Implacável)
        default: margem_erro = 0;
    }

    if (margem_erro > 0) {
        uint64_t hash = cr.Hash64Calculate();
        // Gera um número pseudorandomico entre -margem_erro e +margem_erro deterministicamente
        int noise = (int)(hash % (margem_erro * 2)) - margem_erro;
        pontuacao_total += noise;
    }

    return pontuacao_total;
}

} // namespace engine
