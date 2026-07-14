. ..\emsdk\emsdk_env.ps1
emcc ChessEngine/ArquivosCpp/wasm_wrapper.cpp ChessEngine/ArquivosCpp/thc.cpp ChessEngine/ArquivosCpp/evaluate.cpp ChessEngine/ArquivosCpp/search.cpp -s WASM=1 -s EXPORTED_FUNCTIONS="['_CalcularMelhorLance', '_free', '_malloc']" -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'UTF8ToString', 'stringToNewUTF8']" -O3 -o WebApp/engine.js
