console.log("Content script loaded!");

const player = document.getElementById("player") as HTMLElement;
const video = player.querySelector("video")!;
const img = document.getElementById("img") as HTMLImageElement;
img.crossOrigin = "anonymous";
console.log(img);

const canvas = document.createElement("canvas");
const canvasCtx = canvas.getContext("2d")!;

player.appendChild(canvas);

const mutationObserver = new MutationObserver(mutationObserverCallback);
mutationObserver.observe(img, { attributes: true });

const resizeObserver = new ResizeObserver(resizeObserverCallback);
resizeObserver.observe(player);

const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(video);

const analyzer = audioContext.createAnalyser();
analyzer.fftSize = 2 ** 8;

source.connect(analyzer);
analyzer.connect(audioContext.destination);

const gravityRate = 3 / 10;
const uint8Freq = new Uint8Array(analyzer.frequencyBinCount);
const f32FreqCapsY = new Float32Array(analyzer.frequencyBinCount);

let currentColor = extractColorsFromImage(img) || [200, 50, 150];

let lastTime = 0;
requestAnimationFrame(animate);
function animate(timestamp: number) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  requestAnimationFrame(animate);

  analyzer.getByteFrequencyData(uint8Freq);
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // const barWidth = canvas.width / uint8Freq.length;
  const barWidth = Math.ceil(canvas.width / uint8Freq.length);

  for (let i = 0; i < uint8Freq.length; i++) {
    const barHeight = (uint8Freq[i] / 255) * canvas.height;
    const barTopY = canvas.height - barHeight;
    const barX = Math.floor(i * barWidth);

    const [r, g, b] = currentColor;

    const gradient = canvasCtx.createLinearGradient(
      0,
      barTopY,
      0,
      canvas.height
    );
    gradient.addColorStop(
      0,
      `rgb(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(
        b + 60,
        255
      )})`
    );
    gradient.addColorStop(1, `rgb(${r}, ${g}, ${b})`);

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(barX, barTopY, barWidth, barHeight);

    if (!f32FreqCapsY[i] || f32FreqCapsY[i] > barTopY) {
      f32FreqCapsY[i] = barTopY;
    } else {
      f32FreqCapsY[i] += gravityRate * deltaTime;
      // if (f32FreqCapsY[i] > barTopY) f32FreqCapsY[i] = barTopY;
    }

    canvasCtx.fillStyle = `rgb(${Math.min(r + 100, 255)}, ${Math.min(
      g + 100,
      255
    )}, ${Math.min(b + 100, 255)})`;
    canvasCtx.fillRect(barX, f32FreqCapsY[i], barWidth, 4);
  }
  canvasCtx.lineTo(canvas.width, canvas.height);
  canvasCtx.closePath();
  canvasCtx.fill();
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

function extractColorsFromImage(img: HTMLImageElement) {
  const offcanvas = new OffscreenCanvas(img.width, img.height);
  const ctx = offcanvas.getContext("2d")!;

  offcanvas.width = img.naturalWidth;
  offcanvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, offcanvas.width, offcanvas.height).data;
  let r = 0,
    g = 0,
    b = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const count = data.length / 4;
  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);

  return [r, g, b];
}

function mutationObserverCallback(mutations: MutationRecord[]) {
  for (const mutation of mutations) {
    if (mutation.type === "attributes" && mutation.attributeName === "src") {
      const newImg = new Image();
      newImg.crossOrigin = "anonymous";
      newImg.src = img.src;
      newImg.onload = () => (currentColor = extractColorsFromImage(newImg));
    }
  }
}
