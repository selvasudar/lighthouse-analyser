/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Changed to 'class' for manual toggle
    theme: {
      extend: {},
    },
    plugins: [],
  }