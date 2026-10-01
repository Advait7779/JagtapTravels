/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'lg': '0.375rem',
        'xl': '0.375rem',
        '2xl': '0.375rem',
        '3xl': '0.375rem',
      },
      colors: {
        navy: {
          950: '#070F1E',
          900: '#0B192C',
          850: '#0F1E36',
          800: '#142542',
          700: '#1E3E62',
          600: '#2A5282',
          100: '#E6EEF8',
          50: '#F1F6FD',
        },
        brand: {
          gold: '#E59E15',
          goldLight: '#FBBF24',
          amber: '#F59E0B',
          orange: '#EA580C',
          red: '#B91C1C',
          redDark: '#831843',
          cream: '#FFFDF7',
          creamDark: '#FEF3C7',
          dark: '#0B1120',
          darkSurface: '#111C30',
        }
      }
    },
  },
  plugins: [],
}
