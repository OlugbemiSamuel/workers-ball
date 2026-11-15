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
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#d4d4d8",
          500: "#a1a1aa",
          600: "#71717a",
          700: "#52525b",
          800: "#3f3f46",
          900: "#27272a",
        },
        brand: {
          navy: "#0a0a0a",
          deep: "#1a1a1a",
          gold: "#d4d4d8",
          goldlight: "#f4f4f5",
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
