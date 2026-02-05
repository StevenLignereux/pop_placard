/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
          DEFAULT: "#005BBB", // Bleu Secours Populaire
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F2F2F2", // Gris clair
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#005BBB", // Bleu (same as primary)
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#28A745", // Vert standard (kept for semantics but minimized)
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F2F2F2", // Gris clair
          foreground: "#6B7280",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        zoomIn: 'zoomIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
