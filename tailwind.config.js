/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter"],
        "inter-medium": ["InterMedium"],
        "inter-semibold": ["InterSemiBold"],
        "inter-bold": ["InterBold"],
        oleo: ["OleoScriptSwashCaps"],
      },
      colors: {
        "primary": "#B08050",
        "border": "#DFDFDF",
        "card": "#F1F1F1",
        "foreground": "#000000",
        "muted": "#7B7B7B",
      },
    },
  },
  plugins: [],
};