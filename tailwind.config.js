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
        instrument: ["InstrumentSerif"]
      },
      colors: {
        "primary": "#B08050",
        "secondary": "#3A3A3B",
        "border": "#DFDFDF",
        "card": "#F1F1F1",
        "foreground": "#000000",
        "muted": "#7B7B7B",
        "text": "#464646"
      },
    },
  },
  plugins: [],
};