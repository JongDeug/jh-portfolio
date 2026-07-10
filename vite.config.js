import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /jh/ 하위 경로로 nginx 서빙 → base 고정
export default defineConfig({
  base: '/jh/',
  plugins: [react()],
})
