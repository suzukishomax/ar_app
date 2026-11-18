// エントリーポイント
import './core/three-global.js' // ← 必ず最初（以降のモジュールが THREE を使う）
import {startAR} from './core/ar.js'
import {createApp} from './app.js'

startAR({
  canvas: document.getElementById('camerafeed'),
  createApp,
})
