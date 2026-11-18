// 8th Wall の起動まわり（どのブランチでも共通で使う土台）
//
// startAR({canvas, createApp}) を呼ぶと
//   1. XRExtras / XR8 のロードを待つ
//   2. カメラ・SLAM・three.js のパイプラインを組み立てて起動
//   3. three.js のシーン準備ができたら createApp(ctx) を呼ぶ
// createApp は {update?(dt)} を返せば毎フレーム呼ばれる。

const CAMERA_HEIGHT = 1.5 // 初期カメラの高さ。地面 y=0 からの距離がワールドの縮尺（≒メートル）になる

export function startAR({canvas, createApp}) {
  let app = null
  let last = performance.now()

  const appModule = {
    name: 'app',
    onStart: () => {
      const {scene, camera, renderer} = XR8.Threejs.xrScene()

      scene.add(new THREE.AmbientLight(0xffffff, 1.2))
      const sun = new THREE.DirectionalLight(0xffffff, 1.5)
      sun.position.set(1, 4, 2)
      scene.add(sun)

      // SLAM の原点をカメラ初期位置に合わせる
      camera.position.set(0, CAMERA_HEIGHT, 0)
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })

      app = createApp({scene, camera, renderer, canvas, recenter: () => XR8.XrController.recenter()})
    },
    onUpdate: () => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      app?.update?.(dt)
    },
  }

  const onxrloaded = () => {
    XR8.XrController.configure({disableWorldTracking: false})
    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(), // カメラ映像の描画
      XR8.Threejs.pipelineModule(), // three.js のシーン/カメラ/レンダラー
      XR8.XrController.pipelineModule(), // SLAM（6DoF 空間トラッキング）
      window.LandingPage.pipelineModule(), // PC 等の非対応環境では QR コード付き案内を表示
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(), // ロード画面とカメラ許可
      XRExtras.RuntimeError.pipelineModule(),
      appModule,
    ])
    XR8.run({canvas})
  }

  const load = () => XRExtras.Loading.showLoading({onxrloaded})
  window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load, {once: true})
}
