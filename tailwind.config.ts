import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm off-white canvas
        cream: "#FFFCF6",
        // Ellie & Grace's four favorite colors
        bubblegum: {
          50: "#FFF1F7",
          100: "#FFE0EE",
          200: "#FFC2DD",
          300: "#FF9CC6",
          400: "#FF6FAD",
          500: "#FF4D97",
          600: "#E63385",
        },
        sunshine: {
          50: "#FFFBEA",
          100: "#FFF4C2",
          200: "#FFE98F",
          300: "#FFDD5C",
          400: "#FFD12E",
          500: "#FBBF12",
        },
        grape: {
          50: "#F5EEFF",
          100: "#E9DBFF",
          200: "#D4BBFF",
          300: "#BC95FF",
          400: "#A471FF",
          500: "#8B4DFF",
          600: "#7232E6",
        },
        sky: {
          50: "#EAF5FF",
          100: "#D0E9FF",
          200: "#A6D4FF",
          300: "#76BCFF",
          400: "#46A1FF",
          500: "#1F86F5",
          600: "#0F6BD6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(139, 77, 255, 0.18)",
        card: "0 6px 24px -10px rgba(255, 77, 151, 0.20)",
        lift: "0 16px 50px -16px rgba(31, 134, 245, 0.28)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pop: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        pop: "pop 150ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
