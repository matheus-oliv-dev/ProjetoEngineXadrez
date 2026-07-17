var board = null;
var game = new Chess();
var $status = $('#status');
var isEngineThinking = false;
var engineColor = 'b'; // Por padrão, humana joga de brancas
var gameStarted = false; // Bloqueia o tabuleiro antes de começar

// Valores das peças para a Vantagem Material
const pieceValues = {
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
};

// ==========================================
// SISTEMA DE TEMPO (RELÓGIOS)
// ==========================================
var timerInterval = null;
var timeWhite = 0;
var timeBlack = 0;
var increment = 0;
var useTimer = false;
var lastTick = 0;
var $whiteClock, $blackClock;

function initTimer() {
    clearInterval(timerInterval);
    var timeControl = $('#timeControl').val();
    if (timeControl === 'none') {
        useTimer = false;
        $('#topPlayerInfo, #bottomPlayerInfo').hide();
        return;
    }
    
    useTimer = true;
    var parts = timeControl.split('|');
    var baseSecs = parseInt(parts[0], 10);
    var incSecs = parseInt(parts[1], 10);
    
    timeWhite = baseSecs * 1000;
    timeBlack = baseSecs * 1000;
    increment = incSecs * 1000;
    
    $('#topPlayerInfo, #bottomPlayerInfo').show();
    setClockSides();
    updateClockDisplay();
}

function setClockSides() {
    var playerColor = $('#colorSelect').val(); // 'w' ou 'b'
    if (playerColor === 'w') {
        $whiteClock = $('#bottomClock');
        $blackClock = $('#topClock');
    } else {
        $whiteClock = $('#topClock');
        $blackClock = $('#bottomClock');
    }
}

function formatTime(ms) {
    if (ms < 0) ms = 0;
    var totalSeconds = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    var msPart = "";
    if (ms < 10000 && ms > 0) {
        var tenths = Math.floor((ms % 1000) / 100);
        msPart = "." + tenths;
    }
    return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds) + msPart;
}

function updateClockDisplay() {
    if (!useTimer) return;
    $whiteClock.text(formatTime(timeWhite));
    $blackClock.text(formatTime(timeBlack));
    
    $whiteClock.removeClass('active');
    $blackClock.removeClass('active');
    
    if (gameStarted && !game.game_over()) {
        if (game.turn() === 'w') $whiteClock.addClass('active');
        else $blackClock.addClass('active');
    }
}

function consumeTime(manualElapsed) {
    if (!useTimer || !gameStarted || game.game_over()) return;
    
    var now = performance.now();
    var elapsed = (manualElapsed !== undefined) ? manualElapsed : (now - lastTick);
    lastTick = now;
    
    if (game.turn() === 'w') {
        timeWhite -= elapsed;
        if (timeWhite <= 0) timeOut('w');
    } else {
        timeBlack -= elapsed;
        if (timeBlack <= 0) timeOut('b');
    }
    updateClockDisplay();
}

function addIncrementForLastMove() {
    if (!useTimer || !gameStarted || game.game_over()) return;
    if (game.turn() === 'b') { timeWhite += increment; } 
    else { timeBlack += increment; }
    updateClockDisplay();
}

function timeOut(color) {
    timeWhite = Math.max(0, timeWhite);
    timeBlack = Math.max(0, timeBlack);
    gameStarted = false;
    var msg = color === 'w' ? i18n.t('status_timeout_b') : i18n.t('status_timeout_w');
    showGameOverOverlay(msg);
}

function tickTimer() {
    consumeTime();
}

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
  var materialText = i18n.t('material_balanced');
  if (diff > 0) {
    materialText = (i18n.currentLang === 'pt' ? "Vantagem Material: Brancas (+" : "Material Advantage: White (+") + diff + ")";
  } else if (diff < 0) {
    materialText = (i18n.currentLang === 'pt' ? "Vantagem Material: Pretas (+" : "Material Advantage: Black (+") + Math.abs(diff) + ")";
  }
  
  $('#materialScore').text(materialText);
}

function showGameOverOverlay(message) {
  $('#gameOverMessage').text(message);
  $('#gameOverOverlay').css('display', 'flex');
}

