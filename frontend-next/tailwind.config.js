/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // CRM palette — CSS vars hold RGB channels so /opacity modifiers work.
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        sidebar: "rgb(var(--sidebar) / <alpha-value>)",
        "sidebar-hover": "rgb(var(--sidebar-hover) / <alpha-value>)",
        "sidebar-text": "rgb(var(--sidebar-text) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        // Layered, soft elevation (taste: subtle depth, not harsh drop shadows).
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        lift: "0 4px 12px -2px rgba(16,24,40,.08), 0 2px 6px -2px rgba(16,24,40,.06)",
        pop: "0 12px 32px -4px rgba(16,24,40,.16), 0 4px 12px -4px rgba(16,24,40,.08)",
        glow: "0 0 0 1px rgb(var(--brand-600) / .15), 0 8px 24px -6px rgb(var(--brand-600) / .25)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "scale-in": {
          from: { opacity: 0, transform: "translateY(8px) scale(.98)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "fade-up": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in .18s ease-out",
        "scale-in": "scale-in .2s cubic-bezier(.16,1,.3,1)",
        "fade-up": "fade-up .4s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};
