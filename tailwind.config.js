/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f9ff",
          100: "#e8f1ff",
          500: "#215ca6",
          700: "#163f73",
          900: "#102949",
        },
      },
    },
  },
  plugins: [],
};
