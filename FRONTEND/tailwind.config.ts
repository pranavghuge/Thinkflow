import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0e0f10",
        panel: "#16171a",
        "panel-raised": "#1d1e21",
        border: "#2b2d30",
        ink: "#e9e7e2",
        muted: "#a9adb2",
        accent: "#8eae93",
        "accent-muted": "#4e6152",
        warning: "#d6b16c",
        danger: "#d28a8a"
      },
      borderRadius: { sm: "0.375rem", md: "0.625rem", lg: "0.875rem" },
      boxShadow: { panel: "0 10px 30px rgba(0, 0, 0, 0.18)" }
    }
  },
  plugins: []
};

export default config;
