import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        panel: "hsl(var(--panel))",
        border: "hsl(var(--border))",
        accent: "hsl(var(--accent))",
        chrome1: "hsl(var(--chrome1))",
        chrome2: "hsl(var(--chrome2))",
        chrome3: "hsl(var(--chrome3))",
        glow: "hsl(var(--glow))"
      },
      borderRadius: {
        xl: "14px"
      }
    }
  },
  plugins: []
} satisfies Config;
