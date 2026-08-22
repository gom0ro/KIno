import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "rgb(var(--base-950) / <alpha-value>)",
          900: "rgb(var(--base-900) / <alpha-value>)",
          800: "rgb(var(--base-800) / <alpha-value>)",
          700: "rgb(var(--base-700) / <alpha-value>)",
        },
        fg: "rgb(var(--fg) / <alpha-value>)",
        accent: {
          DEFAULT: "#e50914",
          hover: "#f6121d",
        },
        zinc: {
          100: "rgb(var(--z-100) / <alpha-value>)",
          200: "rgb(var(--z-200) / <alpha-value>)",
          300: "rgb(var(--z-300) / <alpha-value>)",
          400: "rgb(var(--z-400) / <alpha-value>)",
          500: "rgb(var(--z-500) / <alpha-value>)",
          600: "rgb(var(--z-600) / <alpha-value>)",
        },
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
