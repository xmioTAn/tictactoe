const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('Serwer działa na porcie 8080');

let waitingPlayer = null;

wss.on('connection', (ws) => {
  console.log('Nowy gracz dołączył');

  if (waitingPlayer === null) {
    waitingPlayer = ws;
    ws.send(JSON.stringify({ type: 'message', text: 'Czekaj na przeciwnika...' }));
  } else {
    const player1 = waitingPlayer;
    const player2 = ws;
    waitingPlayer = null;

    const gameState = {
      board: Array(9).fill(''),
      currentPlayer: 'X',
    };

    player1.symbol = 'X';
    player2.symbol = 'O';

    player1.send(JSON.stringify({ type: 'start', symbol: 'X' }));
    player2.send(JSON.stringify({ type: 'start', symbol: 'O' }));

    player1.opponent = player2;
    player2.opponent = player1;

    function onMessage(message) {
      const data = JSON.parse(message);

      if (data.type === 'move') {
        const { index, symbol } = data;
        if (gameState.board[index] === '' && symbol === gameState.currentPlayer) {
          gameState.board[index] = symbol;
          gameState.currentPlayer = symbol === 'X' ? 'O' : 'X';

          player1.send(JSON.stringify({ type: 'update', board: gameState.board, currentPlayer: gameState.currentPlayer }));
          player2.send(JSON.stringify({ type: 'update', board: gameState.board, currentPlayer: gameState.currentPlayer }));
        }
      }
    }

    player1.on('message', onMessage);
    player2.on('message', onMessage);
  }

  ws.on('close', () => {
    console.log('Gracz się rozłączył');
    if (ws.opponent) {
      ws.opponent.send(JSON.stringify({ type: 'message', text: 'Przeciwnik się rozłączył.' }));
      ws.opponent.opponent = null;
    }
    if (waitingPlayer === ws) waitingPlayer = null;
  });
});
