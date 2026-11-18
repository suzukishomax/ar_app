// 画面タップ位置 → 空間上の 3D 座標 を求める。
// 1. 8th Wall の hitTest（特徴点・推定平面）で机や壁などの実物に当てる
// 2. 当たらなければ地面（y=0）との交点
// 3. それも無理ならカメラ前方 1m

const raycaster = new THREE.Raycaster()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

/**
 * @returns {{position: THREE.Vector3, source: 'hit'|'ground'|'front'}}
 */
export function findPlacement({clientX, clientY, canvas, camera}) {
  const rect = canvas.getBoundingClientRect()
  const nx = (clientX - rect.left) / rect.width
  const ny = (clientY - rect.top) / rect.height

  const hits = XR8.XrController.hitTest(nx, ny, ['FEATURE_POINT', 'ESTIMATED_SURFACE']) || []
  if (hits.length) {
    const nearest = hits.reduce((a, b) => (a.distance <= b.distance ? a : b))
    const {x, y, z} = nearest.position
    return {position: new THREE.Vector3(x, y, z), source: 'hit'}
  }

  raycaster.setFromCamera(new THREE.Vector2(nx * 2 - 1, -(ny * 2 - 1)), camera)
  const p = new THREE.Vector3()
  if (raycaster.ray.intersectPlane(groundPlane, p) && p.distanceTo(camera.position) < 10) {
    return {position: p, source: 'ground'}
  }

  return {position: raycaster.ray.at(1, new THREE.Vector3()), source: 'front'}
}

/** オブジェクトをカメラの方へ向ける（水平回転のみ。文字が傾かない） */
export function faceCameraYaw(object, camera) {
  const dx = camera.position.x - object.position.x
  const dz = camera.position.z - object.position.z
  object.rotation.set(0, Math.atan2(dx, dz), 0)
}
