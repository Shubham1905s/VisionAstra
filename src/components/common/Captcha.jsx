import { useCallback, useEffect, useRef } from "react";
import Input from "./Input";
import { createCaptcha } from "../../utils/validators";

const CANVAS_WIDTH = 220;
const CANVAS_HEIGHT = 70;

const FONTS = ["serif", "sans-serif", "monospace", "Georgia", "Courier New"];
const DARK_COLORS = [
  "#1e3a5f", "#4a1942", "#2d4a22", "#8b0000", "#2f2f2f",
  "#003366", "#4b0082", "#333300", "#660033", "#1a1a2e",
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function drawCaptcha(canvas, text) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#f0f4f8");
  gradient.addColorStop(0.5, "#e8edf2");
  gradient.addColorStop(1, "#f5f0eb");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(randomBetween(0, CANVAS_WIDTH), randomBetween(0, CANVAS_HEIGHT));
    ctx.lineTo(randomBetween(0, CANVAS_WIDTH), randomBetween(0, CANVAS_HEIGHT));
    ctx.strokeStyle = `rgba(${Math.floor(randomBetween(80, 180))}, ${Math.floor(randomBetween(80, 180))}, ${Math.floor(randomBetween(80, 180))}, 0.4)`;
    ctx.lineWidth = randomBetween(1, 2);
    ctx.stroke();
  }

  for (let i = 0; i < 45; i++) {
    ctx.beginPath();
    ctx.arc(
      randomBetween(0, CANVAS_WIDTH),
      randomBetween(0, CANVAS_HEIGHT),
      randomBetween(1, 2),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(${Math.floor(randomBetween(60, 160))}, ${Math.floor(randomBetween(60, 160))}, ${Math.floor(randomBetween(60, 160))}, 0.5)`;
    ctx.fill();
  }

  const charWidth = (CANVAS_WIDTH - 40) / text.length;
  for (let i = 0; i < text.length; i++) {
    const fontSize = Math.floor(randomBetween(26, 34));
    const font = FONTS[Math.floor(Math.random() * FONTS.length)];
    const rotation = randomBetween(-0.35, 0.35);
    const color = DARK_COLORS[Math.floor(Math.random() * DARK_COLORS.length)];
    const x = 20 + i * charWidth + randomBetween(-2, 2);
    const y = CANVAS_HEIGHT / 2 + randomBetween(-6, 6);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(randomBetween(0, CANVAS_WIDTH * 0.3), randomBetween(0, CANVAS_HEIGHT));
    ctx.bezierCurveTo(
      randomBetween(CANVAS_WIDTH * 0.2, CANVAS_WIDTH * 0.5), randomBetween(0, CANVAS_HEIGHT),
      randomBetween(CANVAS_WIDTH * 0.5, CANVAS_WIDTH * 0.8), randomBetween(0, CANVAS_HEIGHT),
      randomBetween(CANVAS_WIDTH * 0.7, CANVAS_WIDTH), randomBetween(0, CANVAS_HEIGHT)
    );
    ctx.strokeStyle = `rgba(${Math.floor(randomBetween(60, 140))}, ${Math.floor(randomBetween(60, 140))}, ${Math.floor(randomBetween(60, 140))}, 0.3)`;
    ctx.lineWidth = randomBetween(1, 2);
    ctx.stroke();
  }
}

export default function Captcha({ value, onChange, onCaptchaChange }) {
  const canvasRef = useRef(null);
  const onCaptchaChangeRef = useRef(onCaptchaChange);
  onCaptchaChangeRef.current = onCaptchaChange;

  const generate = useCallback(() => {
    const { text } = createCaptcha();
    if (canvasRef.current) drawCaptcha(canvasRef.current, text);
    onCaptchaChangeRef.current(text);
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border border-slate-300"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />
        <button
          type="button"
          onClick={generate}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 hover:text-brand-700"
          title="Refresh Captcha"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
      </div>
      <Input
        label="Enter Captcha"
        placeholder="Enter the characters shown above"
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
}
