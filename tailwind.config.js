/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "rgb(var(--arena-bg) / <alpha-value>)",
          surface: "rgb(var(--arena-surface) / <alpha-value>)",
          card: "rgb(var(--arena-card) / <alpha-value>)",
          border: "rgb(var(--arena-border) / <alpha-value>)",
          line: "rgb(var(--arena-line) / <alpha-value>)",
          green: "rgb(var(--arena-green) / <alpha-value>)",
          greenDim: "rgb(var(--arena-green-dim) / <alpha-value>)",
          amber: "rgb(var(--arena-amber) / <alpha-value>)",
          blue: "rgb(var(--arena-blue) / <alpha-value>)",
          blueDim: "rgb(var(--arena-blue-dim) / <alpha-value>)",
          red: "rgb(var(--arena-red) / <alpha-value>)",
          muted: "rgb(var(--arena-muted) / <alpha-value>)",
          text: "rgb(var(--arena-text) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--arena-green)), 0 0 24px -8px rgb(var(--arena-green))",
      },
      keyframes: {
        "readout-in": {
          "0%": { opacity: "0", transform: "translateY(0.45em)", filter: "blur(1px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
      },
      animation: {
        "readout-in": "readout-in 450ms cubic-bezier(.2,.9,.2,1)",
      },
    },
  },
  plugins: [],
};
