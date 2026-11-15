/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fff4ea",
          100: "#ffe6d1",
          200: "#ffcba1",
          300: "#ffa866",
          400: "#f17a1e",
          500: "#d96a12",
          600: "#b4540c",
          700: "#8a3f09",
          800: "#612c06",
          900: "#3d1c04",
        },
        brand: {
          navy: "#0a0a0a",
          deep: "#1a1a1a",
          gold: "#f17a1e",
          goldlight: "#ffe6d1",
          mist: "#f1f2f6",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
