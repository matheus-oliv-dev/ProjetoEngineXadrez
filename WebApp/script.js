var board = null;
var game = new Chess();
var $status = $('#status');
var isEngineThinking = false;
var engineColor = 'b'; // Por padrão, humana joga de brancas

// Configurações do tabuleiro
function onDragStart (source, piece, position, orientation) {
  // Não permitir mover se o jogo acabou ou se é a vez da Engine
  if (game.game_over() || isEngineThinking) return false;

  // Permitir apenas mover as próprias peças
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
  // Ver se o movimento é legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // Sempre promove para Rainha pra simplificar
  });

  // Movimento Ilegal
  if (move === null) return 'snapback';

  updateStatus();
  
  // Fazer a IA jogar depois de um pequeno delay
  window.setTimeout(makeEngineMove, 250);
}

// Atualizar o tabuleiro quando o castling, en passant, promotion acontece
function onSnapEnd () {
  board.position(game.fen());
}

function updateStatus () {
  var statusHTML = '';
  var moveColor = game.turn() === 'w' ? 'Brancas' : 'Pretas';

  if (game.in_checkmate()) {
    statusHTML = 'Game over, ' + moveColor + ' em xeque-mate.';
  } else if (game.in_draw()) {
    statusHTML = 'Game over, empate.';
  } else {
    statusHTML = 'Vez das ' + moveColor;
    if (game.in_check()) {
      statusHTML += ', ' + moveColor + ' está em xeque!';
    }
  }

  $status.html(statusHTML);
}

// ==========================================
// INTEGRAÇÃO COM O WEBASSEMBLY (C++)
// ==========================================

function makeEngineMove() {
  if (game.game_over()) return;
  
  isEngineThinking = true;
  $status.html('A IA está pensando (WebAssembly)... <span style="display:inline-block; animation: pulse 1s infinite">🧠</span>');
  
  // Pega a dificuldade selecionada
  var depth = parseInt($('#depthSelect').val(), 10);
  var fen = game.fen();

  // O Module._CalcularMelhorLance é a função exportada do nosso C++!
  // Como strings em C++ são ponteiros, precisamos usar a API do Emscripten para alocar e ler
  
  // Damos um pequeno delay (setTimeout de 10ms) para o navegador conseguir renderizar
  // o texto "A IA está pensando" antes de travar a thread executando o C++ pesado.
  setTimeout(function() {
      // 1. Aloca string no WASM
      var fenPtr = stringToNewUTF8(fen);
      
      // 2. Chama a função C++!
      var movePtr = Module._CalcularMelhorLance(fenPtr, depth);
      
      // 3. Pega a string de volta do C++
      var bestMove = UTF8ToString(movePtr);
      
      // 4. Libera memória
      _free(fenPtr);
      
      console.log("Melhor lance encontrado pela IA C++: " + bestMove);
      
      // O lance vem como "e2e4". Vamos converter para from/to
      var sourceSquare = bestMove.substring(0, 2);
      var targetSquare = bestMove.substring(2, 4);
      var promotion = bestMove.length > 4 ? bestMove[4] : 'q';
      
      // Aplica a jogada
      game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotion
      });
      
      board.position(game.fen());
      isEngineThinking = false;
      updateStatus();
      
  }, 10);
}

// ==========================================
// BOTÕES DA INTERFACE
// ==========================================

$('#startBtn').on('click', function() {
    game.reset();
    engineColor = $('#colorSelect').val();
    
    // Configura orientação do tabuleiro
    var orientation = engineColor === 'b' ? 'white' : 'black';
    board.orientation(orientation);
    board.position(game.fen());
    updateStatus();
    
    // Se a IA for as brancas, ela joga primeiro
    if (engineColor === 'w') {
        window.setTimeout(makeEngineMove, 500);
    }
});

$('#flipBtn').on('click', function() {
    board.flip();
});

// Inicialização
var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png' // Usar assets online para facilitar
};

board = Chessboard('myBoard', config);

// Lógica de "Clique para Mover" e "Destaque de Lances"
var selectedSquare = null;

function removeHighlights() {
  $('#myBoard .square-55d63').removeClass('highlight-click');
  $('#myBoard .square-55d63').removeClass('highlight-move');
}

// Ao arrastar (Drag), também limpa os highlights
var originalOnDragStart = config.onDragStart;
config.onDragStart = function(source, piece, position, orientation) {
  removeHighlights();
  selectedSquare = null;
  return originalOnDragStart(source, piece, position, orientation);
};

$('#myBoard').on('click', '.square-55d63', function() {
  if (game.game_over() || isEngineThinking) return;

  var square = $(this).attr('data-square');
  var piece = game.get(square);

  if (selectedSquare === null) {
    // Se clicou numa peça da cor atual
    if (piece && piece.color === game.turn()) {
      var isWhiteTurn = game.turn() === 'w';
      if ((isWhiteTurn && engineColor === 'b') || (!isWhiteTurn && engineColor === 'w')) {
        selectedSquare = square;
        removeHighlights();
        $(this).addClass('highlight-click');
        
        // Pega todos os lances legais para essa peça
        var moves = game.moves({ square: square, verbose: true });
        for (var i = 0; i < moves.length; i++) {
          $('.square-' + moves[i].to).addClass('highlight-move');
        }
      }
    }
  } else {
    // Tenta mover
    var move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q'
    });

    removeHighlights();

    if (move === null) {
      // Movimento inválido (talvez clicou em outra peça própria)
      if (piece && piece.color === game.turn()) {
        selectedSquare = square;
        $(this).addClass('highlight-click');
        
        var moves = game.moves({ square: square, verbose: true });
        for (var i = 0; i < moves.length; i++) {
          $('.square-' + moves[i].to).addClass('highlight-move');
        }
      } else {
        selectedSquare = null;
      }
    } else {
      // Movimento Válido
      selectedSquare = null;
      board.position(game.fen());
      updateStatus();
      window.setTimeout(makeEngineMove, 250);
    }
  }
});
updateStatus();

// Animação CSS inline para o cérebro
$("<style>@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }</style>").appendTo("head");
