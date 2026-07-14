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

function showGameOverOverlay(message) {
  $('#gameOverMessage').text(message);
  $('#gameOverOverlay').css('display', 'flex');
}

function updateStatus () {
  var statusHTML = '';
  var moveColor = game.turn() === 'w' ? 'Brancas' : 'Pretas';

  if (!gameStarted) {
    statusHTML = "Clique em 'Nova Partida' para iniciar...";
  } else if (game.in_checkmate()) {
    statusHTML = 'Game over, ' + moveColor + ' em xeque-mate.';
    gameStarted = false; // Fim do jogo bloqueia
    showGameOverOverlay(statusHTML);
  } else if (game.in_draw()) {
    statusHTML = 'Game over, empate.';
    gameStarted = false; // Fim do jogo bloqueia
    showGameOverOverlay(statusHTML);
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
// ==========================================
// REGRAS DE MOVIMENTO (DRAG & DROP E CLIQUES)
// ==========================================
var selectedSquare = null;

function removeHighlights() {
  $('#myBoard .square-55d63').removeClass('highlight-click');
  $('#myBoard .square-55d63').removeClass('highlight-move');
}

function handleSquareClick(square) {
  if (!gameStarted || game.game_over() || isEngineThinking) return;
  if (game.turn() === engineColor) return; // Humano não pode jogar pela IA

  var piece = game.get(square);

  if (selectedSquare === null) {
    // 1. Clicou numa peça própria pela primeira vez
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      removeHighlights();
      $('.square-' + square).addClass('highlight-click');
      
      var moves = game.moves({ square: square, verbose: true });
      for (var i = 0; i < moves.length; i++) {
        $('.square-' + moves[i].to).addClass('highlight-move');
      }
    }
  } else {
    // 2. Já tinha peça selecionada, tenta mover para a casa clicada
    var move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q'
    });

    removeHighlights();

    if (move === null) {
      // Movimento inválido (ex: clicou em outra peça própria ou lugar errado)
      if (piece && piece.color === game.turn()) {
        // Seleciona a nova peça em vez disso
        selectedSquare = square;
        $('.square-' + square).addClass('highlight-click');
        
        var moves = game.moves({ square: square, verbose: true });
        for (var i = 0; i < moves.length; i++) {
          $('.square-' + moves[i].to).addClass('highlight-move');
        }
      } else {
        selectedSquare = null; // Clicou no vazio, anula a seleção
      }
    } else {
      // 3. Movimento válido através de clique!
      selectedSquare = null;
      board.position(game.fen());
      updateStatus();
      window.setTimeout(makeEngineMove, 250);
    }
  }
}

function onDragStart (source, piece, position, orientation) {
  if (!gameStarted || game.game_over() || isEngineThinking) return false;
  if (game.turn() === engineColor) return false;

  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
  // Se o source for igual ao target, o usuário apenas "clicou" e soltou a peça na mesma casa
  if (source === target) {
    handleSquareClick(source);
    return 'snapback'; // Devolve a imagem da peça pro lugar
  }

  // Se for um "arraste" de verdade para outra casa
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  removeHighlights();
  selectedSquare = null;

  if (move === null) return 'snapback';

  updateStatus();
  window.setTimeout(makeEngineMove, 250);
}

function onSnapEnd () {
  board.position(game.fen());
}

// Captura cliques nativamente antes do chessboard.js "engolir" o evento nas peças inimigas
var myBoardEl = document.getElementById('myBoard');

function boardInteractionHandler(e) {
  var squareNode = e.target.closest('.square-55d63');
  if (!squareNode) return;

  var square = squareNode.getAttribute('data-square');
  var piece = game.get(square);

  // Se for a nossa peça, deixamos o `onDrop` ou drag do chessboard assumir o comando
  if (piece && piece.color === game.turn() && game.turn() !== engineColor) {
     return;
  }

  // Se clicou numa peça INIMIGA ou casa VAZIA, nós paramos o chessboard.js e processamos como Clique!
  e.stopPropagation();
  e.preventDefault();
  handleSquareClick(square);
}

myBoardEl.addEventListener('mousedown', boardInteractionHandler, true);
myBoardEl.addEventListener('touchstart', boardInteractionHandler, true);

// ==========================================
// BOTÕES DA INTERFACE (AÇÕES)
// ==========================================

function startNewGame() {
    $('#gameOverOverlay').hide();
    game.reset();
    gameStarted = true;
    
    // Destrava o botão de Tela Cheia agora que a partida começou
    $('#fullscreenBtn').prop('disabled', false).text('🔍 Expandir Tela');
    
    var playerColor = $('#colorSelect').val(); // 'w' ou 'b'
    engineColor = (playerColor === 'w') ? 'b' : 'w';
    
    var orientation = (playerColor === 'w') ? 'white' : 'black';
    board.orientation(orientation);
    
    board.position(game.fen());
    updateStatus();
    
    if (engineColor === 'w') {
        window.setTimeout(makeEngineMove, 500);
    }
}

$('#startBtn, #overlayRestartBtn').on('click', startNewGame);

$('#flipBtn').on('click', function() {
    board.flip();
});

// Tela Cheia (Expandir)
$('#fullscreenBtn').on('click', function() {
    var wrapper = $('#boardWrapper');
    wrapper.addClass('fullscreen-mode');
    $('#closeFullscreenBtn').show();
    setTimeout(function() { board.resize(); }, 350); 
});

$('#closeFullscreenBtn').on('click', function() {
    var wrapper = $('#boardWrapper');
    wrapper.removeClass('fullscreen-mode');
    $(this).hide();
    setTimeout(function() { board.resize(); }, 350); 
});

// Copiar PGN
$('#copyPgnBtn, #overlayCopyPgnBtn').on('click', function() {
    var pgnData = game.pgn();
    if (!pgnData) pgnData = "Nenhum lance jogado ainda.";
    var btn = $(this);
    navigator.clipboard.writeText(pgnData).then(function() {
        var originalText = btn.text();
        btn.text('✔️ Copiado!');
        setTimeout(function() { btn.text(originalText); }, 2000);
    });
});

// Baixar PGN
$('#downloadPgnBtn, #overlayDownloadPgnBtn').on('click', function() {
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
