import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KLYRO — find your people and build",
  description: "KLYRO connects builders, designers, and vibe coders around new projects."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}