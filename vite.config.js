import {defineConfig} from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// BASE_PATH は GitHub Actions からブランチごとに渡される（例: /ar_app/main/）
export default defineConfig({
  base: process.env.BASE_PATH || './',
  // スマホのカメラは HTTPS 必須なので、ローカル開発も自己署名証明書で HTTPS にする
  plugins: [basicSsl()],
  server: {host: true, port: 5173},
  build: {chunkSizeWarningLimit: 1500}, // three.js を含むため
})
