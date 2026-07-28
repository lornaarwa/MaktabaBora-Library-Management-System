/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bark: {
          DEFAULT: '#64493a',
          50: '#f6f1ec',
          100: '#e7dcd2',
          300: '#b99b86',
          500: '#8a6853',
          700: '#64493a',
          900: '#3a2b22',
        },
        tan: {
          DEFAULT: '#c9a57c',
          light: '#dcbf9d',
          dark: '#ad8659',
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(58,43,34,0.06), 0 8px 24px -12px rgba(58,43,34,0.18)',
        lift: '0 12px 32px -10px rgba(58,43,34,0.28)',
      },
    },
  },
  plugins: [],
};
