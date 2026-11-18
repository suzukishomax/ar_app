// 使い方: npm run qr -- <URL>
// URL を省略するとローカル開発サーバー（同一 Wi-Fi のスマホ用）の URL を表示する
import os from 'node:os'
import QRCode from 'qrcode'

let url = process.argv[2]
if (!url) {
  const ip = Object.values(os.networkInterfaces()).flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address
  url = `https://${ip || 'localhost'}:5173/`
}
console.log(url)
console.log(await QRCode.toString(url, {type: 'terminal', small: true}))
