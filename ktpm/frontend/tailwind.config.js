/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}", "./*.{html,js}"],
  theme: {
    extend: {
      colors: {
        bluemoon: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Màu chủ đạo (Sky blue)
          600: '#0284c7',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}
