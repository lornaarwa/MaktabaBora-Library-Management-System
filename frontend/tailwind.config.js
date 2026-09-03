/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bark: {
          DEFAULT: '#1f4d2e',
          50: '#f3f6f0',
          100: '#e2e8db',
          200: '#c5d1c1',
          300: '#9fb3a0',
          400: '#75907a',
          500: '#52705a',
          600: '#33593f',
          700: '#1f4d2e',
          800: '#163a23',
          900: '#0e2a19',
        },
        tan: {
          DEFAULT: '#c9a227',
          light: '#e6cd7f',
          dark: '#8a6d12',
        },
        olive: {
          DEFAULT: '#c7cc80',
          light: '#dbdfa8',
          dark: '#9ba455',
        },
        cream: {
          DEFAULT: '#dec8b0',
          light: '#efe2d3',
        },
        sage: {
          DEFAULT: '#a9b79e',
          dark: '#7f9072',
        },
        paper: '#fbf7f1',
        ink: '#0e2a19',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,42,25,0.06), 0 8px 24px -12px rgba(14,42,25,0.18)',
        lift: '0 12px 32px -10px rgba(14,42,25,0.28)',
      },
    },
  },
  plugins: [],
};