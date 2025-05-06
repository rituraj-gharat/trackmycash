/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        futuristic: ['Orbitron', 'sans-serif']
      },
      colors: {
        neonYellow: '#e4ff00',
        neonPurple: '#a954ff'
      }
    }
  },
  plugins: []
}
