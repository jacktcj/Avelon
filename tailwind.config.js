/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: { 950: '#050a1c', 900: '#0a1433', 800: '#10204d', 700: '#18306b', 600: '#22418c' },
        gold: { 200: '#f6e7b8', 300: '#ecd48a', 400: '#d9b65c', 500: '#c19a3e', 600: '#9a7628', 700: '#6e5419' },
        good: { 300: '#8fd3ff', 400: '#4fb3f0', 500: '#2a8fd6', 600: '#1a6aa8', 700: '#124b78' },
        evil: { 300: '#ff9a9a', 400: '#f05a5a', 500: '#d42f3a', 600: '#a51d29', 700: '#6e121b' },
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'Cinzel', '"Noto Serif SC"', '"Songti SC"', '"STSong"', '"Source Han Serif SC"', '"SimSun"', 'serif'],
        heading: ['Cinzel', '"Noto Serif SC"', '"Songti SC"', '"STSong"', '"Source Han Serif SC"', '"SimSun"', 'serif'],
        body: ['"Cormorant Garamond"', 'Georgia', '"Noto Serif SC"', '"Songti SC"', '"STSong"', '"Source Han Serif SC"', '"SimSun"', 'serif'],
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        flipIn: { '0%': { opacity: 0, transform: 'perspective(900px) rotateY(-90deg)' }, '100%': { opacity: 1, transform: 'perspective(900px) rotateY(0)' } },
        glow: { '0%,100%': { opacity: 0.55 }, '50%': { opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '70%': { transform: 'scale(1.08)', opacity: 1 }, '100%': { transform: 'scale(1)' } },
        twinkle: { '0%,100%': { opacity: 0.2 }, '50%': { opacity: 0.9 } },
      },
      animation: {
        fadeUp: 'fadeUp .45s ease-out both',
        flipIn: 'flipIn .6s cubic-bezier(.2,.8,.2,1) both',
        glow: 'glow 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
        pop: 'pop .5s ease-out both',
        twinkle: 'twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
