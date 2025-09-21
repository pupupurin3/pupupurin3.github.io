/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Silkscreen"', 'cursive'],
      },
      colors: {
        primary: '#38bdf8',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/intro-bg.jpg')",
        'education-pattern': "url('/images/counters-bg.jpg')",
        'footer-pattern': "url('/images/overlay-bg.jpg')",
      },
    },
  },
  plugins: [],
};
