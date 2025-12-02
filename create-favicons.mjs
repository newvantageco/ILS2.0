#!/usr/bin/env node
/**
 * Create ILS-branded favicon PNG files
 * Simple colored squares with ILS branding
 */

import fs from 'fs';
import { createCanvas } from 'canvas';

function createFavicon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - dark blue
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  // Add border radius effect with clipping
  ctx.save();
  const radius = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  // Draw lens circles (top)
  const centerX = size / 2;
  const centerY = size * 0.3;
  const outerRadius = size * 0.12;
  const innerRadius = size * 0.08;

  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw ILS text
  const fontSize = size * 0.4;
  ctx.fillStyle = '#3b82f6';
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ILS', centerX, size * 0.65);

  ctx.restore();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Created ${outputPath} (${size}x${size})`);
}

// Check if canvas module is available
try {
  // Create favicons
  createFavicon(128, 'client/public/favicon.png');
  createFavicon(192, 'client/public/icon-192.png');
  createFavicon(512, 'client/public/icon-512.png');
  console.log('\n✅ All favicons created successfully!');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('❌ canvas module not found');
    console.log('Creating simple fallback icons...\n');

    // Fallback: Create simple solid color PNGs using minimal PNG encoding
    // This is a simplified approach - just update the existing files manually
    console.log('Please install canvas module: npm install canvas');
    console.log('Or use an online tool to create PNG favicons from the SVG');
  } else {
    console.error('Error creating favicons:', error);
  }
}
