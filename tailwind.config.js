/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cyber-dark": "#0a0a0a",
        "cyber-darker": "#050505",
        "cyber-blue": "#00d4ff",
        "cyber-green": "#00ff88",
        "cyber-red": "#ff0066",
        "cyber-purple": "#8b5cf6",
        "cyber-gray": "#1a1a1a",
        "cyber-border": "#333333",
      },
      fontFamily: {
        mono: ["Courier New", "monospace"],
        tech: ["system-ui", "sans-serif"],
      },
      boxShadow: {
        cyber: "0 0 20px rgba(0, 212, 255, 0.3)",
        "cyber-green": "0 0 20px rgba(0, 255, 136, 0.3)",
        "cyber-red": "0 0 20px rgba(255, 0, 102, 0.3)",
      },
      backgroundImage: {
        "cyber-gradient": "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      },
    },
  },
  plugins: [],
};
