'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  hue: number;
  hueSpeed: number;
  twinkle: number;
  twinkleSpeed: number;
  type: 'dot' | 'prism' | 'sparkle';
}

export default function PrismStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: Star[] = [];
    const TYPES: Star['type'][] = ['dot', 'dot', 'dot', 'dot', 'prism', 'sparkle', 'sparkle'];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function randomHue() {
      // Bias toward gold/amber (20-70) but include full spectrum
      return Math.random() < 0.35
        ? 20 + Math.random() * 50
        : Math.random() * 360;
    }

    function createStar(atBottom = false): Star {
      return {
        x: Math.random() * canvas!.width,
        y: atBottom ? canvas!.height + Math.random() * 40 : Math.random() * canvas!.height,
        size: Math.random() * 2.2 + 0.4,
        speedY: -(Math.random() * 0.35 + 0.08),
        speedX: (Math.random() - 0.5) * 0.18,
        opacity: Math.random() * 0.65 + 0.25,
        hue: randomHue(),
        hueSpeed: Math.random() * 0.6 + 0.15,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.025 + 0.008,
        type: TYPES[Math.floor(Math.random() * TYPES.length)],
      };
    }

    function drawDot(s: Star, glow: number) {
      const a = s.opacity * (0.55 + glow * 0.45);
      ctx!.save();
      ctx!.globalAlpha = a;
      ctx!.shadowBlur = s.size * (10 + glow * 14);
      ctx!.shadowColor = `hsl(${s.hue},100%,72%)`;
      ctx!.fillStyle = `hsl(${s.hue},80%,88%)`;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawPrism(s: Star, glow: number) {
      ctx!.save();
      // Outer prismatic rings
      for (let r = 4; r >= 0; r--) {
        const rHue = (s.hue + r * 28) % 360;
        const rSize = s.size * (1.8 + r * 2.8);
        const rAlpha = (0.07 - r * 0.012) * (0.4 + glow * 0.6) * s.opacity;
        ctx!.globalAlpha = Math.max(0, rAlpha);
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = `hsl(${rHue},100%,62%)`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, rSize, 0, Math.PI * 2);
        ctx!.fill();
      }
      // Bright core
      ctx!.globalAlpha = s.opacity * (0.75 + glow * 0.25);
      ctx!.shadowBlur = s.size * 22 * (0.4 + glow * 0.6);
      ctx!.shadowColor = `hsl(${s.hue},100%,82%)`;
      ctx!.fillStyle = `hsl(${s.hue},60%,96%)`;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.size * 1.3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawSparkle(s: Star, glow: number) {
      const a = s.opacity * (0.45 + glow * 0.55);
      const len = s.size * (3.5 + glow * 4.5);
      ctx!.save();
      ctx!.globalAlpha = a;
      ctx!.shadowBlur = s.size * 18;
      ctx!.shadowColor = `hsl(${s.hue},100%,75%)`;
      ctx!.strokeStyle = `hsl(${s.hue},85%,82%)`;
      ctx!.lineCap = 'round';
      // Main cross
      ctx!.lineWidth = s.size * 0.65;
      ctx!.beginPath(); ctx!.moveTo(s.x - len, s.y); ctx!.lineTo(s.x + len, s.y); ctx!.stroke();
      ctx!.beginPath(); ctx!.moveTo(s.x, s.y - len); ctx!.lineTo(s.x, s.y + len); ctx!.stroke();
      // Diagonal rays
      ctx!.lineWidth = s.size * 0.3;
      ctx!.globalAlpha = a * 0.45;
      const dl = len * 0.55;
      ctx!.beginPath(); ctx!.moveTo(s.x - dl, s.y - dl); ctx!.lineTo(s.x + dl, s.y + dl); ctx!.stroke();
      ctx!.beginPath(); ctx!.moveTo(s.x + dl, s.y - dl); ctx!.lineTo(s.x - dl, s.y + dl); ctx!.stroke();
      ctx!.restore();
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.speedY;
        s.x += s.speedX;
        s.hue = (s.hue + s.hueSpeed) % 360;
        s.twinkle += s.twinkleSpeed;

        if (s.y < -30 || s.x < -30 || s.x > canvas!.width + 30) {
          stars[i] = createStar(true);
          stars[i].x = Math.random() * canvas!.width;
        }

        const glow = Math.sin(s.twinkle) * 0.5 + 0.5;
        if (s.type === 'prism') drawPrism(s, glow);
        else if (s.type === 'sparkle') drawSparkle(s, glow);
        else drawDot(s, glow);
      }

      animId = requestAnimationFrame(animate);
    }

    function init() {
      resize();
      const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 12000), 130);
      for (let i = 0; i < count; i++) stars.push(createStar(false));
    }

    init();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', opacity: 0.9,
      }}
    />
  );
}
