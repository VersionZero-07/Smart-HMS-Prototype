/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F2B4B",
        "sky-blue": "#2A7FBA",
        "soft-blue": "#EBF4FC",
        "emergency-red": "#D0021B",
        "healing-green": "#1A7A4A",
        background: "#F0F7FF",
        orange: "#FF8C00",
      },
      fontFamily: {
        "dm-serif": ['"DM Serif Display"', "serif"],
        nunito: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
