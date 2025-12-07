// ====== CANVAS & GAME STATE ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const comboDisplay = document.getElementById("combo");

// Game state
let score = 0;
let combo = 0;
let isPlaying = false;
let notes = [];
let lastTime = 0;
let spawnInterval = 1000; // ms (will be overridden by difficulty)
let lastSpawn = 0;

// Lanes and note behaviour
const lanes = [
  { x: 200, color: "#FBDB93" },
  { x: 400, color: "#8D5F8C" },
  { x: 600, color: "#FF69B4" }
];

const hitY = 350;
let noteSpeed = 250; // px / second (will be overridden by difficulty)

// ====== AUDIO / DIFFICULTY CONFIGURATION ======

// Map your songs & difficulty settings here
const difficultyConfig = {
  easy: {
    label: "Easy",
    songPath: "songs/Song1.mp3", // Song1 = easy
    spawnInterval: 900,
    noteSpeed: 220
  },
  medium: {
    label: "Medium",
    songPath: "songs/Song2.mp3", // Song2 = medium
    spawnInterval: 650,
    noteSpeed: 260
  },
  hard: {
    label: "Hard",
    songPath: "songs/Song3.mp3", // Song3 = hard
    spawnInterval: 400,
    noteSpeed: 320
  }
};

let currentDifficulty = "easy";

class AudioManager {
  constructor() {
    this.audio = null;
    this.isReady = false;
  }

  loadSong(src) {
    // Stop any current audio
    if (this.audio) {
      this.audio.pause();
    }

    this.isReady = false;
    const audio = new Audio(src);
    audio.preload = "auto";

    audio.addEventListener(
      "canplaythrough",
      () => {
        this.isReady = true;
        console.log("Audio loaded:", src);
      },
      { once: true }
    );

    this.audio = audio;
  }

  play() {
    if (this.audio && this.isReady) {
      this.audio.play();
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}

const audioManager = new AudioManager();

// ====== DIFFICULTY SELECTION LOGIC ======
function setDifficulty(diffKey) {
  const config = difficultyConfig[diffKey];
  if (!config) return;

  currentDifficulty = diffKey;

  // Update game speed / spawn rate
  spawnInterval = config.spawnInterval;
  noteSpeed = config.noteSpeed;

  // Load the corresponding song
  audioManager.loadSong(config.songPath);

  // Visual feedback on vinyl
  document.querySelectorAll(".vinyl").forEach((v) => v.classList.remove("active"));
  const activeVinyl = document.querySelector(`.vinyl.${diffKey}`);
  if (activeVinyl) {
    activeVinyl.classList.add("active");
  }

  // Reset game state when changing difficulty
  resetGameVisualState();
  console.log(`Difficulty set to ${config.label}`);
}

function resetGameVisualState() {
  isPlaying = false;
  score = 0;
  combo = 0;
  notes = [];
  lastSpawn = 0;
  lastTime = 0;

  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLanes();
}

// ====== DRAWING & GAME MECHANICS ======
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
  notes.forEach((note) => {
    note.y += noteSpeed * delta;
  });

  // Remove notes that passed the screen bottom
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

// ====== MAIN GAME LOOP ======
function gameLoop(timestamp) {
  if (!isPlaying) return;

  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLanes();

  // Time-based spawn (linked to difficulty)
  if (timestamp - lastSpawn > spawnInterval) {
    spawnNote();
    lastSpawn = timestamp;
  }

  updateNotes(delta);
  drawNotes();

  requestAnimationFrame(gameLoop);
}

// ====== INPUT BINDINGS ======
// Tap buttons
document.querySelectorAll(".tap-zones button").forEach((btn, index) => {
  btn.addEventListener("click", () => handleTap(index));
});

// Controls
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.addEventListener("click", () => {
  if (!isPlaying) {
    isPlaying = true;
    lastTime = performance.now();
    // Start music in sync with gameplay
    audioManager.play();
    requestAnimationFrame(gameLoop);
  }
});

pauseBtn.addEventListener("click", () => {
  isPlaying = false;
  audioManager.pause();
});

stopBtn.addEventListener("click", () => {
  isPlaying = false;
  audioManager.stop();
  resetGameVisualState();
});

// Difficulty vinyl buttons
document.querySelectorAll(".vinyl").forEach((vinyl) => {
  vinyl.addEventListener("click", () => {
    const diffKey = vinyl.dataset.difficulty;
    setDifficulty(diffKey);
  });
});

// ====== INITIALIZATION ======
drawLanes();
setDifficulty("easy"); // default difficulty on load