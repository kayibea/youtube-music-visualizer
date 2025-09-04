const player = document.getElementById("player") as HTMLElement;
const video = player.querySelector("video")!;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
player.appendChild(canvas);

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.target !== player) continue;
    const { clientWidth, clientHeight } = entry.target;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
  }
});
resizeObserver.observe(player);

const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(video);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

source.connect(analyser);
analyser.connect(audioContext.destination);

const data = new Uint8Array(analyser.frequencyBinCount);

let lastTime = 0;
const fpsInterval = 1000 / 30;

requestAnimationFrame(animate);
function animate(timestamp: number) {
  requestAnimationFrame(animate);

  if (timestamp - lastTime < fpsInterval) return;
  lastTime = timestamp;

  if (document.hidden || video.paused || video.muted) return;

  analyser.getByteTimeDomainData(data);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#00ff80";

  drawScope(data, -canvas.height * 0.25, "#3cff96");
  drawScope(data, canvas.height * 0.25, "#3cffea");
}

function drawScope(data: Uint8Array, offsetY: number, color: string) {
  const slice = canvas.width / data.length;
  const scaleY = canvas.height * 0.4;
  const centerY = canvas.height / 2 + offsetY;

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = i * slice;
    const v = (data[i] - 128) / 128;
    const y = centerY + v * scaleY;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.stroke();
}
