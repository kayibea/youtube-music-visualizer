console.log("Content script loaded!");

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

const uint8Time = new Uint8Array(analyzer.frequencyBinCount);

requestAnimationFrame(animate);
function animate() {
  if (document.hidden) return requestAnimationFrame(animate);

  requestAnimationFrame(animate);

  analyzer.getByteTimeDomainData(uint8Time);
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  canvasCtx.shadowBlur = 18;
  canvasCtx.shadowColor = "#00ff80";

  drawScope(uint8Time, -canvas.height * 0.25, "#3cff96");
  drawScope(uint8Time, canvas.height * 0.25, "#3cffea");
}

function drawScope(uint8Time: Uint8Array, offsetY: number, color: string) {
  const slice = canvas.width / uint8Time.length;
  canvasCtx.beginPath();

  const scaleY = canvas.height * 0.4;
  const centerY = canvas.height / 2 + offsetY;

  for (let i = 0; i < uint8Time.length; i++) {
    const x = i * slice;
    const v = (uint8Time[i] - 128) / 128;
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
    const target = entry.target as HTMLDivElement;
    canvas.width = target.clientWidth;
    canvas.height = target.clientHeight;
    break;
  }
}
