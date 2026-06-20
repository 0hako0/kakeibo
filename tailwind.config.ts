import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        line: "#d8dee6",
        paper: "#fbfcfe"
      }
    }
  },
  plugins: []
};

export default config;
