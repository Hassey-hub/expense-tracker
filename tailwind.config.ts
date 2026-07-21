import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          950: "#062E22",
          900: "#0B4531",
          800: "#0F6B4C", // vert principal (croissance / argent)
          700: "#15825D",
          600: "#1A9B70",
          100: "#DDF3E7",
          50: "#F3FBF7",
        },
        gold: {
          600: "#B8860B",
          500: "#D4A017", // accent or (pièces / FCFA)
          100: "#FBEFCB",
        },
        ink: {
          900: "#151B18",
          700: "#3B453F",
          500: "#6B7570",
          300: "#A7AFAA",
          100: "#E7EBE8",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
