// 8th Wall エンジンは window.THREE を参照するため、npm の three をグローバルに公開する。
// 他のモジュールより先に評価されるよう、main.js の最初で import すること。
import * as THREE from 'three'

window.THREE = THREE
