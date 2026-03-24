/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          blue: '#1e3a8a',
          yellow: '#f59e0b',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
