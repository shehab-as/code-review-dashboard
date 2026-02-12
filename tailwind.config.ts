import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        alert: {
          stale: '#F59E0B',      // Amber for >3 days
          critical: '#EF4444',    // Red for no reviewers/failing CI
          warning: '#F97316',     // Orange
        }
      },
    },
  },
  plugins: [],
};
export default config;
