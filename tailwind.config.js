/** @type {import('tailwindcss').Config} */
// Same "Sunrise Teal" tokens as billsteady-landing (src/styles/global.css's
// @theme block) - the app and the landing page should read as one product.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        sunrise: {
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        cream: {
          DEFAULT: "#fffbf2",
          100: "#fff6e5",
        },
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgb(15 118 110 / 0.18)",
        "soft-sunrise": "0 8px 24px -8px rgb(217 119 6 / 0.22)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
