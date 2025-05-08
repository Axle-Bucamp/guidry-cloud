// tailwind.config.js
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './app/**/*.{js,ts,jsx,tsx}', // if using App Router
      './src/**/*.{js,ts,jsx,tsx}', // if you're using src/
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };
  