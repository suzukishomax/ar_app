# AR Text Base（8th Wall × three.js）

スマホのブラウザだけで動く Web AR の **土台（main ブランチ）**。
画面をタップすると、入力した文字がその場所（机・床・壁）に固定されて置かれる。

ここから派生ブランチを切って、空間メモ・ゲームなど色々なパターンを試す前提の構成。

## 構成

```
index.html              8th Wall の読み込み + UI
src/main.js             エントリーポイント
src/app.js              ★ 体験の中身（ブランチごとにここを書き換える）
src/core/ar.js          8th Wall の起動（カメラ・SLAM・three.js）※基本触らない
src/core/text-label.js  文字 → 3D の板（Canvas 描画なので日本語・絵文字 OK）
src/core/placement.js   タップ位置 → 空間座標（hitTest → 地面 → 前方 1m）
src/core/image-targets.js マーカーの読み込み・姿勢の反映
src/core/three-global.js  window.THREE の公開
scripts/copy-8thwall.js xrextras / landing-page を public/external にコピー
.github/workflows/deploy.yml  push したブランチを GitHub Pages に自動公開
```

8th Wall の 2 層構造（技術構成資料どおり）:

| 層 | パッケージ | 取得方法 |
|---|---|---|
| フレームワーク（MIT） | `@8thwall/xrextras`, `@8thwall/landing-page` | npm → ビルドに同梱 |
| SLAM エンジン（非公開バイナリ） | `@8thwall/engine-binary@1.0.0` | jsDelivr から読み込み（バージョン固定） |

## ローカルで試す

```bash
npm install
npm run dev          # https://<PCのIP>:5173/ で起動
npm run qr           # 同じ Wi-Fi のスマホ用 QR をターミナルに表示
```

自己署名証明書なので、スマホで開くと警告が出る →「詳細」から続行する。

## デプロイ（無料・自動）

GitHub に push するだけで、**ブランチごとに別 URL** で GitHub Pages に公開される。

| ブランチ | URL |
|---|---|
| `main` | `https://<user>.github.io/<repo>/main/` |
| `feature/memo` | `https://<user>.github.io/<repo>/feature-memo/` |

- 公開 URL とQRコードは GitHub の **Actions → 実行結果の Summary** に表示される
- PC でその URL を開くと、画面に **スマホ用 QR コード** が出る（8th Wall の landing-page 機能）
- 任意の URL の QR を出す: `npm run qr -- https://...`

### 新しいパターンを試すとき

```bash
git switch main
git switch -c game/xxxx     # 派生ブランチを作る
# src/app.js を書き換える
git push -u origin game/xxxx  # → .../game-xxxx/ に公開
```

## マーカー（イメージターゲット）— `marker/image-target` ブランチ

印刷したマーカーを映すと、その上に文字を表示する（共有メモのステップ1）。

- 印刷用ページ: `<公開URL>/print-marker.html`（A4・倍率100%で印刷 → 120×160mm）
- マーカー追加: `npm run marker -- desk-b "DESK B"` → `markers/` に画像、`public/image-targets/` に認識データ
  （8th Wall 公式の `@8thwall/image-target-cli` を使用）。`src/app.js` の `MARKERS` に追記する
- 子要素の座標系: マーカー中心が原点・マーカー面が XY 平面・+Z が手前。縦長マーカーは高さ 1 / 幅 0.75
- 見失っても表示は消さず、SLAM で同じ位置に残るかを確認できる（画面下に状態と距離を表示）

## 今後：複数人で空間メモを共有するには

SLAM の座標原点は「アプリを起動した位置」になるため、端末ごと・起動ごとに座標がズレる。
オフィス内で共有するには **共通の基準点** が必要。

- **案 A: イメージターゲット（おすすめ）** — 各デスクや壁に印刷したマーカーを貼り、
  マーカー基準の相対座標でメモを保存。engine-binary に Image Targets が含まれている
- **案 B: 起動位置を揃える** — 床のマークの上で起動するルール。手軽だが精度は低い

データ保存は Firebase / Supabase 等の無料枠で、`src/app.js` の `notes` 配列を同期する想定。

## ライセンス・クレジット

- `@8thwall/engine-binary` は Niantic Spatial, Inc. の XR Engine License Agreement に従う
  （非公開・改変禁止・有料かつ価値の大部分が本エンジン由来の製品には使えない）。
  画面下部にクレジットを表示している。詳細は https://8thwall.org/docs/open-source を参照
- `@8thwall/xrextras`, `@8thwall/landing-page`: MIT License
- three.js: MIT License
