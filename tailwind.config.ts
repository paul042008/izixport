import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate"; 

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Professional B2B Marketplace Colors
        brand: {
          navy: "#1a2342",       // primary - headers, buttons
          slate: "#475569",      // secondary - text hierarchy
          teal: "#0891b2",       // accent - CTAs, highlights
          azure: "#0284c7",      // alt accent - secondary actions
          charcoal: "#0f172a",   // darkest - backgrounds, strong text
          neutral50: "#f9fafb",  // lightest backgrounds
          neutral100: "#f3f4f6", // card backgrounds
          neutral200: "#e5e7eb", // borders, dividers
          neutral400: "#9ca3af", // muted text
          neutral600: "#4b5563", // secondary text
          neutral800: "#1f2937", // primary text
          white: "#ffffff",
          success: "#059669",    // success states
          warning: "#d97706",    // warnings
          error: "#dc2626",      // errors
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "sans-serif"], // headings, hero
        heading: ["Barlow", "sans-serif"],              // section titles, card headings
        body: ["Inter", "sans-serif"],                  // paragraphs, form labels
        mono: ['"JetBrains Mono"', "monospace"],        // prices, quantities, tracking IDs
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;