function updateStatus () {
  var statusHTML = '';

  if (!gameStarted) {
    statusHTML = i18n.t('status_start');
  } else if (game.in_checkmate()) {
    statusHTML = i18n.t(game.turn() === 'w' ? 'status_checkmate_b' : 'status_checkmate_w');
    gameStarted = false; // Fim do jogo bloqueia
    showGameOverOverlay(statusHTML);
  } else if (game.in_draw()) {
    statusHTML = i18n.t(game.in_stalemate() ? 'status_stalemate' : 'status_draw');
    gameStarted = false; // Fim do jogo bloqueia
    showGameOverOverlay(statusHTML);
  } else {
    statusHTML = i18n.t(game.turn() === 'w' ? 'status_white_turn' : 'status_black_turn');
    if (game.in_check()) {
      statusHTML += i18n.t('status_check');
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
  var thinkingTxt = i18n.currentLang === 'pt' ? 'A IA está pensando (WebAssembly)...' : 'AI is thinking (WebAssembly)...';
  $status.html(thinkingTxt + ' <span style="display:inline-block; animation: pulse 1s infinite">🧠</span>');
  
  var depth = parseInt($('#depthSelect').val(), 10);
  var fen = game.fen();
  
  consumeTime(); // Desconta qualquer delay do JS antes de travar
  
  setTimeout(function() {
      var thinkStart = performance.now();
      var fenPtr = stringToNewUTF8(fen);
      var movePtr = Module._CalcularMelhorLance(fenPtr, depth);
      var bestMove = UTF8ToString(movePtr);
      _free(fenPtr);
      var thinkEnd = performance.now();
      
      consumeTime(thinkEnd - thinkStart); // Desconta o exato tempo que a IA demorou
      
      var sourceSquare = bestMove.substring(0, 2);
      var targetSquare = bestMove.substring(2, 4);
      var promotion = bestMove.length > 4 ? bestMove[4] : 'q';
      
      game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotion
      });
      
      addIncrementForLastMove(); // Dá o bônus de tempo da IA
      lastTick = performance.now(); // Resync para não descontar do humano
      
      board.position(game.fen());
      isEngineThinking = false;
      updateStatus();
  }, 10);
}

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
  if (game.turn() === engineColor) return; 

  var piece = game.get(square);

  if (selectedSquare === null) {
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
    consumeTime();
    var move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q'
    });

    removeHighlights();

    if (move === null) {
      if (piece && piece.color === game.turn()) {
        selectedSquare = square;
        $('.square-' + square).addClass('highlight-click');
        
        var moves = game.moves({ square: square, verbose: true });
        for (var i = 0; i < moves.length; i++) {
          $('.square-' + moves[i].to).addClass('highlight-move');
        }
      } else {
        selectedSquare = null;
      }
    } else {
      addIncrementForLastMove();
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
  if (source === target) {
    handleSquareClick(source);
    return 'snapback';
  }

  consumeTime();
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  removeHighlights();
  selectedSquare = null;

  if (move === null) return 'snapback';

  addIncrementForLastMove();
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
    $('#floatingRestartBtn').hide();
    game.reset();
    gameStarted = true;
    
    $('#fullscreenBtn').prop('disabled', false).text(i18n.t('btn_fullscreen'));
    
    var playerColor = $('#colorSelect').val(); // 'w' ou 'b'
    engineColor = (playerColor === 'w') ? 'b' : 'w';
    
    var orientation = (playerColor === 'w') ? 'white' : 'black';
    board.orientation(orientation);
    
    // Configura e Inicializa os Relógios
    initTimer();
    if (useTimer) {
        lastTick = performance.now();
        timerInterval = setInterval(tickTimer, 50);
    }
    
    board.position(game.fen());
    updateStatus();
    
    if (engineColor === 'w') {
        window.setTimeout(makeEngineMove, 500);
    }
}

$('#startBtn, #overlayRestartBtn, #floatingRestartBtn').on('click', startNewGame);

$('#hideOverlayBtn').on('click', function() {
    $('#gameOverOverlay').hide();
    $('#floatingRestartBtn').show();
});

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
    if (!pgnData) pgnData = i18n.currentLang === 'pt' ? "Nenhum lance jogado ainda." : "No moves played yet.";
    var btn = $(this);
    navigator.clipboard.writeText(pgnData).then(function() {
        var originalText = btn.text();
        btn.text(i18n.currentLang === 'pt' ? '✔️ Copiado!' : '✔️ Copied!');
        setTimeout(function() { btn.text(originalText); }, 2000);
    });
});

// Baixar PGN
$('#downloadPgnBtn, #overlayDownloadPgnBtn').on('click', function() {
    var pgnData = game.pgn();
    if (!pgnData) pgnData = i18n.currentLang === 'pt' ? "Nenhum lance jogado ainda." : "No moves played yet.";
    
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
