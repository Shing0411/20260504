let video;
let facemesh;
let faces = [];

let statusText = "正在載入模型，請稍候...";
let videoReady = false;
let modelReady = false;
let detectionStarted = false;

let stars = [];

// =========================
// 右眼
// =========================
const rightEyeOuter = [
  247, 30, 29, 27, 28, 56, 190, 243,
  112, 26, 22, 23, 24, 110, 25, 130
];

const rightEyeInner = [
  246, 161, 160, 159, 158, 157, 173, 133,
  155, 154, 153, 145, 144, 163, 7, 33
];

// =========================
// 左眼
// =========================
const leftEyeOuter = [
  467, 260, 259, 257, 258, 286, 414, 463,
  341, 256, 252, 253, 254, 339, 255, 359
];

const leftEyeInner = [
  466, 388, 387, 386, 385, 384, 398, 362,
  382, 381, 380, 374, 373, 390, 249, 263
];

// =========================
// 嘴巴
// =========================
const mouthOuter = [
  409, 270, 269, 267, 0, 37, 39, 40, 185, 61,
  146, 91, 181, 84, 17, 314, 405, 321, 375, 291
];

const mouthInner = [
  76, 77, 90, 180, 85, 16, 315, 404, 320, 307,
  306, 408, 304, 303, 302, 11, 72, 73, 74, 184
];

// =========================
// 臉部最外層輪廓
// =========================
const faceOutline = [
  10, 338, 297, 332, 284, 251, 389, 356,
  454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  initStars();

  // 建立攝影機
  video = createCapture({
    video: {
      facingMode: "user"
    },
    audio: false
  });

  video.hide();

  // 手機瀏覽器重要設定
  video.elt.setAttribute("playsinline", "");
  video.elt.setAttribute("autoplay", "");
  video.elt.setAttribute("muted", "");

  // 攝影機 metadata 準備好
  video.elt.onloadedmetadata = () => {
    videoReady = true;
    if (modelReady) {
      statusText = "攝影機已啟動，請將臉對準鏡頭";
    } else {
      statusText = "攝影機已啟動，正在載入模型...";
    }
    startDetectionIfReady();
  };

  // 載入 FaceMesh
  facemesh = ml5.faceMesh(
    {
      maxFaces: 1,
      refineLandmarks: true,
      flipped: false
    },
    () => {
      modelReady = true;
      if (videoReady) {
        statusText = "模型已載入，請將臉對準鏡頭";
      } else {
        statusText = "模型已載入，等待攝影機...";
      }
      startDetectionIfReady();
    }
  );
}

function startDetectionIfReady() {
  if (videoReady && modelReady && !detectionStarted) {
    facemesh.detectStart(video, gotFaces);
    detectionStarted = true;
  }
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0);
  drawStars();

  // 攝影機尚未準備完成
  if (!video || !video.elt || video.elt.videoWidth === 0 || video.elt.videoHeight === 0) {
    showStatus(statusText);
    return;
  }

  let realVideoW = video.elt.videoWidth;
  let realVideoH = video.elt.videoHeight;

  // 同步 video 尺寸，避免手機直式飄移
  if (video.width !== realVideoW || video.height !== realVideoH) {
    video.size(realVideoW, realVideoH);
  }

  // 影像顯示尺寸：畫面寬高的 50% 內
  let maxW = width * 0.5;
  let maxH = height * 0.5;

  let videoRatio = realVideoW / realVideoH;
  let drawW, drawH;

  if (maxW / maxH > videoRatio) {
    drawH = maxH;
    drawW = drawH * videoRatio;
  } else {
    drawW = maxW;
    drawH = drawW / videoRatio;
  }

  let centerX = width / 2;
  let centerY = height / 2;

  // 還沒偵測到臉：先正常顯示攝影機，避免誤以為壞掉
  if (faces.length === 0) {
    drawMirroredVideo(centerX, centerY, drawW, drawH);
    statusText = detectionStarted ? "請將整張臉放進鏡頭內" : statusText;
    showStatus(statusText);
    return;
  }

  // 偵測到臉
  let face = faces[0];
  let keypoints = face.keypoints;

  // =========================
  // 先畫黑底星空，再只在臉部輪廓內顯示影片
  // =========================
  drawClippedFaceVideo(
    keypoints,
    faceOutline,
    realVideoW,
    realVideoH,
    drawW,
    drawH,
    centerX,
    centerY
  );

  // =========================
  // 畫臉部外層霓虹光輪廓
  // =========================
  drawNeonLoop(
    faceOutline,
    keypoints,
    realVideoW,
    realVideoH,
    drawW,
    drawH,
    centerX,
    centerY
  );

  // =========================
  // 畫五官線條
  // =========================
  stroke(255, 0, 0);
  strokeWeight(1);
  noFill();

  // 右眼
  drawClosedLoop(rightEyeOuter, keypoints, realVideoW, realVideoH, drawW, drawH, centerX, centerY);
  drawClosedLoop(rightEyeInner, keypoints, realVideoW, realVideoH, drawW, drawH, centerX, centerY);

  // 左眼
  drawClosedLoop(leftEyeOuter, keypoints, realVideoW, realVideoH, drawW, drawH, centerX, centerY);
  drawClosedLoop(leftEyeInner, keypoints, realVideoW, realVideoH, drawW, drawH, centerX, centerY);

  // 嘴巴
  drawClosedLoop(mouthOuter, keypoints, realVideoW, realVideoH, drawW, drawH, centerX, centerY);
  drawClosedLoop(mouthInner, keypoints, realVideoW, realVideoH, drawW, drawH, centerX, centerY);

  statusText = "已偵測到臉部";
  showStatus(statusText);
}

