/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pokedex-red': '#D32F2F',
        'pokedex-red-dark': '#8B1A1A',
        'pokedex-screen': '#e0f7fa',
        'pokedex-screen-dark': '#1a2a2a',
        'pokedex-screen-border': '#b2ebf2',
        'pokedex-screen-text': '#1a2a2a',
        'pokedex-screen-text-dark': '#e0f7fa',
      },
      fontFamily: {
        pokedex: [
          '"Press Start 2P"',
          '"VT323"',
          'monospace',
        ],
      },
      boxShadow: {
        'pokedex-btn': '0 2px 0 0 #b71c1c',
        'pokedex-btn-hover': '0 4px 8px 0 #d32f2f44',
        'pokedex-bolt': '0 0 6px 2px #d32f2f44',
      },
    },
  },
  plugins: []
};
