let video;
let facemesh;
let faces = [];

let statusText = "正在載入模型，請稍候...";
let modelStarted = false;

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

function preload() {
  facemesh = ml5.faceMesh({
    maxFaces: 1,
    refineLandmarks: true,
    flipped: false
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);

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

  statusText = "正在開啟攝影機...";
}

function draw() {
  background("#FFFF93");

  if (!video || !video.elt || video.elt.videoWidth === 0 || video.elt.videoHeight === 0) {
    showStatus("等待攝影機開啟...");
    return;
  }

  let realVideoW = video.elt.videoWidth;
  let realVideoH = video.elt.videoHeight;

  // 讓 p5 的 video 尺寸跟真實攝影機尺寸同步
  if (video.width !== realVideoW || video.height !== realVideoH) {
    video.size(realVideoW, realVideoH);
  }

  // 只啟動一次 FaceMesh
  if (!modelStarted) {
    facemesh.detectStart(video, gotFaces);
    modelStarted = true;
    statusText = "攝影機已啟動，正在偵測臉部...";
  }

  // 顯示大小：全螢幕寬高的 50%
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

  // =========================
  // 顯示鏡像攝影機影像
  // =========================
  push();
  translate(centerX, centerY);
  scale(-1, 1);
  imageMode(CENTER);
  image(video, 0, 0, drawW, drawH);
  pop();

  // =========================
  // 畫 FaceMesh 線條
  // =========================
  if (faces.length > 0) {
    statusText = "已偵測到臉部";

    let face = faces[0];
    let keypoints = face.keypoints;

    push();
    translate(centerX, centerY);
    scale(-1, 1);

    stroke(255, 0, 0);
    strokeWeight(1);
    noFill();

    // 臉部最外層輪廓
    drawClosedLoop(faceOutline, keypoints, realVideoW, realVideoH, drawW, drawH);

    // 右眼
    drawClosedLoop(rightEyeOuter, keypoints, realVideoW, realVideoH, drawW, drawH);
    drawClosedLoop(rightEyeInner, keypoints, realVideoW, realVideoH, drawW, drawH);

    // 左眼
    drawClosedLoop(leftEyeOuter, keypoints, realVideoW, realVideoH, drawW, drawH);
    drawClosedLoop(leftEyeInner, keypoints, realVideoW, realVideoH, drawW, drawH);

    // 嘴巴
    drawClosedLoop(mouthOuter, keypoints, realVideoW, realVideoH, drawW, drawH);
    drawClosedLoop(mouthInner, keypoints, realVideoW, realVideoH, drawW, drawH);

    pop();
  } else {
    statusText = "請將臉部靠近攝影機";
  }

  showStatus(statusText);
}

// 用 line() 畫出封閉輪廓
function drawClosedLoop(indices, keypoints, videoW, videoH, drawW, drawH) {
  for (let i = 0; i < indices.length; i++) {
    let index1 = indices[i];
    let index2 = indices[(i + 1) % indices.length];

    let p1 = keypoints[index1];
    let p2 = keypoints[index2];

    if (p1 && p2) {
      let x1 = map(p1.x, 0, videoW, -drawW / 2, drawW / 2);
      let y1 = map(p1.y, 0, videoH, -drawH / 2, drawH / 2);

      let x2 = map(p2.x, 0, videoW, -drawW / 2, drawW / 2);
      let y2 = map(p2.y, 0, videoH, -drawH / 2, drawH / 2);

      line(x1, y1, x2, y2);
    }
  }
}

function showStatus(msg) {
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  text(msg, width / 2, height * 0.85);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
