var board = null;
var game = new Chess();
var $status = $('#status');
var isEngineThinking = false;
var engineColor = 'b'; // Por padrão, humana joga de brancas
var gameStarted = false; // Bloqueia o tabuleiro antes de começar

// Valores das peças para a Vantagem Material
const pieceValues = {
  'p': 1,
  'n': 3,
  'b': 3,
  'r': 5,
  'q': 9,
  'k': 0
};

// ==========================================
// VANTAGEM MATERIAL E STATUS
// ==========================================
function calculateMaterial() {
  var scoreWhite = 0;
  var scoreBlack = 0;
  var boardArray = game.board();

  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      var p = boardArray[i][j];
      if (p) {
        if (p.color === 'w') scoreWhite += pieceValues[p.type];
        if (p.color === 'b') scoreBlack += pieceValues[p.type];
      }
    }
  }

  var diff = scoreWhite - scoreBlack;
  var materialText = "Material: Equilibrado";
  if (diff > 0) {
    materialText = "Vantagem Material: Brancas (+" + diff + ")";
  } else if (diff < 0) {
    materialText = "Vantagem Material: Pretas (+" + Math.abs(diff) + ")";
  }
  
  $('#materialScore').text(materialText);
}

function updateStatus () {
  var statusHTML = '';
  var moveColor = game.turn() === 'w' ? 'Brancas' : 'Pretas';

  if (!gameStarted) {
    statusHTML = "Clique em 'Nova Partida' para iniciar...";
  } else if (game.in_checkmate()) {
    statusHTML = 'Game over, ' + moveColor + ' em xeque-mate.';
    gameStarted = false; // Fim do jogo bloqueia
  } else if (game.in_draw()) {
    statusHTML = 'Game over, empate.';
    gameStarted = false; // Fim do jogo bloqueia
  } else {
    statusHTML = 'Vez das ' + moveColor;
    if (game.in_check()) {
      statusHTML += ', ' + moveColor + ' está em xeque!';
    }
  }

  $status.html(statusHTML);
  calculateMaterial();
}

// ==========================================
// INTEGRAÇÃO COM O WEBASSEMBLY (C++)
// ==========================================
function makeEngineMove() {
  if (game.game_over() || !gameStarted) return;
  
  isEngineThinking = true;
  $status.html('A IA está pensando (WebAssembly)... <span style="display:inline-block; animation: pulse 1s infinite">🧠</span>');
  
  var depth = parseInt($('#depthSelect').val(), 10);
  var fen = game.fen();

  setTimeout(function() {
      var fenPtr = stringToNewUTF8(fen);
      var movePtr = Module._CalcularMelhorLance(fenPtr, depth);
      var bestMove = UTF8ToString(movePtr);
      _free(fenPtr);
      
      var sourceSquare = bestMove.substring(0, 2);
      var targetSquare = bestMove.substring(2, 4);
      var promotion = bestMove.length > 4 ? bestMove[4] : 'q';
      
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
// REGRAS DE MOVIMENTO (DRAG & DROP E CLIQUES)
// ==========================================
function onDragStart (source, piece, position, orientation) {
  if (!gameStarted || game.game_over() || isEngineThinking) return false;
  
  // Impede o humano de roubar a vez da Engine
  if (game.turn() === engineColor) return false;

  // Permitir apenas mover as próprias peças
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  updateStatus();
  window.setTimeout(makeEngineMove, 250);
}

function onSnapEnd () {
  board.position(game.fen());
}

// Lógica de "Clique para Mover" e "Destaque de Lances"
var selectedSquare = null;

function removeHighlights() {
  $('#myBoard .square-55d63').removeClass('highlight-click');
  $('#myBoard .square-55d63').removeClass('highlight-move');
}

var originalOnDragStart = config ? config.onDragStart : null; // Segurança caso inicialização mude

$('#myBoard').on('click', '.square-55d63', function() {
  if (!gameStarted || game.game_over() || isEngineThinking) return;

  var square = $(this).attr('data-square');
  var piece = game.get(square);

  if (selectedSquare === null) {
    if (piece && piece.color === game.turn()) {
      var isWhiteTurn = game.turn() === 'w';
      if ((isWhiteTurn && engineColor === 'b') || (!isWhiteTurn && engineColor === 'w')) {
        selectedSquare = square;
        removeHighlights();
        $(this).addClass('highlight-click');
        
        var moves = game.moves({ square: square, verbose: true });
        for (var i = 0; i < moves.length; i++) {
          $('.square-' + moves[i].to).addClass('highlight-move');
        }
      }
    }
  } else {
    var move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q'
    });

    removeHighlights();

    if (move === null) {
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
      selectedSquare = null;
      board.position(game.fen());
      updateStatus();
      window.setTimeout(makeEngineMove, 250);
    }
  }
});

// ==========================================
// BOTÕES DA INTERFACE (AÇÕES)
// ==========================================

$('#startBtn').on('click', function() {
    game.reset();
    gameStarted = true;
    
    var playerColor = $('#colorSelect').val(); // 'w' ou 'b'
    // Se o jogador escolheu 'w' (Brancas), a engine joga de 'b' (Pretas)
    engineColor = (playerColor === 'w') ? 'b' : 'w';
    
    // A orientação do tabuleiro acompanha a cor do jogador humano
    var orientation = (playerColor === 'w') ? 'white' : 'black';
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

// Tela Cheia (Expandir)
$('#fullscreenBtn').on('click', function() {
    var wrapper = $('#boardWrapper');
    if (wrapper.hasClass('fullscreen-mode')) {
        wrapper.removeClass('fullscreen-mode');
        $(this).text('🔍 Expandir Tela');
    } else {
        wrapper.addClass('fullscreen-mode');
        $(this).text('❌ Sair da Tela Cheia');
    }
    // Força o chessboard.js a recalcular os tamanhos das peças
    setTimeout(function() { board.resize(); }, 350); 
});

// Copiar PGN
$('#copyPgnBtn').on('click', function() {
    var pgnData = game.pgn();
    if (!pgnData) pgnData = "Nenhum lance jogado ainda.";
    navigator.clipboard.writeText(pgnData).then(function() {
        var originalText = $('#copyPgnBtn').text();
        $('#copyPgnBtn').text('✔️ Copiado!');
        setTimeout(function() { $('#copyPgnBtn').text(originalText); }, 2000);
    });
});

// Baixar PGN
$('#downloadPgnBtn').on('click', function() {
    var pgnData = game.pgn();
    if (!pgnData) pgnData = "Nenhum lance jogado ainda.";
    
    var blob = new Blob([pgnData], { type: 'text/plain' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'minha_partida.pgn';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
});

// Inicialização
var config = {
  draggable: true,
  position: 'start',
  onDragStart: function(s, p, pos, o) { 
      removeHighlights();
      selectedSquare = null;
      return onDragStart(s, p, pos, o); 
  },
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
updateStatus();

// Animação CSS
$("<style>@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }</style>").appendTo("head");
