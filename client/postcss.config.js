import { resolve } from 'path'
import { fileURLToPath } from 'url'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default {
  plugins: [
    tailwind({
      config: resolve(__dirname, '../tailwind.config.ts')
    }),
    autoprefixer
  ]
}