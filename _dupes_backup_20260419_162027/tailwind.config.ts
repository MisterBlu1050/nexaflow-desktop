import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        win: {
          taskbar: "hsl(var(--win-taskbar))",
          titlebar: "hsl(var(--win-titlebar))",
          window: "hsl(var(--win-window))",
          content: "hsl(var(--win-window-content))",
          blue: "hsl(var(--win-blue))",
          divider: "hsl(var(--win-divider))",
        },
        gmail: {
          red: "hsl(var(--gmail-red))",
          bg: "hsl(var(--gmail-bg))",
          sidebar: "hsl(var(--gmail-sidebar))",
          text: "hsl(var(--gmail-text))",
          muted: "hsl(var(--gmail-muted))",
          hover: "hsl(var(--gmail-hover))",
        },
        claude: {
          bg: "hsl(var(--claude-bg))",
          sidebar: "hsl(var(--claude-sidebar))",
          text: "hsl(var(--claude-text))",
          muted: "hsl(var(--claude-muted))",
          accent: "hsl(var(--claude-accent))",
          border: "hsl(var(--claude-border))",
          card: "hsl(var(--claude-card))",
        },
        status: {
          red: "hsl(var(--status-red))",
          orange: "hsl(var(--status-orange))",
          yellow: "hsl(var(--status-yellow))",
          green: "hsl(var(--status-green))",
          blue: "hsl(var(--status-blue))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
