// イメージターゲット（印刷マーカー）の読み込み。
// データは `npm run marker -- <name>` で public/image-targets/ に生成される。

/** @param {string[]} names 例: ['desk-a'] */
export async function loadImageTargets(names) {
  const imageTargetData = await Promise.all(
    names.map(async (name) => {
      const res = await fetch(`./image-targets/${name}.json`)
      if (!res.ok) throw new Error(`image target not found: ${name}`)
      return res.json()
    }),
  )
  XR8.XrController.configure({imageTargetData})
  return imageTargetData
}

export const IMAGE_EVENTS = ['reality.imagefound', 'reality.imageupdated', 'reality.imagelost']

/**
 * マーカーの姿勢を three.js のオブジェクトに反映する。
 * 子要素の座標系: マーカー中心が原点、マーカー面が XY 平面、+Z が表面から手前方向。
 * 大きさは detail.scaledWidth × detail.scaledHeight。
 */
export function applyImagePose(object, detail) {
  const {position: p, rotation: r, scale} = detail
  object.position.set(p.x, p.y, p.z)
  object.quaternion.set(r.x, r.y, r.z, r.w)
  object.scale.setScalar(scale)
}
