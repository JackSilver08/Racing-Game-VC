document.addEventListener("DOMContentLoaded", () => {

  // ================== GAME CANVAS ==================
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ================== CONSTANTS ==================
  const CAR_SMOOTH = 0.12;
  const MAX_STEER_ANGLE = Math.PI / 6; // ±30°
  const STEER_POWER = 0.35;

  // ================== LOAD IMAGES ==================
  const carImg = new Image();
  carImg.src = "assets/car.png";

  const roadImg = new Image();
  roadImg.src = "assets/road.png";

  const rockImg = new Image();
  rockImg.src = "assets/rock.png";

  // ================== GAME STATE ==================
  let gameRunning = false;
  let distance = 0;
  let speed = 6;

  // ================== ROAD ==================
  let roadY = 0;

  // ================== CAR ==================
  const car = {
    x: 0,
    y: 0,
    w: 140,
    h: 220
  };

  function resetCar() {
    car.x = canvas.width / 2 - car.w / 2;
    car.y = canvas.height - car.h - 40;
  }
  resetCar();

  let targetX = car.x;

  // ================== OBSTACLES ==================
  let obstacles = [];

  function spawnObstacle() {
    obstacles.push({
      x: Math.random() * (canvas.width - 110),
      y: -120,
      size: 110
    });
  }

  setInterval(() => {
    if (gameRunning) spawnObstacle();
  }, 1200);

  // ================== DRAW ==================
  function drawRoad() {
    roadY += speed;
    if (roadY >= canvas.height) roadY = 0;

    ctx.drawImage(roadImg, 0, roadY, canvas.width, canvas.height);
    ctx.drawImage(roadImg, 0, roadY - canvas.height, canvas.width, canvas.height);
  }

  function drawCar() {
    car.x += (targetX - car.x) * CAR_SMOOTH;
    ctx.drawImage(carImg, car.x, car.y, car.w, car.h);
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      o.y += speed;
      ctx.drawImage(rockImg, o.x, o.y, o.size, o.size);

      if (
        car.x < o.x + o.size &&
        car.x + car.w > o.x &&
        car.y < o.y + o.size &&
        car.y + car.h > o.y
      ) {
        gameOver();
      }
    });

    obstacles = obstacles.filter(o => o.y < canvas.height + 150);
  }

  // ================== GAME LOOP ==================
  function update() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRoad();
    drawObstacles();
    drawCar();

    distance += 0.02;
    document.getElementById("distance").innerText =
      distance.toFixed(1) + " km";

    requestAnimationFrame(update);
  }

  // ================== GAME CONTROL ==================
  function gameOver() {
    gameRunning = false;
    alert("GAME OVER\nDistance: " + distance.toFixed(1) + " km");
  }

  document.getElementById("startBtn").onclick = () => {
    obstacles = [];
    distance = 0;
    speed = 6;
    gameRunning = true;
    resetCar();
    update();
  };

  // ================== MEDIAPIPE HANDS (STEERING) ==================
  const video = document.getElementById("video");

  const hands = new Hands({
    locateFile: f =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(results => {
    if (!results.multiHandLandmarks?.length) return;

    const hand = results.multiHandLandmarks[0];
    const p1 = hand[5];   // gốc ngón trỏ
    const p2 = hand[17];  // gốc ngón út
    if (!p1 || !p2) return;

    // Góc vô lăng
    let angle = Math.atan2(
      p2.y - p1.y,
      p2.x - p1.x
    );

    // Đảo chiều cho giống vô lăng thật
    angle *= -1;

    // Clamp góc
    angle = Math.max(
      -MAX_STEER_ANGLE,
      Math.min(MAX_STEER_ANGLE, angle)
    );

    const steer = angle / MAX_STEER_ANGLE;

    // Điều khiển xe
    targetX =
      (canvas.width - car.w) / 2 +
      steer * (canvas.width * STEER_POWER);
  });

  // ================== CAMERA ==================
  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start();

});
