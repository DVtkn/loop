import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background iOS Coral-Red Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF385C"/>
      <stop offset="45%" stop-color="#FF2442"/>
      <stop offset="100%" stop-color="#D90429"/>
    </linearGradient>

    <!-- Ambient radial glow behind heart -->
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#FFB3C1" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FF2442" stop-opacity="0"/>
    </radialGradient>

    <!-- Heart Main Gradient (Glossy White to Soft Rose) -->
    <linearGradient id="heartGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#FFF0F3"/>
      <stop offset="100%" stop-color="#FFCCD5"/>
    </linearGradient>

    <!-- Heart Top Specular Highlight -->
    <linearGradient id="heartLight" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>

    <!-- Sparkle Gradients -->
    <radialGradient id="sparkleGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#FFF0F5" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFCCD5" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Solid Background (iOS automatically applies rounded mask for Home Screen) -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  
  <!-- Ambient Center Glow -->
  <circle cx="256" cy="245" r="230" fill="url(#centerGlow)"/>

  <!-- Subtle Deep Shadow under Heart for 3D Elevation -->
  <path 
    d="M256 425 C238 405 130 312 88 258 C45 204 46 142 88 100 C130 58 195 62 256 128 C317 62 382 58 424 100 C466 142 467 204 424 258 C382 312 274 405 256 425 Z" 
    fill="#800015" 
    opacity="0.35"
    transform="translate(0, 14)"
  />

  <!-- Main 3D Glossy Heart -->
  <path 
    d="M256 420 C238 400 130 307 88 253 C45 199 46 137 88 95 C130 53 195 57 256 123 C317 57 382 53 424 95 C466 137 467 199 424 253 C382 307 274 400 256 420 Z" 
    fill="url(#heartGrad)"
  />

  <!-- Top Inner Light Reflection -->
  <path 
    d="M256 420 C238 400 130 307 88 253 C45 199 46 137 88 95 C130 53 195 57 256 123 C317 57 382 53 424 95 C466 137 467 199 424 253 C382 307 274 400 256 420 Z" 
    fill="url(#heartLight)"
  />

  <!-- Top Right Sparkle Star -->
  <g transform="translate(385, 120)">
    <!-- Glow halo -->
    <circle cx="0" cy="0" r="32" fill="url(#sparkleGrad)" opacity="0.6"/>
    <!-- 4-point Diamond Star -->
    <path 
      d="M0 -34 Q0 0 34 0 Q0 0 0 34 Q0 0 -34 0 Q0 0 0 -34 Z" 
      fill="#FFFFFF"
    />
  </g>

  <!-- Bottom Left Accent Sparkle -->
  <g transform="translate(118, 330)">
    <circle cx="0" cy="0" r="20" fill="url(#sparkleGrad)" opacity="0.5"/>
    <path 
      d="M0 -20 Q0 0 20 0 Q0 0 0 20 Q0 0 -20 0 Q0 0 0 -20 Z" 
      fill="#FFFFFF" 
      opacity="0.95"
    />
  </g>

  <!-- Small Delicate Star Near Top Left -->
  <g transform="translate(145, 130)">
    <path 
      d="M0 -12 Q0 0 12 0 Q0 0 0 12 Q0 0 -12 0 Q0 0 0 -12 Z" 
      fill="#FFFFFF" 
      opacity="0.8"
    />
  </g>
</svg>`;

async function main() {
  const publicDir = path.join(process.cwd(), 'public');

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
  console.log('Saved public/icon.svg');

  // Generate PNGs at all required resolutions
  const targets = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-180.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const target of targets) {
    const resvg = new Resvg(svgContent, {
      fitTo: {
        mode: 'width',
        value: target.size,
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    const outPath = path.join(publicDir, target.name);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`Generated ${target.name} (${target.size}x${target.size})`);
  }
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