// =========================
// 只在臉部輪廓內顯示攝影機
// =========================
function drawClippedFaceVideo(keypoints, outlineIndices, videoW, videoH, drawW, drawH, centerX, centerY) {
  let ctx = drawingContext;
  ctx.save();
  ctx.beginPath();

  for (let i = 0; i < outlineIndices.length; i++) {
    let idx = outlineIndices[i];
    let p = toScreenPoint(keypoints[idx], videoW, videoH, drawW, drawH, centerX, centerY);

    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }

  ctx.closePath();
  ctx.clip();

  // 在裁切範圍內畫鏡像影片
  drawMirroredVideo(centerX, centerY, drawW, drawH);

  ctx.restore();
}

// =========================
// 畫鏡像影片
// =========================
function drawMirroredVideo(centerX, centerY, drawW, drawH) {
  imageMode(CORNER);
  image(video, centerX + drawW / 2, centerY - drawH / 2, -drawW, drawH);
}

// =========================
// 霓虹發光輪廓
// =========================
function drawNeonLoop(indices, keypoints, videoW, videoH, drawW, drawH, centerX, centerY) {
  let ctx = drawingContext;

  // 外層大光暈
  ctx.save();
  ctx.shadowBlur = 28;
  ctx.shadowColor = "rgba(255, 0, 0, 0.95)";
  stroke(255, 70, 70, 120);
  strokeWeight(10);
  noFill();
  drawClosedLoop(indices, keypoints, videoW, videoH, drawW, drawH, centerX, centerY);
  ctx.restore();

  // 中層光暈
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "rgba(255, 0, 0, 0.9)";
  stroke(255, 40, 40, 180);
  strokeWeight(5);
  noFill();
  drawClosedLoop(indices, keypoints, videoW, videoH, drawW, drawH, centerX, centerY);
  ctx.restore();

  // 核心亮線
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(255, 80, 80, 1)";
  stroke(255, 0, 0);
  strokeWeight(2);
  noFill();
  drawClosedLoop(indices, keypoints, videoW, videoH, drawW, drawH, centerX, centerY);
  ctx.restore();
}

// =========================
// 用 line() 畫封閉輪廓
// =========================
function drawClosedLoop(indices, keypoints, videoW, videoH, drawW, drawH, centerX, centerY) {
  for (let i = 0; i < indices.length; i++) {
    let idx1 = indices[i];
    let idx2 = indices[(i + 1) % indices.length];

    let p1 = toScreenPoint(keypoints[idx1], videoW, videoH, drawW, drawH, centerX, centerY);
    let p2 = toScreenPoint(keypoints[idx2], videoW, videoH, drawW, drawH, centerX, centerY);

    line(p1.x, p1.y, p2.x, p2.y);
  }
}

// =========================
// 將 facemesh 點位轉成畫面座標（含鏡像）
// =========================
function toScreenPoint(pt, videoW, videoH, drawW, drawH, centerX, centerY) {
  let localX = map(pt.x, 0, videoW, drawW / 2, -drawW / 2); // 水平鏡像
  let localY = map(pt.y, 0, videoH, -drawH / 2, drawH / 2);

  return {
    x: centerX + localX,
    y: centerY + localY
  };
}

// =========================
// 星空背景
// =========================
function initStars() {
  stars = [];
  let count = floor((windowWidth * windowHeight) / 9000);

  for (let i = 0; i < count; i++) {
    stars.push({
      x: random(windowWidth),
      y: random(windowHeight),
      size: random(1, 3.5),
      alpha: random(120, 255),
      phase: random(TWO_PI),
      kind: random() < 0.2 ? "cross" : "dot"
    });
  }
}

function drawStars() {
  noStroke();

  for (let s of stars) {
    let twinkle = 0.65 + 0.35 * sin(frameCount * 0.03 + s.phase);
    let a = s.alpha * twinkle;

    if (s.kind === "dot") {
      fill(255, a);
      circle(s.x, s.y, s.size);
    } else {
      stroke(255, a);
      strokeWeight(1);
      line(s.x - s.size, s.y, s.x + s.size, s.y);
      line(s.x, s.y - s.size, s.x, s.y + s.size);
      noStroke();
    }
  }
}

// =========================
// 顯示狀態文字
// =========================
function showStatus(msg) {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  text(msg, width / 2, height * 0.9);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initStars();
}
