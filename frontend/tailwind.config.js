/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Outfit"', 'serif'],
        sans: ['"Outfit"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        blue: {
          50: '#e6f7f3',
          100: '#cceee6',
          200: '#99ddcd',
          300: '#66ccb3',
          400: '#33bb9a',
          500: '#00B386',
          600: '#009973',
          700: '#007356',
          800: '#004d3a',
          900: '#00261d',
        },
        indigo: {
          50: '#e6f7f3',
          100: '#cceee6',
          200: '#99ddcd',
          300: '#66ccb3',
          400: '#33bb9a',
          500: '#00B386',
          600: '#009973',
          700: '#007356',
          800: '#004d3a',
          900: '#00261d',
        }
      },
    },
  },
  plugins: [],
}
