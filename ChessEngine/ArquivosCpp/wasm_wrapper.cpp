#include <emscripten.h>
#include <string>
#include <cstring>
#include "thc.h"
#include "search.h"

// Mantemos uma string estática para retornar o ponteiro C com segurança
static std::string last_move = "";

extern "C" {

    // A diretiva EMSCRIPTEN_KEEPALIVE avisa o compilador que essa função
    // não deve ser apagada, pois será chamada de fora (pelo JavaScript).
    EMSCRIPTEN_KEEPALIVE
    const char* CalcularMelhorLance(const char* fen, int profundidade) {
        thc::ChessRules cr;
        
        // Se a FEN estiver vazia ou for 'startpos', carrega a inicial
        if (std::strcmp(fen, "startpos") == 0 || std::strcmp(fen, "") == 0) {
            cr.Forsyth("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        } else {
            cr.Forsyth(fen);
        }
        
        engine::Search s;
        thc::Move best_move = s.EncontrarMelhorLance(cr, profundidade);
        
        last_move = best_move.TerseOut();
        return last_move.c_str();
    }
}
