/** @type {import('postcss').Config} */
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import tailwindcssNesting from 'tailwindcss/nesting/index.js'
import postcssNesting from 'postcss-nesting'

/** @type {import('postcss').Config} */
export default {
  plugins: [
  tailwindcssNesting(postcssNesting),
    tailwindcss,
    autoprefixer,
  ],
}
