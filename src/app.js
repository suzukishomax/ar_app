// ===== ここが各ブランチで差し替える「体験」部分 =====
// 土台（main ブランチ）: 画面をタップすると、入力欄の文字をその場所に置く。
//
// createApp(ctx) は AR の準備ができたら一度だけ呼ばれる。
//   ctx = {scene, camera, renderer, canvas, recenter}
// 戻り値の update(dt) は毎フレーム呼ばれる。

import {createTextLabel} from './core/text-label.js'
import {findPlacement, faceCameraYaw} from './core/placement.js'

export function createApp({scene, camera, canvas}) {
  const input = document.getElementById('note-text')
  const hint = document.getElementById('hint')

  /** 置いた文字。将来の共有機能ではこの配列をサーバーと同期する想定 */
  const notes = [] // {id, text, mesh, createdAt}
  const popping = new Set()

  function addNote(text, position) {
    const mesh = createTextLabel(text)
    mesh.position.copy(position)
    mesh.position.y += mesh.userData.size.height / 2 // 面の上に立つように
    faceCameraYaw(mesh, camera)
    mesh.scale.setScalar(0.01)
    mesh.userData.t = 0
    scene.add(mesh)
    popping.add(mesh)

    notes.push({id: crypto.randomUUID?.() ?? String(Date.now()), text, mesh, createdAt: Date.now()})
  }

  function removeNote(note) {
    scene.remove(note.mesh)
    note.mesh.userData.dispose()
    popping.delete(note.mesh)
  }

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return
    input.blur() // キーボードを閉じる
    const text = input.value.trim()
    if (!text) return
    const {clientX, clientY} = e.touches[0]
    const {position} = findPlacement({clientX, clientY, canvas, camera})
    addNote(text, position)
    hint.style.opacity = '0'
  }, {passive: true})

  document.getElementById('note-form').addEventListener('submit', (e) => {
    e.preventDefault()
    input.blur()
  })
  document.getElementById('btn-undo').addEventListener('click', () => {
    const note = notes.pop()
    if (note) removeNote(note)
  })
  document.getElementById('btn-clear').addEventListener('click', () => {
    notes.splice(0).forEach(removeNote)
  })

  return {
    update(dt) {
      // 置いた瞬間のポップアニメーション
      for (const mesh of popping) {
        mesh.userData.t = Math.min(1, mesh.userData.t + dt * 4)
        const t = mesh.userData.t
        const s = 1 + 0.3 * Math.sin(t * Math.PI) // 少し大きくなってから戻る
        mesh.scale.setScalar(Math.max(0.01, t * s))
        if (t >= 1) {
          mesh.scale.setScalar(1)
          popping.delete(mesh)
        }
      }
    },
  }
}
