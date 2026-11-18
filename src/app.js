// ===== marker/image-target ブランチ：ステップ1「マーカーを映したら文字が出る」 =====
// - 印刷したマーカー（イメージターゲット）を認識し、その上に文字を表示する
// - マーカーの輪郭に枠を重ねて、位置合わせの精度を目で確認できるようにする
// - マーカーを見失っても、SLAM で同じ場所に残り続けるかを確認する（ステップ2の前提）
// - main と同じく、画面タップで文字を置く機能も残している

import {createTextLabel} from './core/text-label.js'
import {findPlacement, faceCameraYaw} from './core/placement.js'
import {loadImageTargets, applyImagePose, IMAGE_EVENTS} from './core/image-targets.js'

/** 使うマーカー一覧（`npm run marker -- <name> "<表示名>"` で生成） */
const MARKERS = [
  {name: 'desk-a', text: '📌 DESK A のメモ'},
]

export const events = [...IMAGE_EVENTS, 'reality.imagescanning']

export async function beforeRun() {
  await loadImageTargets(MARKERS.map((m) => m.name))
}

export function createApp({scene, camera, canvas}) {
  const input = document.getElementById('note-text')
  const status = document.getElementById('hint')
  const setStatus = (text) => { status.textContent = text }
  setStatus('マーカーを読み込み中…')

  // ---- マーカーごとのアンカー（この子要素はマーカー基準の座標になる） ----
  const anchors = new Map() // name -> {group, built, state}
  for (const m of MARKERS) {
    const group = new THREE.Group()
    group.visible = false
    scene.add(group)
    anchors.set(m.name, {group, built: false, state: 'none', def: m})
  }

  function buildMarkerContent(anchor, w, h) {
    const {group, def} = anchor

    // マーカーの輪郭（印刷物とぴったり重なれば位置合わせ成功）
    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-w / 2, -h / 2, 0), new THREE.Vector3(w / 2, -h / 2, 0),
        new THREE.Vector3(w / 2, h / 2, 0), new THREE.Vector3(-w / 2, h / 2, 0),
      ]),
      new THREE.LineBasicMaterial({color: 0x00e5ff}),
    )
    frame.position.z = 0.002
    group.add(frame)

    // 半透明の色をのせて「認識している範囲」を見やすくする
    const tint = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({color: 0x00e5ff, transparent: true, opacity: 0.15, depthWrite: false}),
    )
    tint.position.z = 0.001
    group.add(tint)

    // マーカーの上端の外側に文字を置く（マーカーと同じ面上）
    const label = createTextLabel(def.text, {background: 'rgba(255,240,120,0.95)'})
    const s = (w * 0.95) / label.userData.size.width
    label.scale.setScalar(s)
    label.position.set(0, h / 2 + (label.userData.size.height * s) / 2 + 0.04, 0.003)
    group.add(label)

    anchor.built = true
  }

  // ---- タップで文字を置く（main と同じ） ----
  const notes = []
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return
    input.blur()
    const text = input.value.trim()
    if (!text) return
    const {clientX, clientY} = e.touches[0]
    const {position} = findPlacement({clientX, clientY, canvas, camera})
    const mesh = createTextLabel(text)
    mesh.position.copy(position)
    mesh.position.y += mesh.userData.size.height / 2
    faceCameraYaw(mesh, camera)
    scene.add(mesh)
    notes.push(mesh)
  }, {passive: true})
  document.getElementById('note-form').addEventListener('submit', (e) => {
    e.preventDefault()
    input.blur()
  })
  const remove = (mesh) => { scene.remove(mesh); mesh.userData.dispose() }
  document.getElementById('btn-undo').addEventListener('click', () => {
    const m = notes.pop()
    if (m) remove(m)
  })
  document.getElementById('btn-clear').addEventListener('click', () => notes.splice(0).forEach(remove))

  // ---- 状態表示 ----
  const worldPos = new THREE.Vector3()
  function describe(anchor) {
    const {group, def, state, worldHeight} = anchor
    group.getWorldPosition(worldPos)
    const dist = worldPos.distanceTo(camera.position).toFixed(2)
    const size = `高さ≈${worldHeight.toFixed(2)}`
    if (state === 'tracking') return `✅ ${def.name} 認識中（距離≈${dist} / ${size}）`
    return `👀 ${def.name} 見失い中 → SLAM で位置を保持（距離≈${dist}）`
  }

  let pop = null
  return {
    onEvent(name, detail) {
      if (name === 'reality.imagescanning') {
        setStatus('🖨 印刷したマーカーを映してください')
        return
      }
      const anchor = anchors.get(detail?.name)
      if (!anchor) return

      if (name === 'reality.imagelost') {
        anchor.state = 'lost' // 表示は消さない：SLAM で同じ場所に残るかの検証
      } else {
        if (!anchor.built) buildMarkerContent(anchor, detail.scaledWidth, detail.scaledHeight)
        applyImagePose(anchor.group, detail)
        anchor.worldHeight = detail.scale * detail.scaledHeight
        if (name === 'reality.imagefound') {
          anchor.group.visible = true
          pop = {anchor, t: 0, base: detail.scale}
        }
        anchor.state = 'tracking'
      }
      setStatus(describe(anchor))
    },

    update(dt) {
      if (pop) {
        // 見つけた瞬間に少し弾ませる
        pop.t = Math.min(1, pop.t + dt * 4)
        const k = 1 + 0.15 * Math.sin(pop.t * Math.PI)
        pop.anchor.group.scale.setScalar(pop.base * k)
        if (pop.t >= 1) pop = null
      }
      // 見失い中も距離表示を更新（歩き回っても残っているかの確認用）
      for (const a of anchors.values()) {
        if (a.state === 'lost') setStatus(describe(a))
      }
    },
  }
}
