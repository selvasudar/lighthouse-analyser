/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'media', // or 'class' if you want to toggle manually
    theme: {
      extend: {},
    },
    plugins: [],
  }