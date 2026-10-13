/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111827',
        'surface-elevated': '#1f293d',
        accent: '#38bdf8',
        'accent-hover': '#0ea5e9',
      },
    },
  },
  plugins: [],
};
