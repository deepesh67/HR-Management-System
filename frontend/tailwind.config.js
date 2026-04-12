/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bccaff',
          300: '#8fa7ff',
          400: '#5c78ff',
          500: '#3752e3',
          600: '#2539c9',
          700: '#1d2ca3',
          800: '#1c2883',
          900: '#1d266b',
        },
      },
    },
  },
  plugins: [],
}
