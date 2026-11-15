/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121410",
        olive: "#4d6a10",
        "olive-hover": "#5a7c14",
        green: "#6f9a0c",
        lime: "#b4cd52",
        pill: "#e7efcf",
        line: "#eef0ea",
        sage: "#e9eee0",
        sakura: "#f6c4d6",
        "sakura-light": "#fef5f8",
        background: "hsl(var(--background, 201 100% 13%) / <alpha-value>)",
        foreground: "hsl(var(--foreground, 0 0% 100%) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground, 240 4% 66%) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        tight: ['"Inter Tight"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '22': '22px',
      }
    },
  },
  plugins: [],
}
