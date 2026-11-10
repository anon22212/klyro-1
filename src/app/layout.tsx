import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "VibeTeam — найди свою команду", description: "Соединяем вайбкодеров для совместных проектов" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ru"><body>{children}</body></html>; }