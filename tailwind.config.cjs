/** @type {import('tailwindcss').Config} */
module.exports = {
  // content tells Tailwind which files to scan for class names.
  // If a class isn't found here, Tailwind will purge it from the
  // production build — so this must cover every file that uses
  // Tailwind classes.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // We extend (not replace) the default theme so all default
      // Tailwind utilities still work alongside our custom tokens.
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}