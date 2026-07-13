#ifndef EVALUATE_H
#define EVALUATE_H

#include "thc.h"

namespace engine {

// Valores das peças
const int VALOR_PEAO = 100;
const int VALOR_CAVALO = 300;
const int VALOR_BISPO = 300;
const int VALOR_TORRE = 500;
const int VALOR_RAINHA = 900;
const int VALOR_REI = 0;

class Evaluate {
public:
    static int AvaliarTabuleiro(const thc::ChessRules &cr);
};

} // namespace engine

#endif // EVALUATE_H
