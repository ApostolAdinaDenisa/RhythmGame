const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


const scoreDisplay = document.getElementById("score");
const comboDisplay = document.getElementById("combo");


let score = 0;
let combo = 0;
let isPlaying = false;
let notes = [];
let lastTime = 0;
let spawnInterval = 1000; // ms
let lastSpawn = 0;


const lanes = [
  { x: 200, color: "#FBDB93" },
  { x: 400, color: "#8D5F8C" },
  { x: 600, color: "#FF69B4" }
];
const hitY = 350;
const noteSpeed = 250; 


function drawLanes() {
  ctx.lineWidth = 2;
  lanes.forEach((lane) => {
    ctx.strokeStyle = lane.color;
    ctx.beginPath();
    ctx.moveTo(lane.x, 0);
    ctx.lineTo(lane.x, canvas.height);
    ctx.stroke();
  });

  // Draw hit line
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(0, hitY);
  ctx.lineTo(canvas.width, hitY);
  ctx.stroke();
}

function spawnNote() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  notes.push({
    x: lane.x,
    y: -20,
    color: lane.color,
    hit: false
  });
}

function updateNotes(delta) {
  notes.forEach((note) => (note.y += noteSpeed * delta));
  notes = notes.filter((note) => note.y < canvas.height + 20);
}

function drawNotes() {
  notes.forEach((note) => {
    ctx.beginPath();
    ctx.arc(note.x, note.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = note.color;
    ctx.fill();
    ctx.closePath();
  });
}


function handleTap(laneIndex) {
  if (!isPlaying) return;

  const laneX = lanes[laneIndex].x;
  const targetNote = notes.find(
    (n) => !n.hit && n.x === laneX && Math.abs(n.y - hitY) < 40
  );

  if (targetNote) {
    targetNote.hit = true;
    score += 100;
    combo++;
    notes = notes.filter((n) => !n.hit);
  } else {
    combo = 0; // Miss
  }

  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;
}

function gameLoop(timestamp) {
  if (!isPlaying) return;

  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLanes();

  if (timestamp - lastSpawn > spawnInterval) {
    spawnNote();
    lastSpawn = timestamp;
  }

  updateNotes(delta);
  drawNotes();

  requestAnimationFrame(gameLoop);
}

document.querySelectorAll(".tap-zones button").forEach((btn, index) => {
  btn.addEventListener("click", () => handleTap(index));
});

const [startBtn, pauseBtn, stopBtn] = document.querySelectorAll(".controls button");

startBtn.addEventListener("click", () => {
  if (!isPlaying) {
    isPlaying = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
});

pauseBtn.addEventListener("click", () => {
  isPlaying = false;
});

stopBtn.addEventListener("click", () => {
  isPlaying = false;
  score = 0;
  combo = 0;
  notes = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLanes();
  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;
});

drawLanes();
