// マーカー（イメージターゲット）を生成する。
//   npm run marker -- desk-a "DESK A"
// 1. 特徴点が多く認識しやすい画像を生成（markers/<name>.png、3:4 縦長）
// 2. 8th Wall 公式の image-target-cli で認識用データを作成（public/image-targets/）
//
// 認識しやすい画像の条件: 高コントラスト / 模様が繰り返さない / 上下左右が非対称
import {spawnSync} from 'node:child_process'
import {mkdirSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const name = process.argv[2] || 'desk-a'
const title = process.argv[3] || name.toUpperCase()

const W = 1200
const H = 1600

// 名前から決まる乱数（同じ名前なら毎回同じ絵柄）
let seed = [...name].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 2166136261)
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const colors = ['#111', '#111', '#111', '#e63946', '#1d3557', '#2a9d8f', '#f4a261']

const shapes = []
for (let i = 0; i < 260; i++) {
  const x = rand() * W
  const y = rand() * H
  const s = 15 + rand() ** 2 * 140
  const fill = pick(colors)
  const op = (0.55 + rand() * 0.45).toFixed(2)
  const kind = rand()
  if (kind < 0.35) {
    shapes.push(`<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${fill}" opacity="${op}"/>`)
  } else if (kind < 0.7) {
    const pts = [0, 1, 2].map(() => `${x + (rand() - 0.5) * s * 2},${y + (rand() - 0.5) * s * 2}`).join(' ')
    shapes.push(`<polygon points="${pts}" fill="${fill}" opacity="${op}"/>`)
  } else if (kind < 0.9) {
    shapes.push(`<rect x="${x}" y="${y}" width="${s}" height="${s * (0.3 + rand())}" fill="${fill}" opacity="${op}" transform="rotate(${rand() * 90} ${x} ${y})"/>`)
  } else {
    shapes.push(`<line x1="${x}" y1="${y}" x2="${x + (rand() - 0.5) * 400}" y2="${y + (rand() - 0.5) * 400}" stroke="${fill}" stroke-width="${4 + rand() * 14}" stroke-linecap="round"/>`)
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#fff"/>
  ${shapes.join('\n  ')}
  <rect x="80" y="${H - 330}" width="${W - 160}" height="230" rx="30" fill="#fff" stroke="#111" stroke-width="10"/>
  <text x="${W / 2}" y="${H - 175}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="140" fill="#111">${title}</text>
  <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="#111" stroke-width="24"/>
</svg>`

mkdirSync(resolve(root, 'markers'), {recursive: true})
const pngPath = resolve(root, 'markers', `${name}.png`)
await sharp(Buffer.from(svg)).png().toFile(pngPath)
console.log('marker image:', pngPath)

// image-target-cli は対話式なので、回答を標準入力で流し込む
// 画像パス / flat / デフォルトクロップ / 出力先 / 名前
const answers = [pngPath, '1', 'y', resolve(root, 'public/image-targets'), name].join('\n') + '\n'
const r = spawnSync('npx', ['image-target-cli'], {
  cwd: root,
  input: answers,
  encoding: 'utf8',
  env: {...process.env, OVERWRITE_FILES: 'true'},
})
process.stdout.write(r.stdout.split('\n').filter((l) => l.includes('saved')).join('\n') + '\n')
if (r.status !== 0) {
  console.error(r.stderr || r.stdout)
  process.exit(1)
}
