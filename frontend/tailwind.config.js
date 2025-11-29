/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        surface: "#FFFFFF",
        primary: "#2563EB",
        accent: "#06B6D4",
        text: {
          primary: "#0F172A",
          secondary: "#475569",
        },
        error: "#EF4444",
        success: "#10B981",
        border: {
          subtle: "rgba(15,23,42,0.06)",
        },
      },
      borderRadius: {
        small: "8px",
        medium: "12px",
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        h1: ["28px", { lineHeight: "1.4", fontWeight: "700" }],
        "h1-lg": ["32px", { lineHeight: "1.4", fontWeight: "700" }],
        h2: ["22px", { lineHeight: "1.5", fontWeight: "600" }],
        "h2-lg": ["26px", { lineHeight: "1.5", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "1.5", fontWeight: "600" }],
        "h3-lg": ["20px", { lineHeight: "1.5", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.6", fontWeight: "400" }],
      },
      spacing: {
        unit: "8px",
      },
      maxWidth: {
        container: "1200px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
      },
      transitionDuration: {
        hover: "150ms",
        modal: "250ms",
      },
    },
  },
  plugins: [],
}


