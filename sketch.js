let video;
let facemesh;
let faces = [];

// 右眼外圈（247 這組）
const rightEyeOuter = [
  247, 30, 29, 27, 28, 56, 190, 243,
  112, 26, 22, 23, 24, 110, 25, 130
];

// 右眼內圈（246 這組）
const rightEyeInner = [
  246, 161, 160, 159, 158, 157, 173, 133,
  155, 154, 153, 145, 144, 163, 7, 33
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

  // 建立攝影機
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 啟動 FaceMesh
  facemesh.detectStart(video, gotFaces);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  // 背景
  background("#FFFF93");

  // 攝影機顯示大小：全螢幕寬高的 50%
  let maxW = width * 0.5;
  let maxH = height * 0.5;

  let videoRatio = video.width / video.height;
  let drawW, drawH;

  if (maxW / maxH > videoRatio) {
    drawH = maxH;
    drawW = drawH * videoRatio;
  } else {
    drawW = maxW;
    drawH = drawW / videoRatio;
  }

  // 置中位置
  let offsetX = (width - drawW) / 2;
  let offsetY = (height - drawH) / 2;

  // 顯示鏡像攝影機畫面
  push();
  translate(offsetX + drawW / 2, offsetY + drawH / 2);
  scale(-1, 1);
  imageMode(CENTER);
  image(video, 0, 0, drawW, drawH);
  pop();

  // 若偵測到臉，畫右眼外圈與內圈
  if (faces.length > 0) {
    let face = faces[0];
    let keypoints = face.keypoints;

    push();
    translate(offsetX + drawW / 2, offsetY + drawH / 2);
    scale(-1, 1); // 與鏡像畫面同步

    stroke(255, 0, 0); // 紅色
    strokeWeight(1);   // 粗細 1
    noFill();

    // 畫右眼外圈
    drawClosedLoop(rightEyeOuter, keypoints, drawW, drawH);

    // 畫右眼內圈
    drawClosedLoop(rightEyeInner, keypoints, drawW, drawH);

    pop();
  }
}

// 畫封閉輪廓
function drawClosedLoop(indices, keypoints, drawW, drawH) {
  for (let i = 0; i < indices.length; i++) {
    let currentIndex = indices[i];
    let nextIndex = indices[(i + 1) % indices.length]; // 最後一點接回第一點

    let p1 = keypoints[currentIndex];
    let p2 = keypoints[nextIndex];

    if (p1 && p2) {
      let x1 = map(p1.x, 0, video.width, -drawW / 2, drawW / 2);
      let y1 = map(p1.y, 0, video.height, -drawH / 2, drawH / 2);

      let x2 = map(p2.x, 0, video.width, -drawW / 2, drawW / 2);
      let y2 = map(p2.y, 0, video.height, -drawH / 2, drawH / 2);

      line(x1, y1, x2, y2);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}