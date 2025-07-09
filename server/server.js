const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
  console.log('Użytkownik połączony');

  ws.on('message', function incoming(message) {
    console.log('Odebrano: %s', message);

    // Wyślij do wszystkich innych klientów
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', function close() {
    console.log('Użytkownik rozłączony');
  });
});

console.log(`Serwer działa na porcie ${PORT}`);

let waitingPlayer = null;

wss.on('connection', function connection(ws) {
  console.log('Nowy gracz połączony');

  if (waitingPlayer === null) {
    ws.symbol = 'X';
    waitingPlayer = ws;
  } else {
    ws.symbol = 'O';
    waitingPlayer.opponent = ws;
    ws.opponent = waitingPlayer;

    waitingPlayer.send(JSON.stringify({ type: 'assign', symbol: 'X' }));
    ws.send(JSON.stringify({ type: 'assign', symbol: 'O' }));

    waitingPlayer = null;
  }

  ws.on('message', function incoming(message) {
    console.log('Wiadomość:', message);
    if (ws.opponent && ws.opponent.readyState === WebSocket.OPEN) {
      ws.opponent.send(message);
    }
  });

  ws.on('close', () => {
    console.log('Gracz rozłączony');
    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
    if (ws.opponent) {
      ws.opponent.close();
    }
  });
});
