/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED', bg: '#0A0914', surface: '#100E1E', card: '#120F22',
        premium: '#F59E0B', repVerde: '#22C55E', repAmarillo: '#EAB308', repRojo: '#EF4444',
      },
      backgroundImage: { 'gm-gradient': 'linear-gradient(160deg, #4C1D95 0%, #2E1065 50%, #0A0914 100%)' },
    },
  },
  plugins: [],
};
