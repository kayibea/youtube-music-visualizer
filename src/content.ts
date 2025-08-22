const player = document.getElementById("player") as HTMLElement;
const video = player.querySelector("video")!;

const canvas = document.createElement("canvas");
const canvasCtx = canvas.getContext("2d")!;

player.appendChild(canvas);

const resizeObserver = new ResizeObserver(resizeObserverCallback);
resizeObserver.observe(player);

const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(video);
const analyzer = audioContext.createAnalyser();
analyzer.fftSize = 2 ** 11;
source.connect(analyzer);
analyzer.connect(audioContext.destination);

const uint8Times = new Uint8Array(analyzer.frequencyBinCount);

// const fpsInterval = 1000 / 60;
let lastTime = 0;
const fpsInterval = 1000 / 30;

requestAnimationFrame(animate);
function animate(timestamp: number) {
  if (!(timestamp - lastTime >= fpsInterval))
    return requestAnimationFrame(animate);

  lastTime = timestamp;

  if (document.hidden || video.paused || video.muted)
    return requestAnimationFrame(animate);

  requestAnimationFrame(animate);

  analyzer.getByteTimeDomainData(uint8Times);
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  canvasCtx.shadowBlur = 18;
  canvasCtx.shadowColor = "#00ff80";

  drawScope(uint8Times, -canvas.height * 0.25, "#3cff96");
  drawScope(uint8Times, canvas.height * 0.25, "#3cffea");
}

function drawScope(uint8Times: Uint8Array, offsetY: number, color: string) {
  const slice = canvas.width / uint8Times.length;
  canvasCtx.beginPath();

  const scaleY = canvas.height * 0.4;
  const centerY = canvas.height / 2 + offsetY;

  for (let i = 0; i < uint8Times.length; i++) {
    const x = i * slice;
    const v = (uint8Times[i] - 128) / 128;
    const y = centerY + v * scaleY;
    if (i === 0) canvasCtx.moveTo(x, y);
    else canvasCtx.lineTo(x, y);
  }

  canvasCtx.strokeStyle = color;
  canvasCtx.stroke();
}

function resizeObserverCallback(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    if (entry.target !== player) continue;
    canvas.width = entry.target.clientWidth;
    canvas.height = entry.target.clientHeight;
    break;
  }
}
