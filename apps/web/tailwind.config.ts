import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#1a1f2e",
        panel: {
          DEFAULT: "#26314f",
          deep: "#1e2740",
          mid: "#324368",
        },
        rim: {
          DEFAULT: "#5b6f99",
          bright: "#8aa0cc",
        },
        neon: {
          DEFAULT: "#f4c95d",
          dim: "#e8b923",
          soft: "#7a5800",
        },
        foe: {
          DEFAULT: "#ff9d57",
          dim: "#d97030",
          soft: "#6b3810",
        },
        text: {
          primary: "#edf2ff",
          muted: "#a8b4d1",
          muted2: "#6a789a",
        },
        cyber: {
          purple: "#9c6bff",
          violet: "#8c7cff",
          pink: "#ff8dc7",
          sky: "#6fa7ff",
          teal: "#7ce7c0",
        },
        life: {
          green: "#4ecb71",
          red: "#ff6d6d",
        },
        "card-unit": "#7a4a1e",
        "card-spell": "#1e4a8a",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Menlo", "monospace"],
        impact: ["var(--font-impact)", "Impact", "sans-serif"],
      },
      boxShadow: {
        "glow-neon":      "0 0 14px rgba(244,201,93,0.6)",
        "glow-neon-lg":   "0 0 28px rgba(244,201,93,0.8)",
        "glow-neon-ring": "0 0 0 2px #f4c95d, 0 0 22px rgba(244,201,93,0.5)",
        "glow-foe":       "0 0 14px rgba(255,157,87,0.6)",
        "glow-foe-lg":    "0 0 28px rgba(255,157,87,0.8)",
        "glow-foe-ring":  "0 0 0 2px #ff9d57, 0 0 22px rgba(255,157,87,0.5)",
        "glow-cyber":     "0 0 18px rgba(156,107,255,0.6)",
        "glow-pink":      "0 0 14px rgba(255,141,199,0.6)",
        "glow-red":       "0 0 14px rgba(255,109,109,0.55)",
        "panel-sm":       "0 2px 8px rgba(0,0,0,0.35)",
        "panel":          "0 4px 16px rgba(0,0,0,0.45)",
        "panel-lg":       "0 8px 32px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
}

export default config
