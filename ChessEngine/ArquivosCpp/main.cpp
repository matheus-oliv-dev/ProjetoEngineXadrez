#include <cstdio>
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include "thc.h"
#include "search.h"

int main() {
    // Desabilita bufferizacao do C++ (necessario para o Python ler a stdout em tempo real)
    std::setvbuf(stdout, NULL, _IONBF, 0);

    thc::ChessRules cr;
    engine::Search search;
    
    std::string line;
    while (std::getline(std::cin, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }
        
        if (line == "uci") {
            std::cout << "id name EngineCpp" << std::endl;
            std::cout << "id author Matheus" << std::endl;
            std::cout << "uciok" << std::endl;
        } else if (line == "isready") {
            std::cout << "readyok" << std::endl;
        } else if (line.find("position") == 0) {
            std::stringstream ss(line);
            std::string token;
            ss >> token; // descarta "position"
            ss >> token; // "startpos" ou "fen"
            
            if (token == "startpos") {
                cr.Forsyth("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
                if (ss >> token) {
                    // deve ser "moves"
                }
            } else if (token == "fen") {
                std::string fen = "";
                for (int i = 0; i < 6; i++) { // A FEN tem 6 partes
                    if (ss >> token) {
                        fen += token + " ";
                    }
                }
                cr.Forsyth(fen.c_str());
                if (ss >> token) {
                    // deve ser "moves"
                }
            }
            
            // Se tiver lances apos "moves"
            if (token == "moves") {
                while (ss >> token) {
                    thc::Move mv;
                    mv.TerseIn(&cr, token.c_str());
                    cr.PushMove(mv);
                }
            }
        } else if (line.find("go") == 0) {
            std::stringstream ss(line);
            std::string token;
            int depth = 5; // profundidade padrao se nao for especificada
            while (ss >> token) {
                if (token == "depth") {
                    ss >> depth;
                }
            }
            
            thc::Move best = search.EncontrarMelhorLance(cr, depth);
            std::cout << "bestmove " << best.TerseOut() << std::endl;
        } else if (line == "quit") {
            break;
        }
    }
    return 0;
}
