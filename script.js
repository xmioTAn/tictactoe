const socket = new WebSocket('ws://shortline.proxy.rlwy.net:45209');


const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
let cells = Array(9).fill('');
let yourTurn = false;
let symbol = '';

function drawBoard() {
  boardEl.innerHTML = '';
  cells.forEach((cell, idx) => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.textContent = cell;
    div.addEventListener('click', () => {
      if (yourTurn && cells[idx] === '') {
        cells[idx] = symbol;
        update();
        socket.send(JSON.stringify({ type: 'move', index: idx, symbol }));
        yourTurn = false;
        statusEl.textContent = 'Czekaj na ruch przeciwnika...';
      }
    });
    boardEl.appendChild(div);
  });
}

function update() {
  drawBoard();
}

socket.addEventListener('open', () => {
  statusEl.textContent = 'Połączono z serwerem. Czekam na drugiego gracza...';
});

socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);

  if (data.type === 'assign') {
    symbol = data.symbol;
    yourTurn = (symbol === 'X');
    statusEl.textContent = yourTurn ? 'Twój ruch!' : 'Czekaj na ruch przeciwnika...';
    update();
  }

  if (data.type === 'move') {
    cells[data.index] = data.symbol;
    yourTurn = (data.symbol !== symbol);
    statusEl.textContent = yourTurn ? 'Twój ruch!' : 'Czekaj na ruch przeciwnika...';
    update();
  }
});

drawBoard();
