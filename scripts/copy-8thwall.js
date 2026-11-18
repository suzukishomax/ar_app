// 8th Wall のフレームワーク層（MIT）を node_modules から public/external にコピーする。
// SLAM エンジン本体（@8thwall/engine-binary）はライセンス上の理由から自前配信せず、
// index.html で jsDelivr からバージョン固定（1.0.0）で読み込む。
import {cpSync, rmSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targets = [
  ['@8thwall/xrextras/dist', 'xrextras'],
  ['@8thwall/landing-page/dist', 'landing-page'],
]

for (const [from, to] of targets) {
  const dest = resolve(root, 'public/external', to)
  rmSync(dest, {recursive: true, force: true})
  cpSync(resolve(root, 'node_modules', from), dest, {recursive: true})
  console.log(`copied ${from} -> public/external/${to}`)
}
