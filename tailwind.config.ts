import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink: "#101018", panel: "#171720", violet: "#9077ff", mint: "#a5f3d0" }, fontFamily: { sans: ["Arial", "sans-serif"] } } }, plugins: [] };
export default config;