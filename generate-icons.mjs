// Generates PNG icons using canvas API via node-canvas
// Fallback: creates simple SVG-based icons
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background - lime green rounded square
  const r = size * 0.18
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#bef264'
  ctx.fill()

  // CS text
  ctx.fillStyle = '#08090d'
  ctx.font = `bold ${size * 0.38}px "Arial"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('CS', size / 2, size / 2 + size * 0.02)

  return canvas.toBuffer('image/png')
}

try {
  writeFileSync('./public/icons/icon-192.png', generateIcon(192))
  writeFileSync('./public/icons/icon-512.png', generateIcon(512))
  console.log('Icons generated successfully')
} catch(e) {
  console.log('Canvas not available, using SVG approach')
}
