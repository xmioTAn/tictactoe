const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const resetBtn = document.getElementById('resetBtn');
const playersElement = document.getElementById('players');

let board = Array(9).fill('');
let symbol = null;
let currentPlayer = null;
let gameActive = false;

const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {
  playersElement.textContent = 'Połączono z serwerem, czekaj na przeciwnika...';
  messageElement.textContent = '';
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'message') {
    messageElement.textContent = data.text;
  }

  if (data.type === 'start') {
    symbol = data.symbol;
    gameActive = true;
    currentPlayer = 'X';
    board.fill('');
    updateBoardUI();
    messageElement.textContent = `Gra rozpoczęta! Jesteś: ${symbol}`;
    playersElement.textContent = `Ty: ${symbol} | Przeciwnik: ${symbol === 'X' ? 'O' : 'X'}`;
    resetBtn.disabled = true;
  }

  if (data.type === 'update') {
    board = data.board;
    currentPlayer = data.currentPlayer;
    updateBoardUI();

    if (checkWin()) {
      if (symbol === currentPlayer) {
        messageElement.textContent = 'Przegrałeś! 😞';
      } else {
        messageElement.textContent = 'Wygrałeś! 🎉';
      }
      gameActive = false;
      resetBtn.disabled = false;
      return;
    }

    if (board.every(cell => cell !== '')) {
      messageElement.textContent = 'Remis! 🤝';
      gameActive = false;
      resetBtn.disabled = false;
      return;
    }

    if (currentPlayer === symbol) {
      messageElement.textContent = 'Twoja kolej! 🔥';
    } else {
      messageElement.textContent = 'Czekaj na ruch przeciwnika... ⏳';
    }
  }
});

socket.addEventListener('close', () => {
  messageElement.textContent = 'Rozłączono z serwerem 😢';
  gameActive = false;
  resetBtn.disabled = true;
  playersElement.textContent = 'Brak połączenia';
});

function createBoard() {
  boardElement.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    boardElement.appendChild(cell);
  }
}

function handleCellClick(e) {
  const index = e.target.dataset.index;
  if (!gameActive) return;
  if (board[index] !== '') return;
  if (currentPlayer !== symbol) return;

  socket.send(JSON.stringify({ type: 'move', index: parseInt(index), symbol }));
}

function updateBoardUI() {
  document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.textContent = board[i];
    if (board[i] !== '') {
      cell.classList.add('filled');
      cell.classList.add('disabled');
    } else {
      cell.classList.remove('filled');
      cell.classList.remove('disabled');
    }
  });
}

function checkWin() {
  const winConditions = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  return winConditions.some(([a,b,c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  );
}

resetBtn.addEventListener('click', () => {
  if (!gameActive) {
    board.fill('');
    updateBoardUI();
    messageElement.textContent = 'Czekaj na przeciwnika...';
    resetBtn.disabled = true;
    // W obecnym serwerze reset nie jest zaimplementowany,
    // ale możesz go rozwinąć w backendzie, by rozpocząć nową grę.
  }
});

createBoard();
