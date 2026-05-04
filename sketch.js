let video;
let facemesh;
let faces = [];
let statusText = "正在載入模型，請稍候...";

// 右眼外圈：247 獨立畫成一圈
const rightEyeOuter = [
  247, 30, 29, 27, 28, 56, 190, 243,
  112, 26, 22, 23, 24, 110, 25, 130
];

// 右眼內圈：246 獨立畫成一圈
const rightEyeInner = [
  246, 161, 160, 159, 158, 157, 173, 133,
  155, 154, 153, 145, 144, 163, 7, 33
];

// 嘴巴外圈
const mouthOuter = [
  409, 270, 269, 267, 0, 37, 39, 40, 185, 61,
  146, 91, 181, 84, 17, 314, 405, 321, 375, 291
];

// 嘴巴內圈
const mouthInner = [
  76, 77, 90, 180, 85, 16, 315, 404, 320, 307,
  306, 408, 304, 303, 302, 11, 72, 73, 74, 184
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

  video = createCapture(
    {
      video: {
        facingMode: "user"
      },
      audio: false
    },
    videoReady
  );

  video.size(640, 480);
  video.hide();

  // 手機瀏覽器重要設定
  video.elt.setAttribute("playsinline", "");
  video.elt.setAttribute("autoplay", "");
  video.elt.setAttribute("muted", "");
}

function videoReady() {
  statusText = "攝影機已啟動，正在偵測臉部...";
  facemesh.detectStart(video, gotFaces);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background("#FFFF93");

  if (!video || !video.elt || video.elt.videoWidth === 0 || video.elt.videoHeight === 0) {
    showStatus("等待攝影機開啟...");
    return;
  }

  // 使用真實攝影機尺寸，避免手機直式比例異常
  let realVideoW = video.elt.videoWidth;
  let realVideoH = video.elt.videoHeight;

  // 影像最大顯示尺寸：全螢幕寬高的 50%
  let maxW = width * 0.5;
  let maxH = height * 0.5;

  // 等比例縮放，不變形
  let videoRatio = realVideoW / realVideoH;
  let drawW, drawH;

  if (maxW / maxH > videoRatio) {
    drawH = maxH;
    drawW = drawH * videoRatio;
  } else {
    drawW = maxW;
    drawH = drawW / videoRatio;
  }

  let offsetX = (width - drawW) / 2;
  let offsetY = (height - drawH) / 2;

  // 顯示鏡像攝影機畫面
  push();
  translate(offsetX + drawW / 2, offsetY + drawH / 2);
  scale(-1, 1);
  imageMode(CENTER);
  image(video, 0, 0, drawW, drawH);
  pop();

  // 畫 FaceMesh 線條
  if (faces.length > 0) {
    statusText = "已偵測到臉部";

    let face = faces[0];
    let keypoints = face.keypoints;

    push();

    // 與攝影機畫面同位置、同大小、同鏡像
    translate(offsetX + drawW / 2, offsetY + drawH / 2);
    scale(-1, 1);

    noFill();

    // 右眼外圈
    stroke(255, 0, 0);
    strokeWeight(1);
    drawClosedLoop(rightEyeOuter, keypoints, realVideoW, realVideoH, drawW, drawH);

    // 右眼內圈
    stroke(255, 0, 0);
    strokeWeight(1);
    drawClosedLoop(rightEyeInner, keypoints, realVideoW, realVideoH, drawW, drawH);

    // 嘴巴外圈
    stroke(255, 0, 0);
    strokeWeight(15);
    drawClosedLoop(mouthOuter, keypoints, realVideoW, realVideoH, drawW, drawH);

    // 嘴巴內圈
    stroke(255, 0, 0);
    strokeWeight(1);
    drawClosedLoop(mouthInner, keypoints, realVideoW, realVideoH, drawW, drawH);

    pop();
  } else {
    statusText = "請將臉部靠近攝影機";
  }

  showStatus(statusText);
}

// 使用 line() 畫封閉圈
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
