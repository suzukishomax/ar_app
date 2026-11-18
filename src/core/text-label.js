// 文字を three.js の板ポリ（Mesh）にする。
// Canvas 2D で描くので日本語・絵文字もフォントファイル不要でそのまま出せる。

const PX_PER_METER = 1000 // テクスチャ解像度（1m あたりのピクセル数）

/**
 * @param {string} text 改行(\n)対応
 * @param {object} [opts]
 * @param {number} [opts.height=0.08]   1 行の高さ（m）
 * @param {string} [opts.color='#222']
 * @param {string} [opts.background='rgba(255,255,255,0.9)']  null で背景なし
 * @param {number} [opts.padding=0.3]  1 行の高さに対する余白の比率
 * @param {string} [opts.font='bold {px}px -apple-system, "Hiragino Sans", sans-serif']
 */
export function createTextLabel(text, opts = {}) {
  const {
    height = 0.08,
    color = '#222',
    background = 'rgba(255,255,255,0.9)',
    padding = 0.3,
    font = 'bold {px}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif',
  } = opts

  const lines = String(text).split('\n')
  const fontPx = Math.round(height * PX_PER_METER * 0.75)
  const linePx = Math.round(height * PX_PER_METER)
  const padPx = Math.round(linePx * padding)
  const fontStr = font.replace('{px}', fontPx)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = fontStr
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 1)

  canvas.width = Math.ceil(textW + padPx * 2)
  canvas.height = linePx * lines.length + padPx * 2

  // canvas のサイズ変更で状態がリセットされるので再設定
  if (background) {
    ctx.fillStyle = background
    roundRect(ctx, 0, 0, canvas.width, canvas.height, padPx)
    ctx.fill()
  }
  ctx.font = fontStr
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, padPx + linePx * (i + 0.5))
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const geometry = new THREE.PlaneGeometry(canvas.width / PX_PER_METER, canvas.height / PX_PER_METER)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData.text = text
  mesh.userData.size = {width: geometry.parameters.width, height: geometry.parameters.height}
  mesh.userData.dispose = () => {
    geometry.dispose()
    material.dispose()
    texture.dispose()
  }
  return mesh
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
